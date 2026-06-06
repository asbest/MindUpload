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
    constructor(id) {
        this.id = id;
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
        this.neurons = Array.from({ length: 64 }, (_, i) => new Neuron(i));
        this.overallProgress = 0;
        this.activity = 0;

        this.canvas = document.getElementById(`canvas-${type.toLowerCase().split(' ')[0]}`);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, w, h);

        const cols = 8;
        const rows = 8;
        const cellW = w / cols;
        const cellH = h / rows;

        this.neurons.forEach((n, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;

            if (n.isFiring) {
                ctx.fillStyle = n.state === State.BIOLOGICAL ? '#ffcc00' : '#00ff41';
                ctx.shadowBlur = 15;
                ctx.shadowColor = ctx.fillStyle;
                ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = n.state === State.BIOLOGICAL ? '#221100' : '#001a09';
                ctx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);

                // Potential indicator
                const p = Math.max(0, Math.min(1, (n.v + 65) / 95));
                ctx.fillStyle = n.state === State.BIOLOGICAL ? `rgba(255, 204, 0, ${p * 0.3})` : `rgba(0, 255, 65, ${p * 0.3})`;
                ctx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);
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
        this.history = ["System initialized in biological state."];
        this.lastTick = performance.now();
        this.isRunning = true;

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

        // 1. Signal Stability: Kernel activity must remain within physiological bounds
        // Refined bounds for more realistic behavior
        if (kAct < 0.001) targetIntegrity -= 50;
        if (kAct > 0.5) targetIntegrity -= 30;

        // 2. Functional Coherence: Sensory input should drive Cognitive/Kernel output
        const coherence = Math.min(1, kAct / (sAct + 0.01));
        if (coherence < 0.05) targetIntegrity -= 20;

        // 3. Substrate Transition Variance
        // Integrity drops during transition but recovers as modules synchronize
        const totalNeurons = 64 * 3;
        const totalSynthetic = Object.values(this.modules).reduce((sum, m) => sum + m.syntheticCount, 0);
        const transitionProgress = totalSynthetic / totalNeurons;

        // Variance penalty: highest when 50% through total transition
        const variance = 1 - Math.abs(transitionProgress - 0.5) * 2;
        if (totalSynthetic > 0 && totalSynthetic < totalNeurons) {
            targetIntegrity -= (variance * 15);
        }

        // Smoothly adjust current integrity
        this.integrity = this.integrity * 0.98 + targetIntegrity * 0.02;
    }

    render() {
        for (const type in this.modules) {
            this.modules[type].render();
        }
        this.updateUI();
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
