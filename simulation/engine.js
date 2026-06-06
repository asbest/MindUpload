/**
 * Gradual Transition Framework - Simulation Engine
 * Enhanced Neuronal-Level Simulation
 */

const State = {
    BIOLOGICAL: 'Biological',
    HYBRID: 'Hybrid',
    SYNTHETIC: 'Synthetic'
};

const ModuleType = {
    SENSORY: 'Sensory',
    COGNITIVE: 'Cognitive',
    KERNEL: 'Primary Kernel'
};

class Neuron {
    constructor(id, x = 0, y = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.state = State.BIOLOGICAL;

        // Izhikevich Model Parameters
        // RS (Regular Spiking): a=0.02, b=0.2, c=-65, d=8
        // FS (Fast Spiking): a=0.1, b=0.2, c=-65, d=2
        this.params = {
            a: 0.02,
            b: 0.2,
            c: -65,
            d: 8
        };

        this.v = -65; // Membrane potential
        this.u = this.params.b * this.v; // Recovery variable
        this.isFiring = false;
    }

    update(dt, inputSignal = 0) {
        // Limit dt and use smaller sub-steps for Izhikevich stability
        const step = Math.min(dt, 20);
        const subDt = 0.5;
        const iterations = Math.ceil(step / subDt);

        let fired = false;

        // Adaptive noise based on state
        const noise = this.state === State.BIOLOGICAL ? (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 1;
        const current = inputSignal + noise + 4; // Base drive

        for (let i = 0; i < iterations; i++) {
            // Izhikevich equations
            // v' = 0.04v^2 + 5v + 140 - u + I
            // u' = a(bv - u)

            // Numerical stability: cap v to prevent runaway quadratic
            const v = Math.min(this.v, 30);
            this.v += subDt * (0.04 * v * v + 5 * v + 140 - this.u + current);
            this.u += subDt * this.params.a * (this.params.b * this.v - this.u);

            if (this.v >= 30) {
                fired = true;
                this.v = this.params.c;
                this.u += this.params.d;
            }
        }

        this.isFiring = fired;
        return fired;
    }

    setSynthetic() {
        this.state = State.SYNTHETIC;
        // Transition to Fast Spiking (FS) for efficiency/precision
        this.params.a = 0.1;
        this.params.d = 2;
    }
}

class TransitionModule {
    constructor(type) {
        this.type = type;
        this.state = State.BIOLOGICAL;
        this.overallProgress = 0;
        this.activity = 0;

        this.canvas = document.getElementById(`canvas-${type.toLowerCase().split(' ')[0]}`);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        this.neurons = [];
        this.synapses = [];
        this.initNetwork();
    }

    initNetwork() {
        const w = this.canvas ? this.canvas.width : 200;
        const h = this.canvas ? this.canvas.height : 100;

        // Create neurons in a semi-random spatial distribution
        for (let i = 0; i < 64; i++) {
            const margin = 10;
            const x = margin + Math.random() * (w - 2 * margin);
            const y = margin + Math.random() * (h - 2 * margin);
            this.neurons.push(new Neuron(i, x, y));
        }

        // Create synapses between nearby neurons
        for (let i = 0; i < this.neurons.length; i++) {
            for (let j = i + 1; j < this.neurons.length; j++) {
                const n1 = this.neurons[i];
                const n2 = this.neurons[j];
                const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);

                // Connect if within distance, limited number of connections
                if (dist < 35 && Math.random() < 0.3) {
                    this.synapses.push({ from: n1, to: n2, weight: Math.random() });
                }
            }
        }
    }

    get syntheticCount() {
        return this.neurons.filter(n => n.state === State.SYNTHETIC).length;
    }

    update(dt, inputSignal) {
        let fires = 0;
        this.neurons.forEach(n => {
            if (n.update(dt, inputSignal)) {
                fires++;
            }
        });
        this.activity = this.activity * 0.9 + (fires / this.neurons.length) * 0.1;
        return fires;
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, w, h);

