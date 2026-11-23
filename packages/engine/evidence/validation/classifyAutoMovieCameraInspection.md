# src/validation/classifyAutoMovieCameraInspection.ts#classifyAutoMovieCameraInspection

## @evidence contracts/development/implementation.md#principled-implementation

Only compatible safe-integer pixel counts enter the fraction comparison. The inclusive threshold is applied to the fraction of isolated pixels hidden in the matched composite; zero isolated pixels have no defined fraction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Classification is constant work per requirement and does not traverse or render the scene.

## @evidence contracts/development/common.md#meaningful-documentation

Separates definite out-of-frame, bounded ray evidence and measured occlusion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three ordered branches: definite exclusion, compatible pixel counts, then ray witnesses or unmeasured.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Incompatible counts, zero isolated pixels and an invalid limit are reported as such instead of graded.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant-time grade of one requirement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh result and keeps nothing.
