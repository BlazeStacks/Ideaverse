import sys
from pathlib import Path

# Make `import main`, `import ai_response` ... work when running `pytest` from
# the backend directory, matching how `uvicorn main:app` resolves modules.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
