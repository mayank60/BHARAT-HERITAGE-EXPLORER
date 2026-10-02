#!/usr/bin/env python3
"""
Root entry point for Bharat Heritage Explorer Python Backend.
Proxies to backend/app.py.
"""
import os
import sys

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.chdir(backend_dir)

# Execute the backend application
with open(os.path.join(backend_dir, 'app.py'), encoding='utf-8') as f:
    code = compile(f.read(), os.path.join(backend_dir, 'app.py'), 'exec')
    exec(code, {'__name__': '__main__', '__file__': os.path.join(backend_dir, 'app.py')})
