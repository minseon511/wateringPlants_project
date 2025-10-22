const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');
const { SerialPort } = require('serialport');

const app = express();
const port = process.env.PORT || 4000;
const baudRate = 115200;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Static files

// 초기 센서 데이터
let sensorData = {
  temperature: null,
  humidity: null,
  soil_moisture: null,
  sensor_id: null,
};

// MySQL 연결 설정
const db = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
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

// GET: 기본 경로에 대한 처리
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST: 센서 데이터 업데이트 (온습도 및 토양 수분)
app.post('/api/sensor', (req, res) => {
  const { sensor_id, temperature, humidity, soil_moisture } = req.body;

  if (sensor_id === 0 && temperature !== undefined && humidity !== undefined) {
    // 온습도 데이터 처리
    sensorData = { sensor_id, temperature, humidity };
    console.log('온습도 데이터 업데이트:', sensorData);

    // 데이터베이스에 삽입
    insertEnvDataIntoDatabase(sensorData);
    res.json({ message: '온습도 데이터가 성공적으로 저장되었습니다.', data: sensorData });
  } else if (sensor_id === 1 && soil_moisture !== undefined) {
    // 토양 수분 데이터 처리
    sensorData = { sensor_id, soil_moisture };
    console.log('토양 수분 데이터 업데이트:', sensorData);

    // 데이터베이스에 삽입
    insertSoilDataIntoDatabase(sensorData);
    res.json({ message: '토양 수분 데이터가 성공적으로 저장되었습니다.', data: sensorData });
  } else {
    res.status(400).json({ message: '잘못된 데이터 형식입니다.' });
  }
});

// 온습도 데이터 삽입 함수
function insertEnvDataIntoDatabase({ sensor_id, temperature, humidity }) {
  const query = `
    INSERT INTO envreadings (sensor_id, temperature, humidity) 
    VALUES (?, ?, ?)
  `;

  db.query(query, [sensor_id, temperature, humidity], (err, results) => {
    if (err) {
      console.error('온습도 데이터 삽입 오류:', err.message);
      return;
    }
    console.log('온습도 데이터를 성공적으로 삽입했습니다:', { sensor_id, temperature, humidity });
  });
}

// 토양 수분 데이터 삽입 함수
function insertSoilDataIntoDatabase({ sensor_id, soil_moisture }) {
  const query = `
    INSERT INTO soilreadings (sensor_id, soil_moisture) 
    VALUES (?, ?)
  `;

  db.query(query, [sensor_id, soil_moisture], (err, results) => {
    if (err) {
      console.error('토양 수분 데이터 삽입 오류:', err.message);
      return;
    }
    console.log('토양 수분 데이터를 성공적으로 삽입했습니다:', { sensor_id, soil_moisture });
  });
}

// 시리얼 포트 설정 및 데이터 처리
SerialPort.list()
  .then((ports) => {
    if (ports.length === 0) {
      console.error('사용 가능한 시리얼 포트가 없습니다.');
      return;
    }

    let comName = ports.find((port) => port.manufacturer && port.manufacturer.includes('Arduino'))?.path;
    if (!comName) {
      comName = ports[0].path;
      console.warn('Arduino를 찾지 못해 첫 번째 COM 포트를 사용합니다:', comName);
    } else {
      console.log('Arduino가 발견되었습니다:', comName);
    }

    const port = new SerialPort({ path: comName, baudRate }, (err) => {
      if (err) {
        console.error('시리얼 포트 열기 오류:', err);
        return;
      }
      console.log('시리얼 포트가 열렸습니다:', comName);
    });

    port.on('data', (dataBuf) => {
      const dataStr = dataBuf.toString().trim();
      console.log('시리얼 데이터 수신:', dataStr);

      if (dataStr.includes(',')) {
        // 온습도 데이터일 경우 (예: "0,25.5,60.2")
        const [sensor_id, temperature, humidity] = dataStr.split(',');
        if (parseInt(sensor_id) === 0) {
          insertEnvDataIntoDatabase({
            sensor_id: parseInt(sensor_id),
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
          });
        }
      } else if (dataStr.includes(':')) {
        // 토양 수분 데이터일 경우 (예: "1:300")
        const [sensor_id, soil_moisture] = dataStr.split(':');
        if (parseInt(sensor_id) === 1) {
          insertSoilDataIntoDatabase({
            sensor_id: parseInt(sensor_id),
            soil_moisture: parseInt(soil_moisture),
          });
        }
      } else {
        console.error('알 수 없는 데이터 형식:', dataStr);
      }
    });
  })
  .catch((err) => {
    console.error('시리얼 포트 조회 오류:', err);
  });

// GET: 시간별 온습도 데이터 조회
app.get('/api/envData', (req, res) => {
  const query = `
    SELECT 
      HOUR(timestamp) AS hour, 
      AVG(temperature) AS avg_temperature, 
      AVG(humidity) AS avg_humidity 
    FROM 
      envreadings 
    WHERE 
      /* === 1. 수정된 부분 (KST 기준 '오늘' 날짜) === */
      /* UTC를 Asia/Seoul로 변환한 날짜를 기준으로 합니다. */
      DATE(timestamp) = DATE(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'))
    GROUP BY 
      hour
    ORDER BY 
      hour ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('시간별 데이터 조회 오류:', err);
      res.status(500).json({ error: '시간별 데이터 조회 오류' });
      return;
    }

    /* === 2. 수정된 부분 (0시~23시 모두 포함) === */
    const timeLabels = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 
      12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
    ];
    
    const data = {
      // 레이블을 24시간 형식으로 만듭니다 (예: '00', '01', ... '23')
      labels: timeLabels.map((label) => label.toString().padStart(2, '0')), 
      temperatureData: [],
      humidityData: [],
    };

    // 시간대별로 데이터 매칭
    timeLabels.forEach((hour) => {
      // results에서 현재 hour와 일치하는 레코드를 찾습니다.
      const record = results.find((r) => r.hour == hour);
      // 레코드가 있으면 avg_temperature를, 없으면 null을 추가합니다.
      data.temperatureData.push(record ? record.avg_temperature : null);
      data.humidityData.push(record ? record.avg_humidity : null);
    });

    res.json(data);
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 시작되었습니다.`);
});

//http://localhost:4000/api/sensorData
