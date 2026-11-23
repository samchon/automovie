# src/animals/QuadrupedRestLimb.ts#QuadrupedRestLimb

## @evidence contracts/development/common.md#meaningful-documentation

States model frame, metres/radians, bend branch, independent result and refusal instead of moved support goals.

## @evidence contracts/development/implementation.md#principled-implementation

Subtract the authored two distal vectors from the foot to obtain wrist/hock, then intersect the circles of the first two lengths using the cosine rule. The bend sign selects a deterministic sagittal branch; full extension is continuous but a zero-length root-to-wrist line is refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read four source lengths, locate the distal joints backwards from the foot, and solve one proximal triangle with no numerical search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Targets and root never move and lengths never stretch. The only cosine clamp removes binary64 roundoff after reach admission; no anatomical range or biological coefficient is invented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four length reads and one closed-form triangle take constant work and five output points.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The wrist target and root-to-wrist distance serve both circle coordinates; source-dependent values are read from the supplied joints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and acquires no handles; all five output points belong to the caller.
