# HydroGuard CR - Smart Flood Monitoring & Early Warning System

## 🚨 Problem Statement
Unpredictable heavy rainfall and urban river overflow cause sudden catastrophic flooding, endangering communities without real-time telemetry oversight.  
This Smart Flood Monitoring Dashboard provides control-room operators with live sensor tracking, early warning alerts, and ESP32 hardware simulation to prevent disaster loss.

---

## 📹 Demonstration Video & Simulation Links

- 🎥 **YouTube Video Walkthrough**: [https://youtu.be/W9fqGsdbizA](https://youtu.be/W9fqGsdbizA)
- 🌐 **Wokwi ESP32 Live Simulation**: [https://wokwi.com/projects/470602393067091969](https://wokwi.com/projects/470602393067091969)

---

## ⚡ How to Run Your Work Step-by-Step

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### Installation & Execution

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/your-username/smart-flood-monitor.git
   cd smart-flood-monitor
   ```

2. **Install Project Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Local Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Dashboard**:
   Open your browser and navigate to **`http://localhost:3000`**.

---

## 📊 Data Schema: What Every Field Means

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `reading_id` | `String` | Unique telemetry packet identifier (e.g., `"RD-0001"`). |
| `location` | `String` | Name of the river, bridge, dam, or drainage canal monitoring point (e.g., `"River A - North Dam"`). |
| `device_id` | `String` | Microcontroller sensor node identifier (e.g., `"ESP32-02"`). |
| `water_level_m` | `Float` \| `null` | Measured water level in meters above riverbed (`null` if sensor is offline). |
| `status` | `String` | Health and risk status (`"safe"`, `"warning"`, `"danger"`, `"no_data"`, `"anomaly"`). |
| `recorded_at` | `ISO String` | Datetime timestamp of telemetry transmission (e.g., `"2026-07-26T06:00:00Z"`). |

---

## 📐 How Derived Figures Are Calculated

### 1. ESP32 HC-SR04 Water Level Calculation
The HC-SR04 ultrasonic sensor measures the distance $d$ (in cm) from the sensor (mounted $300\text{cm} = 3.0\text{m}$ above the riverbed) to the water surface:
$$\text{Water Level (m)} = \max\left(0, \frac{300.0 - \text{Smoothed Distance (cm)}}{100.0}\right)$$

### 2. 5-Sample Rolling Average Noise Filter
To eliminate wave spikes, a 5-sample moving average is calculated across ultrasonic readings:
$$\text{Smoothed Distance} = \frac{1}{5} \sum_{i=1}^{5} d_i$$

### 3. Status Classification Rules
- 🟢 **Safe**: $\text{Water Level} < 1.50\text{m}$
- 🟡 **Warning**: $1.50\text{m} \le \text{Water Level} < 2.50\text{m}$
- 🔴 **Danger**: $\text{Water Level} \ge 2.50\text{m}$ (Triggers Red LED on Pin 2 and 1kHz Buzzer Tone on Pin 4)
- ⚪ **No Data**: $\text{water\_level\_m} = \text{null}$
- ⚠️ **Anomaly**: $\text{water\_level\_m} < 0.0\text{m}$ or $\text{water\_level\_m} > 10.0\text{m}$

### 4. Summary Dashboard Aggregations
- **Highest Water Level**: $\max(\{ \text{water\_level\_m}_i \mid \text{water\_level\_m}_i \text{ is valid} \})$
- **Danger Count**: Total count of records with `status === "danger"`.
- **Warning Count**: Total count of records with `status === "warning"`.

---

## 🛠️ What Is Not Finished (Future Roadmap)

- 📡 **Physical MQTT/WebSocket Server Integration**: Currently reads local JSON and simulated ESP32 streams; direct physical hardware MQTT broker connection is planned for production deployment.
- 📱 **Automated SMS Emergency Alerts**: Integration with Twilio API to automatically broadcast SMS alerts to nearby residents when status transitions to `danger`.
- 🗄️ **Persistent Database Storage**: Backend integration with PostgreSQL / TimescaleDB for long-term historical multi-year flood archiving.

---

## 📸 Screenshots of Working Solution

### 1. Control Room Dashboard (Hydrograph & Telemetry Table)
![Dashboard Overview](https://raw.githubusercontent.com/your-username/smart-flood-monitor/main/screenshots/dashboard.png)

### 2. Wokwi ESP32 Circuit & Serial Output (Danger Trigger: LED + Buzzer)
![Wokwi ESP32 Circuit](https://raw.githubusercontent.com/your-username/smart-flood-monitor/main/screenshots/wokwi_circuit.png)

### 3. ESP32 Sensing Node Hardware Simulator Rig
![Sensing Node Simulator](https://raw.githubusercontent.com/your-username/smart-flood-monitor/main/screenshots/simulator.png)

### 4. Telemetry Anomaly & Detail View Modal
![Detail View Modal](https://raw.githubusercontent.com/your-username/smart-flood-monitor/main/screenshots/detail_modal.png)

---

## 📜 License & Academic Attribution
Created as an Academic Engineering Capstone Project. Open source under the MIT License.
