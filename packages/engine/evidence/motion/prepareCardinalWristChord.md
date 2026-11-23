# src/motion/prepareCardinalWristChord.ts#prepareCardinalWristChord

## @evidence contracts/development/common.md#meaningful-documentation

Defines the zero-twist premise, the actual rig-angle intervals and cardinal axes, and the squared unit-vector chord used before a radians comparison.

## @evidence contracts/development/implementation.md#principled-implementation

The last mobile factor preserves its own axis and the inverse first factor preserves its own axis, reducing the two direction images to declared circular arcs. Orthogonal cardinal coordinates give four direct normalized quaternion-matrix entries. A unit vector's chord is bounded by its spherical angle and then the whole orientation angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cardinal-axis admission, two fixed arc readers and four scalar matrix entries serve both direction checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unsupported frame or range declines. Rounded sector ambiguity uses the full-circle dot ceiling, and dot rounding can only loosen the rejection. No quaternion, angle, rank or joint is substituted for a selected projection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each arc prepares four endpoint scalars once. A local finite demand needs constant scalar work and no result objects, joint projections, or searches. End-to-end performance is verified separately by the public pickup takes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only fixed axes and range endpoints cross queries, under the actual projector's rigid metadata; every candidate rotation is read on its own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps two immutable arc readers and three coordinate names until the native projector is released, with no retained poses, score history or task.
