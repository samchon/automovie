# src/motion/MotionTrajectoryRead.ts#MotionTrajectoryRead.IFixed

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish seconds, vector states, unit orientations and their endpoint rates.

## @evidence contracts/development/design.md#principled-representation

Parallel arrays describe the same completed knots, with a shortened final interval and a null quaternion for an absent orientation; the builder owns equal lengths and forward times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by integrateMotionTrajectory and consumed by its full and quaternion-only numeric readers; no right-hand side or physical model is carried into playback.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the integrator's rate type and stores actual computed knots, without a second curve or fitted result.

# src/motion/MotionTrajectoryRead.ts#MotionTrajectoryRead.IDenseStep

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish step seconds, vector states, quaternion orientation and four quartic or five paired-quintic coefficients.

## @evidence contracts/development/design.md#principled-representation

The accepted continuous extension's start state and coefficients are numeric data; the builder owns their dimensions and positive step length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

MotionTrajectoryDense constructs records for MotionTrajectoryStepper to accept, and full and quaternion-only readers own the accepted records until playback is released.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No callback, body, history or second interpolation representation is stored in a completed step.

# src/motion/MotionTrajectoryRead.ts#MotionTrajectoryRead.fixed

## @evidence contracts/development/common.md#meaningful-documentation

Reads numeric knots in seconds, holds ends and returns independent states/orientations; interval copies adjacent fixed states and rates for finite query seconds, selecting end intervals outside the span.

## @evidence contracts/development/implementation.md#principled-implementation

Cubic Hermite of states and of the endpoint rotation vector; exact Jr^-1 maps the endpoint body rate to its coordinate derivative, so both knot body rates match without the construction stepper's truncated-differential error.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the interval by division, form the four Hermite weights, then read vector and orientation blocks. The last queried interval owns its time-independent rotation-vector endpoint and endpoint differential.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps fixed knots, vector arithmetic and Hermite weights, and never reads the right-hand side; the exact orientation endpoint slope is the stated C1 correction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-time interval lookup and O(n+1) interpolation/output for n components; interval snapshots copy four O(n) arrays without interpolation or RHS work. An immediately repeated full-state time skips interpolation while still issuing independent output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares completed knot arrays, one previous full state and one common quaternion projection only when Object.is matches each reader's raw requested time. Vector components share each Hermite slope weight times the interval span with its original association. One previous oriented interval shares its relative rotation vector and exact endpoint differential. Full and projected reads use the same quaternion curve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains numeric knots and bounded last-state/quaternion/interval metadata, without a model callback or history. State outputs and all four interval arrays are fresh. Quaternion-only playback skips vector work but retains numeric knot records.

# src/motion/MotionTrajectoryRead.ts#MotionTrajectoryRead.dense

## @evidence contracts/development/common.md#meaningful-documentation

Reads numeric dense coefficients in seconds, holds the endpoints and returns caller-owned vector and orientation records.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the accepted four-coefficient quartic or five-coefficient paired quintic through the common scalar polynomial and body exponential. The full and projected quaternion paths share one curve owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Binary-search the accepted interval and evaluate its vector and rotation polynomials.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Playback consumes only the accepted extension; no shape samples, extra integration or second quaternion interpolation enter it.

## @evidence contracts/development/implementation.md#efficient-algorithms

For A steps and n states a new time costs O(log A+n+1), including interpolation and output copying; an immediately repeated exact time skips lookup and interpolation but still copies O(n+1) output components. Retention is O(A(n+1)), plus one numeric read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Dense coefficients are shared by every read; one previous full state and one common quaternion projection reuse polynomial work only for Object.is-equal raw requested times. The full read and its quaternion additionally share the exact same interval/share, avoiding a duplicate search and division. Quaternion-only reads skip all vector interpolation and copying.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains accepted numeric steps, the endpoint, one previous full state, one previous projected quaternion and one previous interval/share. Every public vector and orientation is fresh; builder props and the right-hand side are outside this factory's scope. Quaternion-only playback still owns the accepted vector coefficients; it changes computation, not their storage lifetime.
