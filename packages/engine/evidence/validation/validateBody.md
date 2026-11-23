# src/validation/validateBody.ts#validateBody

## @evidence contracts/development/implementation.md#principled-implementation

Require finite positive mass, an optional explicitly declared restitution in inclusive [0,1] (absence remains unknown until a physical response needs it), an optional static friction in [0,1] (absent when nothing measured it), an optional kinetic friction in [0,1] present only with the static one and no greater than it (sliding never resists more than sticking), finite optional center-of-mass coordinates, a drag whose coefficient and area are positive (a drag of zero is no drag, and absent), and a contact whose depth is not negative, whose rolling resistance and speed loss are shares, whose breaking energy is positive, whose gyration is positive and no more than a thin shell's 2/3 (a ball with all its mass at its radius), and whose glance angle lies between the normal and the surface, 0 to 90 degrees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body metadata owns these scalar policies and the collector owns range reporting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Passing scalars does not certify a simulated body, fitted inertia tensor or measured center of mass.

## @evidence contracts/development/common.md#meaningful-documentation

Null centerOfMass means omitted metadata; field paths and append-only errors are explicit.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of scalars costs constant arithmetic plus failure text.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Collector range semantics are shared, without caching mutable body metadata.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only caller-owned diagnostics remain; no physics body or native geometry is acquired.
