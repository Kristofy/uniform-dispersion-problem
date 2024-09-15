SHELL := /bin/bash
.PHONY = make_python_env

#Python version: Python 3.10.12

make_python_env:
	python3 -m venv .venv
	source ./.venv/bin/activate && pip install -r requirements.txt

run:
	./.venv/bin/python main.py

async_run:
	./.venv/bin/python main.py async 0.2