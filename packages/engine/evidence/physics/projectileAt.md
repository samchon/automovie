# src/physics/projectileAt.ts#projectileAt

## @evidence contracts/development/implementation.md#principled-implementation

Evaluate p0+v0*t+g*t^2/2 and v0+g*t for constant world acceleration, or read the quadratic-drag flight integrated by the engine's one integrator; a spin is the launch rotation composed with the rotation about the body axis by rate*t. Inputs and time must be finite; finite arithmetic can still overflow, and negative finite time evaluates the closed form backwards.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch on drag for the centre and one on the attitude's kind for the rotation; the integration lives in its own owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Gravity, launch, drag and spin are caller inputs rather than actor-specific constants; invalid components throw instead of returning a fabricated state. Without drag and attitude the record returned is the one this function always returned, bit for bit.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give metre, second and metre-per-second-squared units, the drag branch, the attitudes, fresh vectors and finite admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of vector operations per instant without drag; with drag, a memoised flight's chunk lookup and Hermite read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A drag flight is integrated once per projectile record by its owner and read by every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each state transfers to the caller; the drag flight is held weakly by its record.
