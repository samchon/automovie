# src/validation/validateJointConstraint.ts#validateJointConstraint

## @evidence contracts/development/implementation.md#principled-implementation

Admit finite ordered degree intervals, then minimize the shared swing metric over interval endpoints and the half-angle cosine's periodic extrema; independent cosine ranges make these fixed candidates sufficient under representable trigonometric arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Axis admission and cone feasibility are separate from pose sampling and per-pose ROM checking.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Periodic multi-turn intervals are not treated as monotone distance from zero; malformed axis intervals skip cone verdicts, and extremely large-angle binary64 phase reduction remains a limitation of the shared metric.

## @evidence contracts/development/common.md#meaningful-documentation

Null axis means immobile zero, while optional/null swing omits the coupled constraint. A declared `swingTwist` has its twist interval admitted like an axis interval, and its flexion and abduction ranges must both be non-null because the swing is read from them; a null `swingTwist` keeps the three-angle gate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three interval checks and at most four candidates per swung axis require at most sixteen metric evaluations, with bounded arrays and no angle sampling grid.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The swing formula remains shared with ROM consumers rather than a separate anatomical table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only collector rows remain; no joint simulation, pose history or native handle is retained.
