# src/architecture/builtPlacedPartBoxes.ts#builtPlacedPartBoxes

## @evidence contracts/development/implementation.md#principled-implementation

Folds every transformed vertex into a running minimum and maximum, which is the exact axis-aligned box of a finite point set; the transform is the column-major affine product `world · partTRS`, so this bounds that computed CPU point set under the stated static premise, with ordinary binary64 rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement and tessellation rule shared by the element, part, part-sweep and space-content bounds queries, so how a part is measured lives in one file instead of four private copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no model or part kind; the origin fallback for an unheld model or vertex-less parts is a stated rule that keeps the record's stated position, not an invented extent.

## @evidence contracts/development/common.md#meaningful-documentation

States the world frame, the part order, the static CPU placement and its excluded pose and GPU effects, which vertices are read, when a part adds no box, the meaning of an `undefined` model, the origin fallback, and that the boxes' union is the element box.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P + V) for P model parts and V visited vertices, plus procedural tessellation cost. Empty parts still pay their iteration; transformed points are folded directly rather than stored in another array, and each primitive is tessellated once per part per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Tessellation is not cached across calls, because a primitive's shape is part of the caller's mutable record; callers that measure many elements resolve world matrices once and call this per element.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing after returning; the caller owns the boxes, one per part, and each tessellation is garbage once its part is folded.
