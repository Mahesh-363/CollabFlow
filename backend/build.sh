#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies 
# (We are already in the backend folder where requirements.txt lives)
pip install --upgrade pip
pip install -r requirements.txt

# Database and Static Files
python manage.py collectstatic --no-input
python manage.py migrate