const mysql = require('mysql2');

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'thinkingchair',
  password: '123456789',
  database: 'jahwasu',
});

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 오류:', err.message);
    return;
  }
  console.log('MySQL에 성공적으로 연결되었습니다.');
});

// 토양 수분 데이터를 MySQL에 삽입하는 함수
function insertSoilMoistureIntoDatabase(sensor_id, soil_moisture, timestamp) {
  const query = 'INSERT INTO SoilReadings (Sensor_id, Soil_moisture, Time) VALUES (?, ?, FROM_UNIXTIME(? / 1000))';

  db.query(query, [sensor_id, soil_moisture, timestamp], (err, result) => {
    if (err) {
      console.error('데이터 삽입 오류:', err.message);
      return;
    }
    console.log('토양 수분 데이터를 성공적으로 삽입했습니다. 삽입된 ID:', result.insertId);
  });
}

// JSON 데이터를 처리하고 MySQL에 삽입
function handleSensorData(jsonData) {
  const {sensor_id, soil_moisture, timestamp } = JSON.parse(jsonData);

  if (!sensor_id || !soil_moisture || !timestamp) {
    console.error('JSON 데이터 형식 오류:', jsonData);
    return;
  }

  insertSoilMoistureIntoDatabase(sensor_id, soil_moisture, timestamp);
}

// 예제 JSON 데이터 (실제 환경에서는 Wemos D1 Mini로부터 수신)
const exampleJsonData = '{"sensor_id":1,"soil_moisture":350,"timestamp":"12345678"}';
handleSensorData(exampleJsonData);
