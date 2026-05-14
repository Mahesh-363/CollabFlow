#!/usr/bin/env bash
set -o errexit
echo DATABASE_URL
pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed_demo
