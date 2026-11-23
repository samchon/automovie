# src/film/classifyAutoMovieSectionPlaneBox.ts#classifyAutoMovieSectionPlaneBox

## @evidence contracts/development/implementation.md#principled-implementation

A linear function's support corners give its exact-real extrema over an ordered box, which this function checks before selecting them. Two shared distance evaluations implement that criterion per plane; their products, sums and boundary comparisons retain binary64 rounding and overflow limits. Crossed means no single plane wholly removes the box and at least one fails to wholly keep it, not proof that the combined kept half-spaces intersect it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The box counterpart of `autoMovieSectionPlanesKeepPoint`, both reading `autoMovieSectionPlaneDistance` for the sign convention and the degenerate-plane refusal, and kept out of frustum acceptance for the stated reason.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no subject or plane; the boundary rule is the shared distance's, and a malformed box is refused rather than classified by swapped corners.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and unit, the three verdicts and the empty-plane case, the support-corner method, the touching rule with its reason, each throwing case, and why the test stays out of frustum acceptance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the plane count with two distance evaluations per plane instead of eight, and an early return on the first plane that removes the whole box.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure classification of one box that coordinates nothing across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; it allocates two corner vectors per plane and returns one state.
