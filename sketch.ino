const int trigPin = 5;
const int echoPin = 18;
const int ledPin = 2;
const int buzzerPin = 4;

float readings[5] = {0, 0, 0, 0, 0};
int idx = 0;
unsigned long lastRead = 0;
const unsigned long INTERVAL = 3000; // read every 3 seconds, non-blocking

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.println("Flood monitor node starting...");
}

float readDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  if (duration == 0) return -1; // no echo received

  float distance = duration * 0.034 / 2;
  return distance;
}

bool isPlausible(float val) {
  return (val > 0 && val < 400);
}

void loop() {
  if (millis() - lastRead >= INTERVAL) {
    lastRead = millis();
    float raw = readDistance();

    if (!isPlausible(raw)) {
      Serial.println("REJECTED: implausible or missing reading");
      noTone(buzzerPin);
      digitalWrite(ledPin, LOW);
      return;
    }

    readings[idx % 5] = raw;
    idx++;

    float sum = 0;
    for (int i = 0; i < 5; i++) sum += readings[i];
    float smoothed = sum / 5.0;

    // sensor mounted above water: smaller distance = higher water level
    // assume sensor is 3m (300cm) above the riverbed at max
    float waterLevel = (300.0 - smoothed) / 100.0;
    if (waterLevel < 0) waterLevel = 0;

    String status;
    if (waterLevel > 2.5) status = "danger";
    else if (waterLevel > 1.5) status = "warning";
    else status = "safe";

    // LED + buzzer react
    if (status == "danger") {
      digitalWrite(ledPin, HIGH);
      tone(buzzerPin, 1000); // 1kHz beep, continuous while in danger
    } else {
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
    }

    Serial.print("Raw distance: ");
    Serial.print(smoothed, 1);
    Serial.print(" cm | ");
    Serial.print("{\"water_level_m\": ");
    Serial.print(waterLevel, 2);
    Serial.print(", \"status\": \"");
    Serial.print(status);
    Serial.println("\"}");
  }
}