        // Draw synapses
        ctx.lineWidth = 1;
        this.synapses.forEach(s => {
            const firing = s.from.isFiring || s.to.isFiring;
            if (firing) {
                ctx.strokeStyle = s.from.state === State.BIOLOGICAL ? 'rgba(255, 204, 0, 0.5)' : 'rgba(0, 255, 65, 0.5)';
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = 'rgba(50, 50, 50, 0.2)';
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            ctx.moveTo(s.from.x, s.from.y);
            ctx.lineTo(s.to.x, s.to.y);
            ctx.stroke();
        });

        // Draw neurons
        this.neurons.forEach(n => {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);

            if (n.isFiring) {
                ctx.fillStyle = n.state === State.BIOLOGICAL ? '#ffcc00' : '#00ff41';
                ctx.shadowBlur = 10;
                ctx.shadowColor = ctx.fillStyle;
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                const p = Math.max(0, Math.min(1, (n.v + 65) / 95));
                ctx.fillStyle = n.state === State.BIOLOGICAL ?
                    `rgba(100, 80, 0, ${0.1 + p * 0.4})` :
                    `rgba(0, 100, 40, ${0.1 + p * 0.4})`;
                ctx.fill();
            }
        });
    }

    updateProgress() {
        const total = this.neurons.length;
        const synth = this.syntheticCount;

        if (this.state === State.BIOLOGICAL) {
            this.overallProgress = (synth / total) * 50;
        } else if (this.state === State.HYBRID) {
            this.overallProgress = 50 + (synth / total) * 50;
        } else {
            this.overallProgress = 100;
        }
    }

    transitionNeurons(count) {
        const available = this.neurons.filter(n => n.state === State.BIOLOGICAL);
        for (let i = 0; i < Math.min(count, available.length); i++) {
            available[i].setSynthetic();
        }
        this.updateProgress();
    }
}

class TransitionEngine {
    constructor() {
        this.modules = {
            [ModuleType.SENSORY]: new TransitionModule(ModuleType.SENSORY),
            [ModuleType.COGNITIVE]: new TransitionModule(ModuleType.COGNITIVE),
            [ModuleType.KERNEL]: new TransitionModule(ModuleType.KERNEL)
        };
        this.integrity = 100;
        this.activeReasons = new Set();
        this.history = ["System initialized in biological state."];
        this.lastTick = performance.now();
        this.isRunning = true;

        this.networkCanvas = document.getElementById('canvas-network');
        this.networkCtx = this.networkCanvas ? this.networkCanvas.getContext('2d') : null;

        this.loop();
    }

    loop() {
        if (!this.isRunning) return;
        const now = performance.now();
        const dt = now - this.lastTick;
        this.lastTick = now;

        this.update(dt);
        this.render();

        requestAnimationFrame(() => this.loop());
    }

    update(dt) {
        // Sensory input varies over time
        const sensoryInput = Math.sin(performance.now() / 1000) * 10 + 10;
        const sensoryFires = this.modules[ModuleType.SENSORY].update(dt, sensoryInput);

        // Signal propagation with some normalization
        const cognitiveInput = (sensoryFires / 64) * 20;
        const cognitiveFires = this.modules[ModuleType.COGNITIVE].update(dt, cognitiveInput);

        const kernelInput = (cognitiveFires / 64) * 20;
        this.modules[ModuleType.KERNEL].update(dt, kernelInput);

        this.validateIntegrity();
    }

