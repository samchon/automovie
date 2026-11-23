# src/geometry/markAutoMovieMeshClearance.ts#markAutoMovieMeshClearance

## @evidence contracts/development/common.md#meaningful-documentation

States how both ends of a segment follow from a witness, the kind, label, colour, path, flag and frame, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The witness's weights belong to the front triangle and its gap is a signed depth difference along the measured axis, so the back point is the front point less the gap along that axis; the segment's length is the clearance and its direction says which surface is in front.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the witnesses with one weighted sum each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Weights are used as measured, slightly negative roundoff included, as the witness type requires, and a malformed witness is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the witnesses.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one measurement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh marks and keeps nothing.
