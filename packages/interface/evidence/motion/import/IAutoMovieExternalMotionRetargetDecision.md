# src/motion/import/IAutoMovieExternalMotionRetargetDecision.ts#IAutoMovieExternalMotionRetargetDecision

## @evidence contracts/development/design.md#principled-representation

Retargeting additionally needs a root translation multiplier and a target identity, the two inputs a skeleton-to-skeleton transfer cannot derive from the source bytes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The retarget arm is the native arm plus exactly those two fields, so the union's narrowing exposes them only where they apply.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ingest validates the multiplier and target spelling but never resolves the target or picks a default scale, leaving both explicit for the engine pass.

## @evidence contracts/development/common.md#meaningful-documentation

The added properties state the finite-positive range of the multiplier and that the target is resolved after ingest.
