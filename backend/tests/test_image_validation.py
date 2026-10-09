"""Image validation, including decompression-bomb handling.

These tests need only Pillow (no FastAPI, no network, no API key).
"""

import struct
import zlib
from io import BytesIO

import pytest
from PIL import Image, ImageFile

import image_validation
from image_validation import ImageRejected, validate_image_bytes


def encode(fmt: str, size=(16, 16), mode="RGB") -> bytes:
    buffer = BytesIO()
    Image.new(mode, size, "white").save(buffer, fmt)
    return buffer.getvalue()


def png_declaring(width: int, height: int) -> bytes:
    """A tiny PNG whose header *declares* width x height pixels (no pixel data).

    This is the shape of a decompression bomb: small on disk, huge once decoded.
    """

    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(b""))
        + chunk(b"IEND", b"")
    )


@pytest.mark.parametrize(
    "fmt, mime",
    [("JPEG", "image/jpeg"), ("PNG", "image/png"), ("WEBP", "image/webp")],
)
def test_supported_formats_are_accepted(fmt, mime):
    assert validate_image_bytes(encode(fmt)) == mime


def test_format_comes_from_content_not_extension():
    # Bytes are PNG regardless of what the upload was called.
    assert validate_image_bytes(encode("PNG")) == "image/png"


@pytest.mark.parametrize("fmt", ["GIF", "BMP", "TIFF"])
def test_other_image_formats_are_rejected_with_415(fmt):
    mode = "P" if fmt == "GIF" else "RGB"
    with pytest.raises(ImageRejected) as caught:
        validate_image_bytes(encode(fmt, mode=mode))
    assert caught.value.status_code == 415


@pytest.mark.parametrize(
    "payload",
    [b"not an image at all", b"\x00" * 64, b"<svg xmlns='http://www.w3.org/2000/svg'/>"],
)
def test_non_images_are_rejected_with_400(payload):
    with pytest.raises(ImageRejected) as caught:
        validate_image_bytes(payload)
    assert caught.value.status_code == 400


def test_truncated_image_is_rejected_with_400_not_a_crash():
    data = encode("PNG", size=(64, 64))
    with pytest.raises(ImageRejected) as caught:
        validate_image_bytes(data[: len(data) // 2])
    assert caught.value.status_code == 400


def test_decompression_bomb_beyond_pillow_hard_limit_is_rejected_with_413():
    # 60000 x 60000 = 3.6 billion pixels: far past 2x the limit, where Pillow
    # raises DecompressionBombError (not an OSError).
    data = png_declaring(60000, 60000)
    assert len(data) < 200
    with pytest.raises(ImageRejected) as caught:
        validate_image_bytes(data)
    assert caught.value.status_code == 413
    assert "too large" in caught.value.detail


def test_image_between_one_and_two_times_the_limit_is_rejected_with_413():
    # 8000 x 8000 = 64 MP: above the 50 MP limit but below 2x, where Pillow
    # only *warns*. The warning must not become a silent pass.
    with pytest.raises(ImageRejected) as caught:
        validate_image_bytes(png_declaring(8000, 8000))
    assert caught.value.status_code == 413


def test_pillow_safety_check_is_not_disabled():
    assert Image.MAX_IMAGE_PIXELS is not None
    assert Image.MAX_IMAGE_PIXELS <= image_validation.MAX_IMAGE_PIXELS


def test_pixel_limit_boundary(monkeypatch):
    monkeypatch.setattr(image_validation, "MAX_IMAGE_PIXELS", 100)
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", 100)
    assert validate_image_bytes(encode("PNG", size=(10, 10))) == "image/png"  # 100 px
    with pytest.raises(ImageRejected) as caught:
        validate_image_bytes(encode("PNG", size=(11, 10)))  # 110 px
    assert caught.value.status_code == 413


def test_rejection_messages_do_not_leak_library_internals():
    with pytest.raises(ImageRejected) as caught:
        validate_image_bytes(b"not an image at all")
    assert "PIL" not in caught.value.detail
    assert "cannot identify" not in caught.value.detail


def test_large_jpeg_is_checked_without_a_full_size_decode(monkeypatch):
    """A near-limit JPEG must be validated from its header, not decoded.

    The image is generated *first*, and only then are the decoders made to fail
    loudly. (Patching before generating would break the test's own set-up, which
    is itself an image decode.) If ``validate_image_bytes`` ever starts decoding
    pixel data, these stubs raise and the test fails.
    """
    # 7000 x 7000 = 49 MP: just under the 50 MP limit, so it is a valid upload.
    large_jpeg = encode("JPEG", size=(7000, 7000), mode="L")
    assert 7000 * 7000 <= image_validation.MAX_IMAGE_PIXELS

    def forbidden_decode(self, *args, **kwargs):
        raise AssertionError("validate_image_bytes decoded full-size pixel data")

    monkeypatch.setattr(ImageFile.ImageFile, "load", forbidden_decode)
    monkeypatch.setattr(Image.Image, "load", forbidden_decode)

    assert validate_image_bytes(large_jpeg) == "image/jpeg"

