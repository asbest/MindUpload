# Bauanleitung: Hardware-Prototyp zur Inkrementellen Substitution

Diese Anleitung beschreibt den Aufbau eines "Minimal Viable Prototypes" (MVP), um das Prinzip der schrittweisen Ersetzung eines biologischen neuronalen Schaltkreises durch ein synthetisches SNN (Spiking Neural Network) zu demonstrieren.

## Ziel des Prototyps
Simulation eines einfachen Reflexbogens, bei dem ein biologischer Interneuron-Cluster schrittweise durch einen Mikrocontroller ersetzt wird, der das Izhikevich-Modell in Echtzeit berechnet.

## Benötigte Hardware-Komponenten
1.  **Mikrocontroller (MCU):** ESP32 oder ARM Cortex-M4 (z. B. Teensy 4.0) aufgrund der benötigten Fließkomma-Leistung für die Izhikevich-Gleichungen.
2.  **Analog-Digital-Wandler (ADC):** Zur Erfassung von "biologischen" Signalen (simuliert durch analoge Sensoren).
3.  **Digital-Analog-Wandler (DAC):** Zur Ausgabe der synthetischen Spikes.
4.  **Sensoren:** 2x Potentiometer (Simulation von Membranpotenzialen) oder EMG-Sensoren für echte biologische Inputs.
5.  **Aktuoren:** 1x Servo-Motor (Simulation des Motor-Outputs).
6.  **Breadboard & Jumper-Kabel.**

---

## Schritt 1: Schaltungsaufbau
1.  Verbinden Sie die analogen Sensoren (Eingangsschicht) mit den ADC-Pins der MCU.
2.  Der Mikrocontroller fungiert als "Transitional Bridge".
3.  Der Ausgang (DAC) steuert den Servo-Motor an, der die motorische Reaktion darstellt.

## Schritt 2: Software-Architektur (Firmware)
Die Firmware muss drei Modi unterstützen, die per Tastendruck gewechselt werden können:

### A. Biologischer Referenzmodus
Die MCU reicht das Signal des Primärsensors direkt (mit minimaler Filterung) an den Aktuator weiter.
*   *Code-Logik:* `output = analogRead(sensorPin);`

### B. Hybrid-Modus (Transition)
Die MCU berechnet ein SNN mit Izhikevich-Neuronen. Ein Teil der Neuronen erhält Input vom Sensor, ein anderer Teil "antwortet" synthetisch. Beide Signale werden gewichtet gemittelt.
*   *Izhikevich-Implementierung:*
    ```cpp
    v = v + 0.5 * (0.04 * v * v + 5 * v + 140 - u + I);
    u = u + 0.5 * a * (b * v - u);
    if (v >= 30) {
        v = c;
        u += d;
        digitalWrite(spikePin, HIGH);
    }
    ```

### C. Synthetischer Modus
Die Steuerung erfolgt zu 100% über das SNN. Der biologische Sensor dient nur noch als "Stimulus-Quelle" für das digitale Modell.

---

## Schritt 3: Validierung der Kontinuität
Um die wissenschaftliche Strenge sicherzustellen, müssen während des Betriebs folgende Metriken über die serielle Schnittstelle ausgegeben werden:
1.  **Inter-Spike-Interval (ISI) Varianz:** Vergleich der zeitlichen Abstände zwischen biologischem und synthetischem Modus.
2.  **Latenz-Messung:** Zeitverzögerung vom Sensor-Input bis zur Servo-Reaktion (Ziel: < 10ms).
3.  **Synchronisations-Index:** Kreuzkorrelation der Signalverläufe im Hybrid-Modus.

## Schritt 4: Experimentelle Durchführung
1.  Starten Sie im **Biologischen Modus** und kalibrieren Sie den Servo-Ausschlag.
2.  Schalten Sie schrittweise (in 10%-Schritten) die Gewichtung auf das **SNN** um.
3.  Beobachten Sie, ob der Reflexbogen (Servo-Bewegung) flüssig bleibt oder ob Diskontinuatäten (Ruckeln) auftreten.

---

## Sicherheitshinweis
Dieser Prototyp dient ausschließlich Simulationszwecken im Labor. Eine direkte Kopplung mit lebendem Gewebe erfordert medizinisch zertifizierte galvanische Trennung und Ethik-Voten.
