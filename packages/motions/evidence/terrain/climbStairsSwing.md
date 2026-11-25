# src/terrain/climbStairsSwing.ts#climbStairsSwing

## @evidence contracts/development/common.md#meaningful-documentation

States the path, the progress, the departure hold and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The taut path over the profile with walkFoot's lift-before-travel departure read off the path's own first rise to the contact height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One path and one lift share per swing, then a reader of its share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The contact height is the audit's own; the hold only moves the foot back from the riser.

## @evidence contracts/development/implementation.md#efficient-algorithms

One path build and one walk along it per swing; constant work per read beyond the path's lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each swing's path is built once and read at every instant of it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each reader retains its path and three scalars.
