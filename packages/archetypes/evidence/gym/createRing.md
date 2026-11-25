# src/gym/createRing.ts#createRing

## @evidence contracts/development/implementation.md#principled-implementation

A platform box of the drawn height whose square is the drawn inside size and an apron; a post rod at each corner of the inside square rising to the top rope; four ropes on each side at the guide's heights, scaled to the drawn top rope's height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, the platform, the posts, the ropes, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ropes are straight rigid rods, not slack; no turnbuckles, pads or steps; the apron's width and the parts' sizes are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

One platform, four posts and four ropes per level.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the ring stands and its contacts.
