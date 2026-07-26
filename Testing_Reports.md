# Smart Flood Monitoring & Early Warning System - Comprehensive Test Report

**Project Title**: HydroGuard / FloodWatch CR - Smart Flood Monitoring & Early Warning Dashboard  
**Environment**: React 18 + Vite + Tailwind CSS  
**Dataset**: 43 Telemetry Records (`readings.json`) + Live ESP32 Hardware Simulator  
**Date**: July 26, 2026  
**Status**: All Tests Passed (20 / 20 Passed - 100% Success Rate)

---

## 🧪 Test Execution Matrix

| Test # | Input / Scenario | Expected Result | Actual Result | Pass/Fail |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | Telemetry reading with `water_level_m = 1.15` (< 1.50m) | Classified as `Safe`, green badge (`#22c55e`), pulse dot active | Classified as `Safe`, green badge (`#22c55e`), pulse dot active | **PASS** |
| **TC-02** | Telemetry reading with `water_level_m = 1.99` (1.50m - 2.49m) | Classified as `Warning`, amber badge (`#f59e0b`), alert icon shown | Classified as `Warning`, amber badge (`#f59e0b`), alert icon shown | **PASS** |
| **TC-03** | Telemetry reading with `water_level_m = 2.84` (≥ 2.50m) | Classified as `Danger`, red badge (`#ef4444`), pulsing red dot | Classified as `Danger`, red badge (`#ef4444`), pulsing red dot | **PASS** |
| **TC-04** | Telemetry reading with `water_level_m = null` (`RD-0029`) | Displayed as `"No Data"` in gray italic font; system does not crash | Displayed as `"No Data"` in gray italic font; system stable | **PASS** |
| **TC-05** | Negative sensor reading `water_level_m = -1.20` (`RD-0033`) | Flagged as `Anomaly` with warning icon (`AlertTriangle`) and diagnostic tooltip | Flagged as `Anomaly` with warning icon (`AlertTriangle`) and diagnostic tooltip | **PASS** |
| **TC-06** | Out-of-range sensor reading `water_level_m = 48.5` (`RD-0034`) | Flagged as `Anomaly` (>10m limit) with transducer calibration alert | Flagged as `Anomaly` (>10m limit) with transducer calibration alert | **PASS** |
| **TC-07** | Live search input: `"RD-0001"` | Filters table and hydrograph to display only record `RD-0001` | Filters table and hydrograph to display only record `RD-0001` | **PASS** |
| **TC-08** | Live search input: `"River A - North Dam"` | Filters view to display only readings matching location `"River A - North Dam"` | Filters view to display only readings matching location `"River A - North Dam"` | **PASS** |
| **TC-09** | Live search input: `"ESP32-05"` | Filters view to display only readings from node `"ESP32-05"` | Filters view to display only readings from node `"ESP32-05"` | **PASS** |
| **TC-10** | Status filter pill click: `Danger` | Table filters to show only 6 `Danger` records; counter updates to `Showing 1 to 6 of 6` | Table filters to show only 6 `Danger` records; counter updates to `Showing 1 to 6 of 6` | **PASS** |
| **TC-11** | Click column header: `Water Level (m)` | Table sorts rows in descending water level order; highest valid level first | Table sorts rows in descending water level order; highest valid level first | **PASS** |
| **TC-12** | Click column header: `Recorded At` | Table sorts rows chronologically by ISO timestamp | Table sorts rows chronologically by ISO timestamp | **PASS** |
| **TC-13** | Pagination controls: Click `Next` page | Table updates to display records 11 to 20; page indicator shows `Page 2 of 5` | Table updates to display records 11 to 20; page indicator shows `Page 2 of 5` | **PASS** |
| **TC-14** | Click `"View Details"` on `RD-0001` | Modal opens showing metadata, alert status, and device `ESP32-02` mini hydrograph | Modal opens showing metadata, alert status, and device `ESP32-02` mini hydrograph | **PASS** |
| **TC-15** | Recharts Hydrograph threshold verification | Dashed reference line rendered at `1.5m` (Amber) and `2.5m` (Red) | Dashed reference line rendered at `1.5m` (Amber) and `2.5m` (Red) | **PASS** |
| **TC-16** | HC-SR04 Sensor Slider set to `32 cm` | Computes water level `(300 - 32) / 100 = 2.68m` (`Danger`) | Computes water level `2.68m` (`Danger`) | **PASS** |
| **TC-17** | Danger trigger in ESP32 Hardware Rig | Red LED (Pin 2) turns HIGH glowing red; Buzzer (Pin 4) emits 1kHz alert tone | Red LED (Pin 2) turns HIGH glowing red; Buzzer (Pin 4) emits 1kHz alert tone | **PASS** |
| **TC-18** | ESP32 Serial Monitor Output (115200 bps) | Logs format: `Raw distance: 32.0 cm \| {"water_level_m": 2.68, "status": "danger"}` | Logs format: `Raw distance: 32.0 cm \| {"water_level_m": 2.68, "status": "danger"}` | **PASS** |
| **TC-19** | Simulator packet emission | Dispatches payload to dashboard state; Summary Cards & Table update dynamically | Dispatches payload to dashboard state; Summary Cards & Table update dynamically | **PASS** |
| **TC-20** | Responsive Viewport resize (< 768px mobile) | Desktop table converts automatically into responsive stacked cards layout | Desktop table converts automatically into responsive stacked cards layout | **PASS** |

---

## 📊 Test Summary Statistics

- **Total Test Cases Executed**: 20
- **Passed**: 20 (100%)
- **Failed**: 0 (0%)
- **System Stability**: Verified under continuous simulation loop
- **Browser Compatibility**: Chrome, Edge, Firefox, Mobile Viewports
