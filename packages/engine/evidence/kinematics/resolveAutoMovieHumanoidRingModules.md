# src/kinematics/resolveAutoMovieHumanoidRingModules.ts#resolveAutoMovieHumanoidRingModules

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the unit, what each module is built from, which joints carry none, the order of the result and the two consumers the single statement serves.

## @evidence contracts/development/implementation.md#principled-implementation

Every dimension is a joint span or a girth radius of the skeleton; a section widened to a breadth keeps its girth circle's area (depth = r²/breadth), and the two trunk shares are the anthropometric conventions named at their constants.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function owns ring selection and ring points for the drawing and for the colliders; it knows no renderer and no physics, only vectors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fitted dimension, body-specific branch or skin surface enters; a missing joint is refused rather than replaced. The non-null assertions index fixed-length lists the function builds.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the joints with map lookups: linear in the joint count, eight points per ring.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the rest skeleton, called once when a drawing or a profile is built.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing between calls; the returned modules belong to the caller.
