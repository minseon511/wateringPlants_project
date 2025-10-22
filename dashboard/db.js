const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
  host: '127.0.0.1', // IP 주소만 입력
  port: 3306, // 포트 번호는 별도로 지정
  user: 'thinkingchair',
  password: '123456789',
  database: 'jahwasu',
});

// simple query
connection.query('SELECT * FROM plants', function (err, result, fields) {
  if (err) {
    console.error('Error executing query:', err);
    return;
  }
  console.log('Result:', result);
  console.log('Fields:', fields);
});
