/**
 * Gradual Transition Framework - Simulation Engine
 * Core Logic for Incremental Substitution
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

class TransitionModule {
    constructor(type) {
        this.type = type;
        this.state = State.BIOLOGICAL;
        this.overallProgress = 0; // 0 to 100 overall
    }

    getNextState() {
        if (this.state === State.BIOLOGICAL) return State.HYBRID;
        if (this.state === State.HYBRID) return State.SYNTHETIC;
        return State.SYNTHETIC;
    }

    transition() {
        if (this.state === State.SYNTHETIC) return false;

        const oldState = this.state;
        this.state = this.getNextState();
        this.overallProgress = this.state === State.HYBRID ? 50 : 100;

        return {
            type: this.type,
            from: oldState,
            to: this.state
        };
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
        this.history = [];
    }

    transitionStep() {
        // Find a module that isn't fully synthetic yet, following the ideal order
        const order = [ModuleType.SENSORY, ModuleType.COGNITIVE, ModuleType.KERNEL];

        // Strategy: Transition each module to Hybrid first, then to Synthetic
        // This ensures maximum integrity (low variance)

        // 1. Try to move to Hybrid in order
        for (const type of order) {
            const module = this.modules[type];
            if (module.state === State.BIOLOGICAL) {
                return this.executeTransition(module);
            }
        }

        // 2. Try to move to Synthetic in order
        for (const type of order) {
            const module = this.modules[type];
            if (module.state === State.HYBRID) {
                return this.executeTransition(module);
            }
        }

        return null; // All synthetic
    }

    executeTransition(module) {
        if (this.runValidationLoop()) {
            const result = module.transition();
            if (result) {
                this.history.push(`${module.type}: ${result.from} → ${result.to}`);
                this.validateIntegrity();
                return result;
            }
        } else {
            this.history.push("CRITICAL: Transition halted due to low integrity.");
            throw new Error("Integrity violation detected.");
        }
        return null;
    }

    validateIntegrity() {
        const states = [
            this.modules[ModuleType.SENSORY].state,
            this.modules[ModuleType.COGNITIVE].state,
            this.modules[ModuleType.KERNEL].state
        ];

        const stateValues = states.map(s => {
            if (s === State.BIOLOGICAL) return 0;
            if (s === State.HYBRID) return 1;
            return 2;
        });

        let consistencyGap = 0;
        if (stateValues[1] > stateValues[0]) consistencyGap += (stateValues[1] - stateValues[0]);
        if (stateValues[2] > stateValues[1]) consistencyGap += (stateValues[2] - stateValues[1]);

        const maxVariance = Math.max(...stateValues) - Math.min(...stateValues);

        const penalty = (consistencyGap * 15) + (maxVariance > 1 ? 20 : 0);
        this.integrity = Math.max(0, 100 - penalty);

        return this.integrity >= 70;
    }

    runValidationLoop() {
        return this.validateIntegrity();
    }

    reset() {
        this.modules[ModuleType.SENSORY] = new TransitionModule(ModuleType.SENSORY);
        this.modules[ModuleType.COGNITIVE] = new TransitionModule(ModuleType.COGNITIVE);
        this.modules[ModuleType.KERNEL] = new TransitionModule(ModuleType.KERNEL);
        this.integrity = 100;
        this.history = ["System reset to biological state."];
    }
}

// UI Controller Logic
const engine = new TransitionEngine();

const dom = {
    btnStart: document.getElementById('start-transition'),
    btnReset: document.getElementById('reset-sim'),
    integrityBar: document.getElementById('integrity-bar'),
    logContainer: document.getElementById('log-container'),
    modules: {
        [ModuleType.SENSORY]: document.getElementById('module-sensory'),
        [ModuleType.COGNITIVE]: document.getElementById('module-cognitive'),
        [ModuleType.KERNEL]: document.getElementById('module-kernel')
    }
};

function updateUI() {
    // Update Integrity Bar
    dom.integrityBar.style.width = `${engine.integrity}%`;
    dom.integrityBar.textContent = `${engine.integrity}%`;

    // Update Modules
    for (const type in engine.modules) {
        const moduleData = engine.modules[type];
        const moduleEl = dom.modules[type];

        const stateLabel = moduleEl.querySelector('.state-label');
        stateLabel.textContent = moduleData.state;
        stateLabel.className = `state-label ${moduleData.state.toLowerCase()}`;

        const progressBar = moduleEl.querySelector('.progress-bar-inner');
        progressBar.style.width = `${moduleData.overallProgress}%`;
    }

    // Update Logs
    dom.logContainer.innerHTML = '';
    engine.history.slice(-10).forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = entry;
        dom.logContainer.appendChild(logEntry);
    });

    // Button states
    const allSynthetic = Object.values(engine.modules).every(m => m.state === State.SYNTHETIC);
    dom.btnStart.disabled = allSynthetic;
}

dom.btnStart.addEventListener('click', () => {
    try {
        engine.transitionStep();
        updateUI();
    } catch (e) {
        alert(e.message);
        updateUI();
    }
});

dom.btnReset.addEventListener('click', () => {
    engine.reset();
    updateUI();
});

// Initial UI sync
updateUI();
