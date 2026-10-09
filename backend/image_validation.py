"""Validation of uploaded images.

Deliberately free of FastAPI so it can be unit-tested on its own.

Decompression-bomb handling follows Pillow's documented guidance
(https://pillow.readthedocs.io/en/stable/reference/Image.html#PIL.Image.open):
the pixel-count safety check is never disabled. Pillow reads only the header in
``Image.open``, so the declared dimensions are checked *before* any pixel data
is decoded. A small compressed file can declare billions of pixels, which is
why the 8 MB byte limit alone is not enough.

* ``Image.MAX_IMAGE_PIXELS`` is lowered to this application's own limit, so
  Pillow's built-in check is stricter than its default (about 89 million).
* Pillow emits ``DecompressionBombWarning`` between 1x and 2x the limit and
  raises ``DecompressionBombError`` above 2x. The warning is promoted to an
  error here, and the error is translated into a clean HTTP 413 instead of an
  unhandled 500 (``DecompressionBombError`` is not an ``OSError``).
"""

import warnings
from io import BytesIO

from PIL import Image, UnidentifiedImageError

# Largest accepted image, in pixels (50 megapixels, about 7000 x 7000). Enough
# for any current phone camera photo; far below what a bomb declares.
MAX_IMAGE_PIXELS = 50_000_000

# Make Pillow's own guard at least as strict as ours.
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

SUPPORTED_MIME_TYPES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}


class ImageRejected(Exception):
    """The upload is not acceptable. Carries the HTTP status and a safe message."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def validate_image_bytes(image_bytes: bytes) -> str:
    """Return the MIME type of a supported image, or raise ``ImageRejected``.

    Checks the real content (not the file name or declared MIME type), the
    format whitelist, and the declared pixel count. Does not decode pixel data.
    """
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(image_bytes)) as image:
                image_format = image.format
                width, height = image.size

                if image_format not in SUPPORTED_MIME_TYPES:
                    raise ImageRejected(415, "Upload a JPEG, PNG, or WEBP image")

                if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                    raise ImageRejected(
                        413,
                        "Image dimensions are too large. Use an image of "
                        f"{MAX_IMAGE_PIXELS // 1_000_000} megapixels or less.",
                    )

                image.verify()

        return SUPPORTED_MIME_TYPES[image_format]

    except ImageRejected:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise ImageRejected(
            413,
            "Image dimensions are too large. Use an image of "
            f"{MAX_IMAGE_PIXELS // 1_000_000} megapixels or less.",
        )
    except UnidentifiedImageError:
        raise ImageRejected(400, "The uploaded file is not a readable image")
    except Exception:
        # Corrupt or truncated data can surface as OSError, SyntaxError,
        # ValueError, EOFError or struct.error depending on the format.
        raise ImageRejected(400, "The uploaded image could not be read")
