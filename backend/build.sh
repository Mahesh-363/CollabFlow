#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Current Directory: $(pwd)"

# Navigate to where requirements.txt actually is
cd backend

echo "Installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Running Django commands..."
python manage.py collectstatic --no-input
python manage.py migrate