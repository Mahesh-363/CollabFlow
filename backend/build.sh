#!/usr/bin/env bash
set -o errexit

cd backend

echo "DATABASE_URL is: $DATABASE_URL"

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate