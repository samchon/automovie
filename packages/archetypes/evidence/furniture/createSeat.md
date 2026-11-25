# src/furniture/createSeat.ts#createSeat

## @evidence contracts/development/implementation.md#principled-implementation

Dimensioned boxes and rods placed from the drawn seat height, depth, width and back height; the seat affordance follows the `seat` convention of `AutoMovieAffordanceKind`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, lay the seat, then the support, back and arms each under the kinds that have them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sat-on dimensions come only from `BANDS`. Uncited and stated on their constants or here: leg and slab thickness, which shape the picture only; the back panel's thickness, which is the `grip`'s aperture; the footrest's 24 mm bar; and an arm pad's length of 0.7 of the seat depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of parts per kind.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what is modelled, where the seat frame stands, how places are addressed and where the origin is.
