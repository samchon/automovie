# src/space/affordanceSupportContacts.ts#affordanceSupportContacts

## @evidence contracts/development/implementation.md#principled-implementation

Each extent's XZ point is rotated/translated by the affordance frame, then rotated/translated by the model root using canonical quaternion/vector owners; unit rotations and unit scale are the geometric equivalence premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns only contact-point derivation; support hull/toppling judgment remains a separate operation, and no repository product caller currently invokes this exported producer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-stack-top or absent extents throw rather than invent a face. Extent Y is ignored by contract, but ignored transform scale remains a limitation for full affine contacts.

## @evidence contracts/development/common.md#meaningful-documentation

Documents model-local XZ, two rigid transforms, scale limitation, misuse exceptions and fresh output ownership; test-only reach does not establish a wired support pipeline.

## @evidence contracts/development/implementation.md#efficient-algorithms

E extent corners require O(E) fixed quaternion/vector operations and fresh point storage; no hull or model traversal is performed here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Canonical Quaternion.rotateVector and Vector3.add own the arithmetic; each call reads its current frames without retaining pose-dependent contacts across changed placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh contact array and points; intermediate points leave scope and neither model, extent nor host handle is retained by the helper.
