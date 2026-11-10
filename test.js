const http = require('http');

const data = JSON.stringify({
  name: 'أحمد الغرابلي',
  phone: '01012345678'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('--- استجابة السيرفر ---');
    console.log(body);
  });
});

req.on('error', (error) => {
  console.error('حدث خطأ:', error);
});

req.write(data);
req.end();