#!/usr/bin/env bash
# exit on error
set -o errexit

# We are already in the root, so we move into backend
cd backend

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate