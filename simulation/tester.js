/**
 * Gradual Transition Framework - Diagnostic Suite
 * Verifies the integrity of the transition state machine
 */

class SimulationDiagnostics {
    constructor(engine) {
        this.engine = engine;
        this.results = [];
    }

    async runAll() {
        this.results = [];
        console.log("Starting System Diagnostics...");

        try {
            this.testInitialState();
            await this.testIncrementalSubstitution();
            this.testFullModuleTransition();
            this.testTransitionOrder();
            this.testResetFunctionality();

            console.log("Diagnostics Complete: All tests passed.");
            return { success: true, results: this.results };
        } catch (error) {
            console.error("Diagnostics Failed:", error);
            return { success: false, error: error.message };
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion Failed: ${message}`);
        }
        this.results.push(message);
    }

    testInitialState() {
        const modules = Object.values(this.engine.modules);
        this.assert(modules.length === 3, "Engine should have 3 modules.");
        modules.forEach(m => {
            this.assert(m.state === 'Biological', `${m.type} should start as Biological.`);
            this.assert(m.syntheticCount === 0, `${m.type} should have 0 synthetic units.`);
        });
    }

    async testIncrementalSubstitution() {
        this.engine.reset();
        await new Promise(r => setTimeout(r, 200)); // Wait for reset

        const sensory = this.engine.modules['Sensory'];
        this.engine.transitionStep();

        this.assert(sensory.syntheticCount === 8, "First step should substitute 8 units in Sensory module.");
        this.assert(sensory.overallProgress > 0 && sensory.overallProgress < 50, "Progress should be between 0 and 50 during substitution.");
    }

    async testFullModuleTransition() {
        this.engine.reset();
        await new Promise(r => setTimeout(r, 200));
        const sensory = this.engine.modules['Sensory'];

        // Fully substitute Sensory neurons
        for (let i = 0; i < 8; i++) {
            this.engine.transitionStep();
        }

        this.assert(sensory.syntheticCount === 64, "Sensory module should have 64 synthetic units.");

        this.engine.transitionStep();
        this.assert(sensory.state === 'Hybrid', "Sensory module should transition to Hybrid after full substitution.");
    }

    async testTransitionOrder() {
        this.engine.reset();
        await new Promise(r => setTimeout(r, 200));

        // 1. Sensory substitution
        for (let i = 0; i < 8; i++) this.engine.transitionStep();
        this.engine.transitionStep(); // Hybrid

        // 2. Next step should start Cognitive
        this.engine.transitionStep();
        this.assert(this.engine.modules['Cognitive'].syntheticCount === 8, "Transition should move to Cognitive after Sensory is Hybrid.");
        this.assert(this.engine.modules['Primary Kernel'].syntheticCount === 0, "Kernel should not start transition yet.");
    }

    async testResetFunctionality() {
        this.engine.transitionStep();
        this.engine.reset();

        await new Promise(r => setTimeout(r, 200));
        const sensory = this.engine.modules['Sensory'];
        this.assert(sensory.syntheticCount === 0, "Reset should clear synthetic count.");
        this.assert(sensory.state === 'Biological', "Reset should restore Biological state.");
    }
}

// Global hook for the UI to trigger
window.runDiagnostics = async () => {
    if (!window.engine) {
        console.error("Engine not found.");
        return;
    }
    const diagnostics = new SimulationDiagnostics(window.engine);
    return await diagnostics.runAll();
};
