# Torsion Pendulum Virtual Lab (Tech Titans)

An interactive, realistic 3D virtual physics laboratory designed to study torsional oscillations and determine the Modulus of Rigidity ($G$) of various metallic wires.

## Features

- **3D Physics Simulation**:
  - Real-time 4th-order Runge-Kutta (RK4) numerical integration of torsional oscillations ($\tau = -\kappa\theta$).
  - Dynamic GLSL shear-stress shader visually indicating shear strain along the wire.
  - Interactive camera controls (orbit, pan, zoom) with preset macro views for wire, disc, and measuring instruments.
  - Twist the disc directly with mouse or touch (with elastic limit protection at $\pm 15^\circ$).

- **Virtual Measuring Instruments**:
  - **Vernier Caliper**: Measure disc diameter (least count = 0.1 mm).
  - **Screw Gauge (Micrometer)**: Measure wire diameter with realistic zero-error simulation (+0.02 mm, least count = 0.01 mm).
  - **Meter Scale**: Measure wire length ($L$).

- **Experimental Capabilities**:
  - Select materials: Steel ($79.3\text{ GPa}$), Copper ($45.0\text{ GPa}$), Brass ($38.0\text{ GPa}$), Aluminium ($26.0\text{ GPa}$).
  - Adjustable wire length ($30 - 100\text{ cm}$), wire diameter ($0.4 - 1.4\text{ mm}$), and disc mass ($1 - 3\text{ kg}$).
  - Integrated digital stopwatch with automatic oscillation counting and split lap timing.
  - Data recording table and experimental calculation notebook ($G = \frac{8\pi I L}{r^4 T^2}$, $I = \frac{1}{2}MR^2$).
  - Graphical analysis ($T^2$ vs $L$ and $T^2$ vs $1/r^4$).
  - Material comparison table and percentage error results.

## Quick Start

Open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).
The application is fully self-contained in `index.html`.
