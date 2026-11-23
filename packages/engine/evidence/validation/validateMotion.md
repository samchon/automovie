# src/validation/validateMotion.ts#validateMotion

## @evidence contracts/development/implementation.md#principled-implementation

Admit motion identity/skeleton, positive duration, loop, ordered in-range times/easing, frame pose/expression and adjacent-axis speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pose/expression owners retain their semantics, and motion owns temporal rules and bezier controls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

900deg/s is a policy threshold, not measured anatomy; sparse bezier tuple admission must inspect all four actual elements.

## @evidence contracts/development/common.md#meaningful-documentation

Seconds, degrees, strict time increase, easing menu and inclusive bezier X bounds are documented.

## @evidence contracts/development/implementation.md#efficient-algorithms

K frames pay pose/expression traversal; adjacent-axis lookup cost also depends on joint counts, not only K.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Closed easing vocabularies are shared, while each frame's current values are validated anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The collector owns output rows; no sampled pose sequence, animation clip or host task is retained.
