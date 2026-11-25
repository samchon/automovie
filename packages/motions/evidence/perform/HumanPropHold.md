# src/perform/HumanPropHold.ts#HumanPropHold.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each hand's grip socket in the prop's frame from its offset; the hands' two implied turns blended halfway; the least turn laying the prop's line between the sockets on the world's, a half turn about the axis across the line that keeps the blended up where the line points opposite (the swing of a swing-twist split, whose axis is free only then); the middles matched.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two points, one blend, one alignment, one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Two sockets at one point, or a prop line already along theirs, leave the blend alone, never dividing by nothing; a line pointing opposite is turned, never left reversed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/perform/HumanPropHold.ts#HumanPropHold.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the two frames and the inputs.

## @evidence contracts/development/implementation.md#principled-implementation

The grip socket placed on its bone by the body's own surfaces, with the hand bone's rotation, the frame a held prop rides.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
