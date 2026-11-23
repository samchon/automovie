# src/render/resolveAutoMovieMaterial.ts#resolveAutoMovieMaterial

## @evidence contracts/development/implementation.md#principled-implementation

Collect all models' matching material ids, sort model ids and compare recursively key-ordered structural signatures; absent or conflicting definitions throw while identical duplicate definitions return the first borrowed record.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cross-model simulated-surface lookup is separate from ordinary model-local material binding, with one canonical structural equality owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Smallest model id gives deterministic identity after equality proof, not a way to conceal a conflict; no fixture or default material repairs an ambiguous id.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify global candidate population, borrowed result, blank/absent/conflicting refusal and property/declaration-order independence. Arrays are currently traversed as numeric-key records by the signature, under valid material shape admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scan M total materials, sort K candidates and canonicalize their B structural bytes, using O(K+B) temporary storage; inventory caches validated repeated id resolutions during its unchanged subject request.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All simulated material consumers reuse this resolver and one inventory result per id; a standalone call recomputes because mutable model/material contents decide equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the borrowed selected record returns; candidates/signatures are temporary and no host material, shader handle or retained lookup registry is owned.
