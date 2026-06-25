# Build Guide: Hardware Prototype for Incremental Substitution

This guide describes the construction of a "Minimal Viable Prototype" (MVP) to demonstrate the principle of stepwise replacement of a biological neural circuit with a synthetic SNN (Spiking Neural Network).

## Goal of the Prototype
Simulation of a simple reflex arc, where a biological interneuron cluster is incrementally replaced by a microcontroller calculating the Izhikevich model in real-time.

## Required Hardware Components
1.  **Microcontroller (MCU):** ESP32 or ARM Cortex-M4 (e.g., Teensy 4.0) due to the required floating-point performance for the Izhikevich equations.
2.  **Analog-to-Digital Converter (ADC):** For capturing "biological" signals (simulated by analog sensors).
3.  **Digital-to-Analog Converter (DAC):** For outputting synthetic spikes.
4.  **Sensors:** 2x Potentiometers (simulation of membrane potentials) or EMG sensors for real biological inputs.
5.  **Actuators:** 1x Servo motor (simulation of motor output).
6.  **Breadboard & Jumper cables.**

---

## Step 1: Circuit Assembly
1.  Connect the analog sensors (input layer) to the ADC pins of the MCU.
2.  The microcontroller acts as a "Transitional Bridge."
3.  The output (DAC) controls the servo motor, representing the motor response.

## Step 2: Software Architecture (Firmware)
The firmware must support three modes that can be toggled via button press:

### A. Biological Reference Mode
The MCU passes the primary sensor signal directly (with minimal filtering) to the actuator.
*   *Code Logic:* `output = analogRead(sensorPin);`

### B. Hybrid Mode (Transition)
The MCU calculates an SNN with Izhikevich neurons. Some neurons receive input from the sensor, while others "respond" synthetically. Both signals are weighted and averaged.
*   *Izhikevich Implementation:*
    ```cpp
    v = v + 0.5 * (0.04 * v * v + 5 * v + 140 - u + I);
    u = u + 0.5 * a * (b * v - u);
    if (v >= 30) {
        v = c;
        u += d;
        digitalWrite(spikePin, HIGH);
    }
    ```

### C. Synthetic Mode
Control is handled 100% via the SNN. The biological sensor only serves as a "stimulus source" for the digital model.

---

## Step 3: Continuity Validation
To ensure scientific rigor, the following metrics must be output via the serial interface during operation:
1.  **Inter-Spike-Interval (ISI) Variance:** Comparison of the temporal intervals between biological and synthetic modes.
2.  **Latency Measurement:** Time delay from sensor input to servo reaction (Target: < 10ms).
3.  **Synchronization Index:** Cross-correlation of signal waveforms in Hybrid Mode.

## Step 4: Experimental Procedure
1.  Start in **Biological Mode** and calibrate the servo deflection.
2.  Incrementally switch the weighting to the **SNN** (in 10% steps).
3.  Observe whether the reflex arc (servo movement) remains smooth or if discontinuities (jittering) occur.

---

## Safety Note
This prototype is intended solely for laboratory simulation purposes. Direct coupling with living tissue requires medically certified galvanic isolation and ethical approval.
