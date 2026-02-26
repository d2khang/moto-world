@echo off
title CHAY BACKEND - MOTO WORLD
cd /d D:\moto-world
:: Kich hoat moi truong ao
call .\.venv\Scripts\activate
:: Chay Backend bang lenh "lach" de tranh bi chan DLL
cd backend
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
pause