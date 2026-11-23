# src/rom/validateJointRom.ts#validateJointRom

## @evidence contracts/development/implementation.md#principled-implementation

Report nonfinite, interval and immobile-axis violations in axis order, then combined swing with null as zero; the collector retains paths, actual values and degree overshoots. A joint whose constraint declares `swingTwist` is reported by `scanJointRom` as a `swing` fault past the reach of its flexion and abduction ranges and a `twist` fault past the swing-twist interval, worded here for those two; the measure is `scanJointRom`'s, so the gate and the solvers cannot disagree.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Axis and cone detection share projection owners' semantics/angular metric while the caller's collector owns diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Null is rest and zero is automatically valid only for immobile axes; constraint admission and periodic multi-turn limitations are separate rather than hidden here.

## @evidence contracts/development/common.md#meaningful-documentation

Props state joint/constraint/path/collector roles and degree overshoots; nonfinite angles produce range diagnostics before axis comparison.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three fixed axis checks plus one swing metric use constant work and append at most four rows; a ball joint gated by `swingTwist` appends at most two (swing, twist) after one lookup in the radius table that `swingTwistRange` builds once per constraint and basis and caches.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Detector/clamps share admitted constraints/metric, while collector effects are appended anew rather than cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns collector rows and release lifetime; joint/constraint references are borrowed and no handle or task is acquired.
