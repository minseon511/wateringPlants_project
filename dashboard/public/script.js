// 도넛 차트 설정 (예: 재배 현황)
var ctxPie = document.getElementById('pieChart').getContext('2d');
var pieChart = new Chart(ctxPie, {
  type: 'doughnut',
  data: {
    labels: ['바질', '장미'],
    datasets: [
      {
        data: [80, 20], // 초기 데이터
        backgroundColor: ['#339900', '#ff6384'],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
});

// 바 차트 설정 (실시간 수분량)
var ctxBar = document.getElementById('barChart').getContext('2d');
var barChart = new Chart(ctxBar, {
  type: 'bar',
  data: {
    labels: ['바질', '장미'],
    datasets: [
      {
        label: '수분량',
        data: [0, 0], // 초기값은 0으로 설정
        backgroundColor: ['#ff6384', '#36a2eb'],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // 범례(legend) 숨김
      },
    },
  },
});

// 데이터 업데이트 함수
function updateChartData(data) {
  // data 배열을 받아서 차트의 데이터를 업데이트
  barChart.data.datasets[0].data = data;
  barChart.update();
}

// 5초마다 서버로부터 데이터를 가져와서 업데이트
setInterval(function () {
  fetch('/api/sensorData') // 서버에서 '/api/sensorData' 경로로부터 데이터를 가져옴
    .then((response) => response.json())
    .then((sensorData) => {
      // 서버에서 바질과 장미의 최신 수분 데이터를 받아옴
      updateChartData([sensorData.basil, sensorData.rose]);
    })
    .catch((error) => console.error('Error fetching soil moisture data:', error));
}, 5000); // 5초마다 갱신

// 시간별 온습도 데이터 가져오기 및 차트 업데이트
function fetchGraphData() {
  fetch('/api/sensorData')
    .then((response) => response.json())
    .then((data) => {
      var ctxLine = document.getElementById('lineChart').getContext('2d');
      var lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: '온도',
              data: data.temperatureData, // Node.js에서 가져온 실제 데이터로 채움
              borderColor: '#36a2eb',
              fill: false,
              yAxisID: 'y-axis-temperature',
            },
            {
              label: '습도',
              data: data.humidityData, // Node.js에서 가져온 실제 데이터로 채움
              borderColor: '#ff6384',
              fill: false,
              yAxisID: 'y-axis-humidity',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [
              {
                id: 'y-axis-temperature',
                type: 'linear',
                position: 'left',
                ticks: {
                  beginAtZero: true,
                  suggestedMin: 0, // 최소값 설정
                  suggestedMax: 40, // 최대값 설정 (온도 범위에 맞게 조정)
                },
                scaleLabel: {
                  display: true,
                  labelString: '온도 (°C)',
                },
              },
              {
                id: 'y-axis-humidity',
                type: 'linear',
                position: 'right',
                ticks: {
                  beginAtZero: true,
                  suggestedMin: 0, // 최소값 설정
                  suggestedMax: 100, // 최대값 설정 (습도 범위에 맞게 조정)
                },
                scaleLabel: {
                  display: true,
                  labelString: '습도 (%)',
                },
              },
            ],
          },
        },
      });
    })
    .catch((error) => console.error('Error fetching graph data:', error));
}

// 현재 시간을 포맷팅하여 표시하는 함수
// 현재 시간을 포맷팅하여 표시하는 함수
function updateDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // 템플릿 리터럴 사용 (backtick으로 문자열을 감싸야 함)
  const formattedTime = `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;

  // ID가 'date-time'인 요소에 시간을 업데이트
  document.getElementById('date-time').textContent = formattedTime;
}

// 페이지 로드 시 데이터 가져오기 및 1초마다 시간 갱신
window.onload = function () {
  fetchGraphData();
  fetchSensorData();
  updateDateTime();
  setInterval(fetchSensorData, 5000); // 5초마다 센서 데이터 갱신
  setInterval(updateDateTime, 1000); // 1초마다 시간 갱신
};

// 센서 데이터 가져오는 함수
function fetchSensorData() {
  fetch('/api/sensor')
    .then((response) => response.json())
    .then((data) => {
      document.getElementById('temperature').textContent = data.temperature !== null ? data.temperature : 'N/A';
      document.getElementById('humidity').textContent = data.humidity !== null ? data.humidity : 'N/A';
    })
    .catch((error) => console.error('Error fetching sensor data:', error));
}
