const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');
const { SerialPort } = require('serialport');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL 연결 설정
const db = mysql.createConnection({
  host: '127.0.0.1', // MySQL 서버 주소
  port: 3306, // MySQL 포트
  user: 'thinkingchair', // MySQL 사용자 이름
  password: '123456789', // MySQL 비밀번호
  database: 'jahwasu', // MySQL 데이터베이스 이름
});

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 오류:', err);
    return;
  }
  console.log('MySQL에 성공적으로 연결되었습니다.');
});

// 초기 센서 데이터
let sensorData = {
  sensor_id: null,
  soil_moisture: null,
  timestamp: null,
};

// GET: 기본 페이지 요청
app.get('/', (req, res) => {
  res.send('서버가 정상적으로 실행 중입니다. POST 요청을 사용하세요.');
});

// POST: 토양 수분 데이터 업데이트
app.post('/soil/sensor', (req, res) => {
  const { sensor_id, soil_moisture, timestamp } = req.body;

  // 센서 데이터 업데이트
  sensorData = {
    sensor_id,
    soil_moisture,
    timestamp: timestamp || new Date().toISOString(), // 타임스탬프가 없으면 현재 시간을 사용
  };

  console.log('sensorData 업데이트:', sensorData);

  // 데이터베이스에 삽입
  const query = 'INSERT INTO soilreadings (Sensor_id, Time, Soil_moisture) VALUES (?, ?, ?)';
  db.query(query, [sensor_id, sensorData.timestamp, soil_moisture], (err, results) => {
    if (err) {
      console.error('데이터 삽입 오류:', err.message);
      res.status(500).json({ error: '데이터 삽입 오류' });
      return;
    }
    console.log('토양 수분 데이터를 성공적으로 삽입했습니다:', sensorData);
    res.json({ message: 'Sensor data updated successfully', data: sensorData });
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 시작되었습니다.`);
});

//http://localhost:5000/soil/sensor
