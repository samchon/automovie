# src/lexicon/HandrimMaterialTransfer.ts#HandrimMaterialTransfer.rate

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, signed sample interval and unresolved rate.

## @evidence contracts/development/implementation.md#principled-implementation

Dot the displaced radial direction with the anchor's sine and cosine axes. Divide the signed angle by the signed time difference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single angular projection followed by the finite-rate condition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The frame is supplied by the chair and no out-of-window callback is required.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar and vector operations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The motion law computes this once per boundary and reuses its scalar result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input.

# src/lexicon/HandrimMaterialTransfer.ts#HandrimMaterialTransfer.advance

## @evidence contracts/development/common.md#meaningful-documentation

States the offset, radius, time window and output goals.

## @evidence contracts/development/implementation.md#principled-implementation

The angular lead is time multiplied by the complement of minimum jerk. It starts with unit slope at zero seconds and reaches zero with zero slope at the fade boundary. Rotate the radial and tangent about the shared axle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute the angular lead, then rotate the two directions and translate the contact by their radial difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Use the declared radius and original axle for the tapered continuation. The handrim law supplies the unchanged grip before or after the continuation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant arithmetic per transfer sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the prepared contact and angular rate for the active hand.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one grip and retains no input.
