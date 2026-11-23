# src/actions/prepareSupportHelperGrip.ts#prepareSupportHelperGrip

## @evidence contracts/development/common.md#meaningful-documentation

States the moving contact and the order of the two roles.

## @evidence contracts/development/implementation.md#principled-implementation

The current rotated wrist-to-palm offset locates the helper wrist that places the two anatomical palm points together.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the single contact reader and translates the already planned wrist goal while its actual grip is closed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the same support plan, contact interval, palm geometry and reaching arm on every body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only the helper's occupied arm observes one partner hand, once per requested interior sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The helper uses its interval's planned hand attitude and bend, and reads the helped hand from the existing performer reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds only the fixed hand frame, contact bounds and the partner's reader for the owning plan's lifetime.
