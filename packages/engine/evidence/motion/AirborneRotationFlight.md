# src/motion/AirborneRotationFlight.ts#AirborneRotationFlight

## @evidence contracts/development/common.md#meaningful-documentation

Reads orientation and body-frame momentum sensitivities by seconds from completed trajectory states.

## @evidence contracts/development/implementation.md#principled-implementation

Projects the existing quaternion and consecutive three-scalar tangent blocks without changing their interpolation or frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copies interval metadata and provides two numeric readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Playback never reads shape, momentum, a physical model or an integration callback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Orientation uses the optional quaternion projection without vector interpolation/copying; legacy trajectories retain the full-read fallback. Variation reads remain linear in the requested tangent count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both readers share the solved trajectory instead of reintegrating it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned closures own only the numeric trajectory and tangent count; their lexical scope has no history or right-hand side.
