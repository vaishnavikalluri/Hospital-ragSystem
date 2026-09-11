import sys
from pathlib import Path

# Add root directory to sys.path so pytest can find backend package
root_dir = Path(__file__).parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
