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
        this.potential = Math.random() * -70; // Membrane potential in mV
        this.threshold = -50;
        this.refractoryPeriod = 0;
        this.isFiring = false;
    }

    update(dt, inputSignal = 0) {
        if (this.refractoryPeriod > 0) {
            this.refractoryPeriod -= dt;
            this.isFiring = false;
            this.potential = -70;
            return false;
        }

        const leak = (-70 - this.potential) * 0.05;
        this.potential += (leak + inputSignal + (Math.random() - 0.5) * 15) * (dt / 10);

        if (this.potential >= this.threshold) {
            this.fire();
            return true;
        } else {
            this.isFiring = false;
            return false;
        }
    }

    fire() {
        this.isFiring = true;
        this.potential = 30; // Spike
        this.refractoryPeriod = 40 + Math.random() * 20; // ms refractory
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
                ctx.shadowBlur = 10;
                ctx.shadowColor = ctx.fillStyle;
                ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = n.state === State.BIOLOGICAL ? '#332200' : '#003311';
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
            available[i].state = State.SYNTHETIC;
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
        const sensoryInput = Math.sin(performance.now() / 500) * 20 + 20;
        const sensoryFires = this.modules[ModuleType.SENSORY].update(dt, sensoryInput);

        const cognitiveInput = sensoryFires * 5;
        const cognitiveFires = this.modules[ModuleType.COGNITIVE].update(dt, cognitiveInput);

        const kernelInput = cognitiveFires * 5;
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
        if (kAct < 0.005) targetIntegrity -= 40; // Critical: loss of kernel pulse
        if (kAct > 0.4) targetIntegrity -= 20;   // Critical: seizure-like activity

        // 2. Functional Coherence: Sensory input should drive Cognitive/Kernel output
        const coherence = Math.min(1, kAct / (sAct + 0.001));
        if (coherence < 0.1) targetIntegrity -= 15;

        // 3. Substrate Transition Variance
        const states = Object.values(this.modules).map(m => m.state);
        const synthCounts = Object.values(this.modules).map(m => m.syntheticCount);
        const hasTransitioning = synthCounts.some(c => c > 0 && c < 64);

        if (hasTransitioning) {
            targetIntegrity -= 5; // Slight instability during active substitution
        }

        if (states.includes(State.SYNTHETIC) && states.includes(State.BIOLOGICAL)) {
            targetIntegrity -= 20; // Critical: high variance between substrate types
        }

        // Smoothly adjust current integrity
        this.integrity = this.integrity * 0.99 + targetIntegrity * 0.01;
    }

    render() {
        for (const type in this.modules) {
            this.modules[type].render();
        }
        updateUI();
    }

    transitionStep() {
        const order = [ModuleType.SENSORY, ModuleType.COGNITIVE, ModuleType.KERNEL];

        for (const type of order) {
            const module = this.modules[type];
            if (module.state === State.BIOLOGICAL) {
                if (module.syntheticCount < module.neurons.length) {
                    module.transitionNeurons(4);
                    this.history.push(`Substituting ${module.type} units...`);
                    return;
                } else {
                    module.state = State.HYBRID;
                    this.history.push(`${module.type} reached HYBRID state.`);
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

function updateUI() {
    const integrityBar = document.getElementById('integrity-bar');
    if (integrityBar) {
        integrityBar.style.width = `${engine.integrity}%`;
        integrityBar.textContent = `${Math.round(engine.integrity)}%`;
        integrityBar.style.backgroundColor = engine.integrity > 80 ? '#00ff41' : (engine.integrity > 50 ? '#ffcc00' : '#ff3300');
    }

    const logContainer = document.getElementById('log-container');
    if (logContainer && engine.history.length > 0) {
        logContainer.innerHTML = '';
        engine.history.slice(-5).forEach(entry => {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.textContent = entry;
            logContainer.appendChild(div);
        });
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    for (const type in engine.modules) {
        const m = engine.modules[type];
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

document.getElementById('start-transition').addEventListener('click', () => {
    engine.transitionStep();
});

document.getElementById('reset-sim').addEventListener('click', () => {
    engine.reset();
});
