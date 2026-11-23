# src/geometry/assertAutoMovieDeformedTriangles.ts#assertAutoMovieDeformedTriangles

## @evidence contracts/development/implementation.md#principled-implementation

Area vectors are edge cross products and the cofactor matrix is the transformation that carries oriented area under the Jacobian, so the summed unit transports give the orientation the smooth field assigns the face; a positive dot product with the straight output face's unit normal is the admission, a transport whose norm alone overflows is rescaled by its largest component so that corner keeps its equal weight, and a non-finite or zero transport is refused by its own diagnostic rather than read as an opposed face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One assertion called once by `createAutoMovieMeshDeformer` after every vertex has its position and cofactor, so the per-vertex Jacobian work stays in the deformer and the per-triangle tessellation check stays here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No triangle is skipped for being small, collapsed or reversed and no area floor admits a near-zero face; every face of every mesh meets the same transported-orientation test.

## @evidence contracts/development/common.md#meaningful-documentation

States what is compared and in which layout, every refusal and what it names, the index premise and who establishes it, why transported rather than source normals are compared, the units, and that no area epsilon exists.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the t triangles with constant work each, three corner transports included, so O(t) time; the scalar locals and two three-element scratch buffers allocated once per call keep the loop free of per-triangle allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validates one deformed mesh per call; nothing in a later deformation repeats this mesh's cofactors.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds two three-element scratch buffers for the call and retains nothing after it returns or throws.
