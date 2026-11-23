# src/film/deliveryCropNdc.ts#deliveryCropNdc

## @evidence contracts/development/implementation.md#principled-implementation

Validation is delegated to `resolveAutoMovieDeliveryCrop`, then each edge goes through the affine map from normalized pixel edges to NDC, `2u - 1` horizontally and `1 - 2v` vertically to flip the top-left origin; `whole` compares the resolved edges exactly, which is sound because the whole-gate default is the literal `0` and `1`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one conversion behind `projectToNdc` and the segment, box and sphere frustum tests, which each carried a private copy of it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every crop goes through the same validation and map; an omitted crop is the stated whole-gate default, not a separate branch per caller.

## @evidence contracts/development/common.md#meaningful-documentation

States the whole-gate default, the thrown error and why it is not clamped, and that the result is a new record.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one validation over four edges and six arithmetic results.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one crop; callers that test many points against one crop convert it once per call and reuse the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the resolved crop copy is dropped on return and the caller owns the result.
