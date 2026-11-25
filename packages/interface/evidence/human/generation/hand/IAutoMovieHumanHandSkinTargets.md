# src/human/generation/hand/IAutoMovieHumanHandSkinTargets.ts#IAutoMovieHumanHandSkinTargets.SkinTargetsMakeArm

## @evidence contracts/development/common.md#meaningful-documentation

Construct the candidate arm/wrist for the supplied hand scales so skinTargets can measure the resulting knuckle skin. The callback must use those trial scales; the caller owns the repeated measurement and target adjustment.

## @evidence contracts/development/design.md#principled-representation

Construct the candidate arm/wrist for the supplied hand scales so skinTargets can measure the resulting knuckle skin. The callback must use those trial scales; the caller owns the repeated measurement and target adjustment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandSkinTargets.SkinTargetsMakeArm is the canonical exchange used by AutoMovieHumanHandSkinTargets.skinTargets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanHandSkinTargets input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/hand/IAutoMovieHumanHandSkinTargets.ts#IAutoMovieHumanHandSkinTargets.ISkinTargetsResult

## @evidence contracts/development/common.md#meaningful-documentation

Knuckle section breadth and girth targets in millimetres for the hand solve. These include the correction measured on the actual palm and web skin, in the canonical left frame shared by reflected sides.

## @evidence contracts/development/design.md#principled-representation

Knuckle section breadth and girth targets in millimetres for the hand solve. These include the correction measured on the actual palm and web skin, in the canonical left frame shared by reflected sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandSkinTargets.ISkinTargetsResult is the canonical exchange used by AutoMovieHumanHandSkinTargets.skinTargets, AutoMovieHumanHandSolve.solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanHandSkinTargets input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
