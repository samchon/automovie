# src/index.ts#applyObjectMotions

## @evidence contracts/development/implementation.md#principled-implementation

Samples the supplied sequence through the engine's per-channel authority rule, then applies only authoritative node channels to matching parent-local target coordinates; seconds and clip content use the engine convention, and future-only channels leave scene state untouched.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sequence authority belongs to sampleClipSequence and scene mutation belongs to applySampledObjectMotion; this adapter connects those existing owners without another frame or scene representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual clip sequence, time and resolver without node-name exceptions or replacement methods; skipped future authority is the engine rule rather than a hidden fallback clip.

## @evidence contracts/development/common.md#meaningful-documentation

States the per-channel authority rule, future-only behavior and the host's responsibility to restore staged bases when seeking between partially authored clips.

## @evidence contracts/development/implementation.md#efficient-algorithms

Engine sequence sampling visits candidate clip channels and resolves active authority; writing visits the authoritative table and descendant meshes for weights, retaining one temporary sample table rather than applying every candidate clip.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the mutation writer with the single-clip entry; sequence samples are not cached because clips, time and mutable target state jointly determine this effectful call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows clips and resolved objects only for this invocation; stores no cross-frame state, running tasks or GPU handles and lets temporary sample data become unreachable on return or throw.
