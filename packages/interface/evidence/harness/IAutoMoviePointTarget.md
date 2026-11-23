# src/harness/IAutoMoviePointTarget.ts#IAutoMoviePointTarget

## @evidence contracts/development/design.md#principled-representation

resolveTargetPoint returns the supplied vector by reference in world metres. Shot admission first checks finite point components, then may prefer a host targetAt answer; the reference actor synthesizer uses the literal point directly, so callback consistency remains a host premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One vector is the whole target, and it reuses the shared `IAutoMovieVector3` rather than three loose numbers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A non-finite point is refused rather than clamped, and the point is never snapped to a nearby node.

## @evidence contracts/development/common.md#meaningful-documentation

States when to use it and when not, how it resolves, the refusals and how a camera frames it; the member gives the frame and unit.
