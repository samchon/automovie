# src/draw/isAutoMoviePlainBeautyRequest.ts#isAutoMoviePlainBeautyRequest

## @evidence contracts/development/implementation.md#principled-implementation

A request asks for the film picture alone when it draws the beauty shade and changes nothing about what is drawn: no selection, hiding, marks, trail, colouring, labels, section or x-ray. Stroke, reach and ticks only style marks, which such a request has none of.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Kept out of the draw host so the host stays under the file size rule; the host is its only caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The list is the issue's, extended by labels, section and x-ray, which also change the picture.

## @evidence contracts/development/common.md#meaningful-documentation

States the rule and why plain captures are sampled like delivery.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