    validateIntegrity() {
        /**
         * Continuity Integrity Calculation
         * Based on Signal Coherence and Synchronization Stability
         */
        const kAct = this.modules[ModuleType.KERNEL].activity;
        const cAct = this.modules[ModuleType.COGNITIVE].activity;
        const sAct = this.modules[ModuleType.SENSORY].activity;

        let targetIntegrity = 100;
        const currentReasons = new Set();

        // 1. Signal Stability: Kernel activity must remain within physiological bounds
        if (kAct < 0.001) {
            targetIntegrity -= 50;
            currentReasons.add("Critical: Signal loss in Primary Kernel");
        }
        if (kAct > 0.5) {
            targetIntegrity -= 30;
            currentReasons.add("Warning: Hyper-activity detected in Primary Kernel");
        }

        // 2. Functional Coherence: Sensory input should drive Cognitive/Kernel output
        const coherence = Math.min(1, kAct / (sAct + 0.01));
        if (coherence < 0.05) {
            targetIntegrity -= 20;
            currentReasons.add("Warning: Functional decoherence between Sensory and Kernel");
        }

        // 3. Substrate Transition Variance
        const totalNeurons = 64 * 3;
        const totalSynthetic = Object.values(this.modules).reduce((sum, m) => sum + m.syntheticCount, 0);
        const transitionProgress = totalSynthetic / totalNeurons;
        const variance = 1 - Math.abs(transitionProgress - 0.5) * 2;

        if (totalSynthetic > 0 && totalSynthetic < totalNeurons) {
            targetIntegrity -= (variance * 15);
            if (variance > 0.2) {
                currentReasons.add("System: Substrate Transition Variance (Mixed Bio-Synthetic Signaling)");
            }
        }

        // Logging reasons to console when they change
        currentReasons.forEach(reason => {
            if (!this.activeReasons.has(reason)) {
                console.warn(`[Integrity Alert] ${reason}`);
            }
        });
        this.activeReasons.forEach(reason => {
            if (!currentReasons.has(reason)) {
                console.info(`[Integrity Restored] ${reason}`);
            }
        });
        this.activeReasons = currentReasons;

        // Smoothly adjust current integrity
        this.integrity = this.integrity * 0.98 + targetIntegrity * 0.02;
    }

    render() {
        for (const type in this.modules) {
            this.modules[type].render();
        }
        this.renderNetwork();
        this.updateUI();
    }

