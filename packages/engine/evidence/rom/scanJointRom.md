# src/rom/scanJointRom.ts#scanJointRom

## @evidence contracts/development/implementation.md#principled-implementation

An interval's overshoot is the distance to its nearer bound and an immobile axis's is the whole angle, the distances a clamp would move the joint; the swing is measured by `swingConeAngle` on the rotation the renderer reads, so a resting axis counts as its actual 0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private scan body owns every fault rule. This entry keeps its callback/void interface for validation and audits, while overshoot and the fixed-bone prepare scorer serve numerical solvers through that same body; only fault emission chooses reporting or ordered summation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance is added and no bone or axis is special-cased; a non-finite angle is reported without a distance instead of being scored as zero or clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three axis checks and an optional cone angle remain fixed work without records or collector closures. Swing-twist retains its actual rotation, reading and existing radius-table lookup; its finite check uses three ordered reads without an array callback. Both entries add one fixed core call, and fault dispatch adds one fixed helper call; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callback reports and scalar solver scores share the same scan and fault order. An explicit prepare scorer borrows one unchanged bone/constraint/frame and lazily shares its basis and pure composition factors at the original admission site; candidate checks and numerical readings still run.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct scans retain nothing and faults leave through the caller's callback. Each explicit prepare scorer owns one optional prepared frame/composer with bounded axis-factor state until caller release; it stores no joint result, target history, handle or task.

## @evidence contracts/development/common.md#meaningful-documentation

States who reads the scan and why it builds no message, the report order, what `null`, `0` and a non-finite angle mean on each kind of axis, how each overshoot is measured, the swing coupling, and each callback argument's unit.
