# src/sound/sampleAutoMovieDialogueExpression.ts#sampleAutoMovieDialogueExpression

## @evidence contracts/development/common.md#meaningful-documentation

The comment states that the mouth layer is the coarticulated weights at the frame and that the authored layer is kept unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

The mouth layers over the authored expression, so the two are returned apart and the consumer composes them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

It wraps `sampleAutoMovieDialogueVisemeWeights`, which owns the blend, beside the authored expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The authored expression is passed by reference and never altered.

## @evidence contracts/development/implementation.md#efficient-algorithms

The cost of one weight sample: linear in the line's ranges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call samples one frame; frames are independent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns fresh records and holds no resource.