    renderNetwork() {
        if (!this.networkCtx) return;
        const ctx = this.networkCtx;
        const w = this.networkCanvas.width;
        const h = this.networkCanvas.height;

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        const modules = [
            { type: ModuleType.SENSORY, x: 100 },
            { type: ModuleType.COGNITIVE, x: 370 },
            { type: ModuleType.KERNEL, x: 640 }
        ];

        // Draw axonal bundles (detailed connections)
        for (let i = 0; i < modules.length - 1; i++) {
            const m1 = modules[i];
            const m2 = modules[i+1];
            const mod1 = this.modules[m1.type];

            const bundleCount = 5;
            for (let b = 0; b < bundleCount; b++) {
                const offset = (b - (bundleCount - 1) / 2) * 10;

                ctx.beginPath();
                ctx.moveTo(m1.x + 40, h/2 + offset/2);
                ctx.bezierCurveTo(
                    m1.x + 150, h/2 + offset * 2,
                    m2.x - 150, h/2 - offset * 2,
                    m2.x - 40, h/2 + offset/2
                );

                const gradient = ctx.createLinearGradient(m1.x, h/2, m2.x, h/2);
                gradient.addColorStop(0, mod1.state === State.BIOLOGICAL ? 'rgba(255, 204, 0, 0.3)' : 'rgba(0, 255, 65, 0.3)');
                gradient.addColorStop(1, this.modules[m2.type].state === State.BIOLOGICAL ? 'rgba(255, 204, 0, 0.3)' : 'rgba(0, 255, 65, 0.3)');

                ctx.strokeStyle = gradient;
                ctx.setLineDash([10, 15]);
                ctx.lineDashOffset = -performance.now() / (20 + b * 5);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.setLineDash([]);

                // Occasional signal pulse in bundle
                if ((performance.now() + b * 200) % 1500 < 500) {
                    const pulsePos = ((performance.now() + b * 200) % 1500) / 500;
                    const t = pulsePos;
                    // Bezier point formula: (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
                    const cx1 = m1.x + 150, cy1 = h/2 + offset * 2;
                    const cx2 = m2.x - 150, cy2 = h/2 - offset * 2;
                    const px = Math.pow(1-t, 3)*(m1.x+40) + 3*Math.pow(1-t, 2)*t*cx1 + 3*(1-t)*t*t*cx2 + t*t*t*(m2.x-40);
                    const py = Math.pow(1-t, 3)*(h/2+offset/2) + 3*Math.pow(1-t, 2)*t*cy1 + 3*(1-t)*t*t*cy2 + t*t*t*(h/2+offset/2);

                    ctx.fillStyle = mod1.state === State.BIOLOGICAL ? '#ffcc00' : '#00ff41';
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw module nodes with internal clusters
        modules.forEach(m => {
            const mod = this.modules[m.type];
            const synthRatio = mod.syntheticCount / 64;

            ctx.fillStyle = '#1a1a1a';
            ctx.strokeStyle = mod.state === State.BIOLOGICAL ? '#ffcc00' : (mod.state === State.HYBRID ? '#00ccff' : '#00ff41');
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(m.x, h/2, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw internal "neuron cluster" dots
            const clusterSeed = m.x; // Use x as seed for deterministic pseudo-random
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 2 + (performance.now() / 2000);
                const radius = 10 + (Math.sin(i * clusterSeed) * 0.5 + 0.5) * 20;
                const px = m.x + Math.cos(angle) * radius;
                const py = h/2 + Math.sin(angle) * radius;

                ctx.fillStyle = mod.state === State.BIOLOGICAL ? 'rgba(255, 204, 0, 0.4)' : 'rgba(0, 255, 65, 0.4)';
                if (Math.random() < mod.activity) {
                    ctx.fillStyle = mod.state === State.BIOLOGICAL ? '#ffcc00' : '#00ff41';
                }
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Progress arc
            ctx.strokeStyle = '#00ff41';
            ctx.beginPath();
            ctx.arc(m.x, h/2, 35, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * (mod.overallProgress / 100)));
            ctx.stroke();

            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = '10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(m.type.split(' ')[0], m.x, h/2 + 5);
        });
    }

    updateUI() {
        const integrityBar = document.getElementById('integrity-bar');
        if (integrityBar) {
            integrityBar.style.width = `${this.integrity}%`;
            integrityBar.textContent = `${Math.round(this.integrity)}%`;
            integrityBar.style.backgroundColor = this.integrity > 80 ? '#00ff41' : (this.integrity > 50 ? '#ffcc00' : '#ff3300');
        }

        const logContainer = document.getElementById('log-container');
        if (logContainer && this.history.length > 0) {
            logContainer.innerHTML = '';
            this.history.slice(-5).forEach(entry => {
                const div = document.createElement('div');
                div.className = 'log-entry';
                div.textContent = entry;
                logContainer.appendChild(div);
            });
            logContainer.scrollTop = logContainer.scrollHeight;
        }

        for (const type in this.modules) {
            const m = this.modules[type];
            const el = document.getElementById(`module-${type.toLowerCase().split(' ')[0]}`);
            if (el) {
                const stateLabel = el.querySelector('.state-label');
                stateLabel.textContent = m.state;
                stateLabel.className = `state-label ${m.state.toLowerCase()}`;

                const progress = el.querySelector('.progress-bar-inner');
                progress.style.width = `${m.overallProgress}%`;
            }
        }
    }

    transitionStep() {
        const order = [ModuleType.SENSORY, ModuleType.COGNITIVE, ModuleType.KERNEL];

        for (const type of order) {
            const module = this.modules[type];
            if (module.state === State.BIOLOGICAL) {
                if (module.syntheticCount < module.neurons.length) {
                    const batch = 8;
                    module.transitionNeurons(batch);
                    const percent = Math.round((module.syntheticCount / module.neurons.length) * 100);
                    this.history.push(`Substituting ${module.type}: ${percent}% synthetic.`);
                    return;
                } else {
                    module.state = State.HYBRID;
                    this.history.push(`${module.type} synchronization in HYBRID state.`);
                    return;
                }
            }
        }

        for (const type of order) {
            const module = this.modules[type];
            if (module.state === State.HYBRID) {
                module.state = State.SYNTHETIC;
                this.history.push(`${module.type} reached SYNTHETIC state.`);
                return;
            }
        }
    }

    reset() {
        this.isRunning = false;
        setTimeout(() => {
            this.modules = {
                [ModuleType.SENSORY]: new TransitionModule(ModuleType.SENSORY),
                [ModuleType.COGNITIVE]: new TransitionModule(ModuleType.COGNITIVE),
                [ModuleType.KERNEL]: new TransitionModule(ModuleType.KERNEL)
            };
            this.integrity = 100;
            this.history = ["System reset."];
            this.isRunning = true;
            this.lastTick = performance.now();
            this.loop();
        }, 100);
    }
}

const engine = new TransitionEngine();
window.engine = engine;

document.getElementById('start-transition').addEventListener('click', () => {
    engine.transitionStep();
});

document.getElementById('reset-sim').addEventListener('click', () => {
    engine.reset();
});
