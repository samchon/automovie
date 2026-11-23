# src/posture/humanPostureHeading.ts#humanPostureHeading

## @evidence contracts/development/common.md#meaningful-documentation

States degree axes, original evaluation/product order, private fixed geometry, fresh quaternion ownership and angles' original forward/left/up atan2/asin inverse.

## @evidence contracts/development/implementation.md#principled-implementation

The existing heading is Ry(yaw) multiplied by Rx(pitch) times Rz(roll), then normalized. Quaternion.prepareAxisAngle performs the same half-angle arithmetic while reusing each immutable unit axis's direction and length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This numerical owner contains the original heading and inverse formulas; resolver facades/rigid source consumers share them while clinical/goal admission remains with the resolver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle wrapping, projection, tolerance, multiplication regrouping or target substitution is added. All original angle values, signed zero and nonfinite arithmetic still reach the same quaternion owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three fixed-axis preparations occur lazily once; heading retains original trigonometry/products/normalization without rebuilding axis geometry. angles retains its three vector rotations and original scalar inverse formulas. Both operations are constant work and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unit-axis literals remain private and unchanged, proving reusable direction/length independently of every current yaw/pitch/roll input; each call reads angles in original order and returns fresh numerical output.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module owns exactly three tiny axis-reader states for its lifetime. No body, authoring record, completed quaternion, reader loan, result history or handle is retained.
