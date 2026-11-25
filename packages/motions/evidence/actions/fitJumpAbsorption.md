# src/actions/fitJumpAbsorption.ts#fitJumpAbsorption

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the affected phase, ground points, feet, root and unchanged target.

## @evidence contracts/development/implementation.md#principled-implementation

Read actual sole displacement and floor clearance at the signature cadence and phase boundaries. First fit the endpoint with the authored initial acceleration. If even the shallow path cannot fit, use the same incoming velocity and a contact acceleration that reduces the midpoint's incoming-velocity displacement by two fifths. At either acceleration, a verified bracket endpoint feeds the same quintic that playback uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both acceleration choices use the same deep and shallow depth check and bracket search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Samples actual resolved limbs with unchanged onset velocity, duration, 5 mm continuity budget and footprints. If neither tested path fits, the original path is retained without a fit claim. Nonrotating jumps retain their original preparation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Candidates sample actual foot and toe FK at the existing audit cadence. They bracket only when the depth endpoints disagree and try earlier braking only if the first acceleration has no fit. No solve is added at playback.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The resolver preparation and sole-target geometry are shared across this one synchronous depth search. Each candidate still solves its current ankle, contact and pose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Bounded geometry, FK demand and projection stay in the call. Only the chosen root and acceleration survive.
