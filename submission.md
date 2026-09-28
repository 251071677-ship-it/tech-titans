# techtitans

### Problem Statement Fit

Physics education and engineering laboratory courses often face limited access to physical apparatus, precision instruments, and real-time visualization of internal stresses. Our project provides an accessible, high-fidelity 3D virtual physics laboratory for studying torsional oscillations and measuring the Modulus of Rigidity ($G$) of metallic wires without requiring expensive physical hardware.

### Target Users

Engineering and physics students, lab instructors, and educational institutions looking for an interactive, accurate, and accessible simulation environment for physics lab experiments and remote learning.

### What We Built

A self-contained, real-time 3D Virtual Torsion Pendulum Laboratory. The application models torsional simple harmonic motion, simulates physical measurement instruments (Vernier caliper, screw gauge, meter scale), provides an automated stopwatch and calculation notebook, and renders internal shear stress visually via dynamic shaders.

### Core Features

- **3D Physics Simulation**: Real-time 4th-order Runge-Kutta (RK4) numerical integration of torsional oscillations ($\tau = -\kappa\theta$) with physical damping and elastic limit protection ($\pm 15^\circ$).
- **GLSL Shear-Stress Visualizer**: Custom WebGL shader dynamically coloring the wire based on shear strain ratio ($\gamma_{\text{max}} / \gamma_{\text{yield}}$).
- **Virtual Precision Instruments**: Interactive 3D Vernier Caliper (least count 0.1 mm) and Screw Gauge / Micrometer (least count 0.01 mm, $+0.02\text{ mm}$ zero-error) with draggable jaws and sample insertion.
- **Integrated Experiment Suite**: Multi-material selection (Steel, Copper, Brass, Aluminium), digital stopwatch with automatic oscillation counting and split lap timing, calculation notebook ($G = \frac{8\pi I L}{r^4 T^2}$, $I = \frac{1}{2}MR^2$), and comparison tables.
- **Graphical Analysis**: Real-time canvas plotting for $T^2$ vs $L$ and $T^2$ vs $1/r^4$ with theoretical regression lines.

### Technical Architecture

- **Rendering Engine**: Three.js WebGL renderer with custom lighting, studio environment map, shadow mapping, and procedural instrument textures.
- **Physics Core**: RK4 numerical integrator running at animation frame rates with timestep clamping.
- **Shader Pipeline**: Custom GLSL vertex and fragment shaders mapping shear strain to a 4-color gradient on the wire segments.
- **UI Architecture**: Pure vanilla HTML/CSS/JS interface featuring glassmorphic controls, responsive HUD, and tabbed workflow (Lab, Measure, Oscillate, Stopwatch, Data, Calculator, Graph, Compare, Result, Learn).

### Tech Stack

- HTML5, CSS3, JavaScript (ES6+)
- Three.js (r128)
- Node.js (project build and tooling)

### Innovation / Uniqueness

Unlike static 2D virtual labs, this project provides a full 3D interactive physics environment where students can manipulate instruments, observe realistic zero errors, feel the physical constraints of elastic limits, and see internal shear stresses directly through dynamic GLSL shaders.

### Demo Instructions

1. Run `npm run dev` to start the local development server at `http://localhost:3000` (or open [index.html](file:///c:/Users/asus/OneDrive/Desktop/techtitans.html/index.html) directly in any browser).
2. In the **LAB** tab, select a material (e.g., Steel) and adjust wire length, wire diameter, and disc mass.
3. Switch to the **MEASURE** tab to inspect the 3D Vernier Caliper and Screw Gauge to record dimensions.
4. Switch to **OSCILLATE**, twist the disc (or drag the slider up to $\pm 15^\circ$), and click **RELEASE**.
5. Switch to **STOPWATCH**, start the timer to count oscillations, then record trials in **DATA**.
6. View plotted experimental vs theoretical curves in **GRAPH** and compute error analysis in **RESULT**.

### Known Limitations

- Single-page client-side simulation; trial data is maintained in-memory for the current session and does not persist to an external cloud database.
- Torsion is limited to $\pm 15^\circ$ to adhere to Hooke's Law and linear torsional oscillation theory.

### Future Work

- Implement plastic deformation and permanent set when exceeding yield torque.
- Add support for non-cylindrical wire cross-sections (e.g., square and rectangular bars).
- Provide exportable PDF lab reports and cloud-synced classroom grading integration.
