#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// Wi-Fi 설정
const char* ssid = "iptime"; // WiFi SSID
const char* password = "123456789"; // WiFi 패스워드
const String serverName = "http://192.168.0.12:4000/api/sensor";  // Node.js 서버의 센서 데이터를 전송할 엔드포인트

// 핀 설정
int sensorPin = A0;   // 토양 수분 센서 핀
int sensor_id = 1;    // 토양 수분 센서 ID를 1로 고정

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  // Wi-Fi 연결 시도
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Wi-Fi 재연결 확인
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.println("Reconnecting to WiFi...");
    }
    Serial.println("Reconnected to WiFi");
  }

  // 토양 수분 값 읽기
  int soilMoistureValue = analogRead(sensorPin);
  Serial.print("Soil Moisture Value: ");
  Serial.println(soilMoistureValue);

  // 서버에 데이터 전송
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    // 서버 엔드포인트 설정
    http.begin(client, serverName); 
    http.addHeader("Content-Type", "application/json");

    // sensor_id가 1로 고정된 JSON 데이터 생성
    String jsonPayload = "{\"sensor_id\": 1, \"soil_moisture\": " + String(soilMoistureValue) + "}";

    // POST 요청 전송
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();  // 서버 응답 확인
      Serial.println(httpResponseCode); 
      Serial.println(response); 
    } else {
      Serial.print("Error on sending POST: "); 
      Serial.println(httpResponseCode); 
    }

    http.end();  // HTTP 연결 종료
  }

  delay(10000); // 10초 대기 후 다시 센서 값 전송
}

