const http = require('http');

const data = JSON.stringify({
  title: 'جمعية أصدقاء العمل',
  amount: 2000,
  total_months: 12,
  start_date: '2026-12-01',
  description: 'جمعية شهرية لقيمة السهم 2000 جنيه مع إمكانية الاشتراك بكسور الأسهم'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/gamayas',
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
    console.log('--- استجابة إنشاء الجمعية ---');
    console.log(body);
  });
});

req.on('error', (error) => {
  console.error('حدث خطأ:', error);
});

req.write(data);
req.end();