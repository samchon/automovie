# src/kinematics/placeSwingTwistChart.ts#placeSwingTwistChart

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original hypot/azimuth gate, region radius, direction, shortest turn from the rest axis and twist-axis composition followed by normalization. A fixed frame makes only successful basis admission, source normalization, axis magnitude and affine operands invariant; every current place still supplies the original direction, angle and normalization work.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One inversion owner serves swingTwistRange.placed and its actual fixed-endpoint prepareBlend reader. Existing basis, radius, direction, shortest-turn, axis-angle and affine owners retain their formulas; optional private state only chooses prepared entries at the original call sites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No interpolation, azimuth threshold, radius, direction, normalization or multiplication association changes. The first use still admits basis before hypot, computes direction before source normalization, completes the shortest turn before twist-frame admission, and converts twist before axis-angle work. A failed admission installs no successful numerical reading; an empty reader may remain for retry. No place/output is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Direct inversion keeps the original constant work. Prepared inversion admits its basis once, normalizes the fixed shortest-turn source once, shares twist-axis magnitude and admits one fixed affine frame once; later reads omit those repeated fixed calculations/records while retaining current target normalization, direction/trigonometry and final normalization. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A fixed endpoint reader owns one state under its declared unchanged constraint/joint lifetime. The actual operation shares only metadata proven invariant by those inputs, delegating each numerical operation to the same direct/prepared owner; no global frame identity or queried chart result establishes reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct locals end with the call. Prepared state owns at most one admitted swing frame, one normalized source/aim reader, one axis reader and one affine reader until the endpoint reader releases it. Each result is fresh and no place, share, quaternion output, handle or task is retained.

## @evidence contracts/development/common.md#meaningful-documentation

Defines disc/clinical inputs, matching region/frame lifetime, original direct behavior, lazy metadata order and fresh rest-relative quaternion output.
