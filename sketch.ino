const int trigPin = 5;
const int echoPin = 18;
const int ledPin = 2;
const int buzzerPin = 4;

float readings[5] = {0, 0, 0, 0, 0};
int idx = 0;
unsigned long lastRead = 0;
const unsigned long INTERVAL = 3000; // read every 3 seconds, non-blocking

// CHANGE 1: danger threshold updated from 2.5m -> 3.0m
const float WARNING_THRESHOLD = 1.5;
const float DANGER_THRESHOLD = 3.0;

// CHANGE 2: manual fault injection via Serial, to demo broken sensor handling
float manualOverride = -999; // -999 means "no override, use real sensor"

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.println("Flood monitor node starting...");
  Serial.println("Type a number in Serial Monitor + Enter to simulate a sensor reading.");
  Serial.println("Try a negative number or a huge number (e.g. -5 or 999) to test fault handling.");
  Serial.println("Type 'reset' to go back to the real sensor.");
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

void checkSerialInput() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.equalsIgnoreCase("reset")) {
      manualOverride = -999;
      Serial.println(">> Override cleared. Using real sensor readings again.");
    } else {
      manualOverride = input.toFloat();
      Serial.print(">> Manual test value set: ");
      Serial.println(manualOverride);
    }
  }
}

void loop() {
  checkSerialInput(); // always listening for manual test input

  if (millis() - lastRead >= INTERVAL) {
    lastRead = millis();

    float raw;
    bool isManual = (manualOverride != -999);
    raw = isManual ? manualOverride : readDistance();

    if (!isPlausible(raw)) {
      // CHANGE 2 in action: broken/impossible reading is caught here,
      // treated as a FAULT, not passed through as a real measurement.
      Serial.print(isManual ? "[MANUAL TEST] " : "");
      Serial.print("REJECTED: implausible or missing reading (raw = ");
      Serial.print(raw);
      Serial.println(") -> SENSOR FAULT, no alarm triggered");
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
    float waterLevel = (400.0 - smoothed) / 100.0;
    if (waterLevel < 0) waterLevel = 0;

    String status;
    if (waterLevel > DANGER_THRESHOLD) status = "danger";
    else if (waterLevel > WARNING_THRESHOLD) status = "warning";
    else status = "safe";

    // LED + buzzer react
    if (status == "danger") {
      digitalWrite(ledPin, HIGH);
      tone(buzzerPin, 1000); // 1kHz beep, continuous while in danger
    } else {
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
    }

    Serial.print(isManual ? "[MANUAL TEST] " : "");
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
