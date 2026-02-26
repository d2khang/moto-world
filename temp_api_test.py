import json
from urllib import request, parse

BASE = 'http://localhost:8000'

# 1) Register
register_url = BASE + '/api/auth/register'
register_data = {
    'username': 'testuser',
    'password': 'Password1',
    'full_name': 'Test User',
    'email': 'test@example.com',
    'phone_number': '0123456789'
}
req = request.Request(register_url, data=json.dumps(register_data).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with request.urlopen(req) as resp:
        print('REGISTER STATUS:', resp.status)
        print(resp.read().decode())
except Exception as e:
    if hasattr(e, 'code'):
        body = e.read().decode() if hasattr(e, 'read') else str(e)
        print('REGISTER ERROR', e.code, body)
    else:
        print('REGISTER EXCEPTION', str(e))

# 2) Login to get token
token_url = BASE + '/api/auth/token'
form = {'username': 'testuser', 'password': 'Password1'}
data = parse.urlencode(form).encode()
req = request.Request(token_url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
try:
    with request.urlopen(req) as resp:
        print('TOKEN STATUS:', resp.status)
        body = resp.read().decode()
        print(body)
        token = json.loads(body).get('access_token')
except Exception as e:
    if hasattr(e, 'code'):
        body = e.read().decode() if hasattr(e, 'read') else str(e)
        print('TOKEN ERROR', e.code, body)
        token = None
    else:
        print('TOKEN EXCEPTION', str(e))
        token = None

# 3) Call notifications with token
notif_url = BASE + '/api/orders/notifications'
headers = {}
if token:
    headers['Authorization'] = 'Bearer ' + token
req = request.Request(notif_url, headers=headers)
try:
    with request.urlopen(req) as resp:
        print('NOTIF STATUS:', resp.status)
        print(resp.read().decode())
except Exception as e:
    if hasattr(e, 'code'):
        body = e.read().decode() if hasattr(e, 'read') else str(e)
        print('NOTIF ERROR', e.code, body)
    else:
        print('NOTIF EXCEPTION', str(e))
