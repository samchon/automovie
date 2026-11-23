# src/scene/applySampledObjectMotion.ts#applySampledObjectMotion

## @evidence contracts/development/implementation.md#principled-implementation

Writes engine-admitted translation/scale triples and quaternion quadruples directly into parent-local transform fields, and indexed weights to existing mesh influences; input coordinate frame, vector widths and rotation validity are caller/sampler premises, while unresolved nodes and unmatched trailing morph indices are tolerated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the scene mutation for both clip entry points; a private morph traversal handles the one path whose target is a descendant collection instead of an Object3D transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses channel kind/path and the supplied resolver rather than fixture names or patched Three methods; it neither invents absent values nor repairs malformed numeric samples.

## @evidence contracts/development/common.md#meaningful-documentation

Gives coordinate/vector conventions, indexed morph behavior, skipped inputs, partial writes and the lack of a future-path exhaustive assertion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits S sampled channels once; transform writes are constant cost and each weights channel visits its target subtree plus the influences actually written, with only traversal callback allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both single and sequence sampling reuse this writer; no scene lookup or morph result is memoized because objects, hierarchy and influences may change between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the sample map and scene targets, owns no geometries/materials/workers and retains nothing after traversal; scene writes intentionally remain with the host.
