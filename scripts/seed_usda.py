#!/usr/bin/env python3
"""Convenience wrapper to seed the USDA database from the project root."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from backend.db.seed import seed

if __name__ == "__main__":
    seed()
