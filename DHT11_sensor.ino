#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <DHT.h>

#define DHTPIN D4         // DHT11 센서가 연결된 핀
#define DHTTYPE DHT11     // 사용 중인 DHT 센서 타입

// 센서 ID 설정
int sensor_id = 0;  // 온습도 센서 ID를 0으로 고정

const char* ssid = "HJY";  // WiFi SSID
const char* password = "123456789";  // WiFi 비밀번호
const String serverName = "http://192.168.137.98:4000/api/sensor"; // 서버 주소

DHT dht(DHTPIN, DHTTYPE);

void setup() { 
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password); 
  
  while (WiFi.status() != WL_CONNECTED) { 
    delay(1000); 
    Serial.println("Connecting to WiFi.."); 
  } 
  Serial.println("Connected to the WiFi network"); 
}
    
void loop() { 
  // 시리얼 모니터로부터 입력 확인
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim(); // 명령어 앞뒤의 공백 제거

    // "exit" 입력 시 프로그램 종료
    if (command.equals("exit")) {
      Serial.println("Exiting...");
      while (true) {
        delay(1); // 무한 루프를 돌며 프로그램을 멈춤
      }
    }
  }

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  String timestamp = String(millis()); // 밀리초 단위의 타임스탬프 생성

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // sensor_id가 0으로 고정된 JSON 데이터 생성
  String jsonPayload = "{\"sensor_id\": 0, \"timestamp\":\"" + timestamp + "\",\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + "}";
  Serial.println("Humidity :" + String(humidity) +","+ "Temperature :" + String(temperature));

  WiFiClient client;
  HTTPClient http; 
  http.begin(client, serverName);  
  http.addHeader("Content-Type", "application/json");  // 요청 헤더 설정

  int httpResponseCode = http.POST(jsonPayload); 

  if (httpResponseCode > 0) {  
    String response = http.getString(); 
    Serial.println(httpResponseCode); 
    Serial.println(response); 
  } else { 
    Serial.print("Error on sending POST: "); 
    Serial.println(httpResponseCode); 
  } 

  http.end(); 
  delay(2000); 
}

