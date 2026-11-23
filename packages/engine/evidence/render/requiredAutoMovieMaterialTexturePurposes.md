# src/render/requiredAutoMovieMaterialTexturePurposes.ts#requiredAutoMovieMaterialTexturePurposes

## @evidence contracts/development/implementation.md#principled-implementation

Inspect consumed material declarations for subsurface-radius and overlay normal-fallback lookup roles, and add both area-light tables only when a PBR surface is reachable in that scope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner determines required implicit roles without inventing texture extents; the host supplies actual runtime texture facts and closure matches the same role names.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A declared zero subsurface radius still builds its actual lookup, while existing base/detail normal maps avoid fallback; no fixture or budget result changes role requirements.

## @evidence contracts/development/common.md#meaningful-documentation

Docs explain zero-radius presence, overlay/base-normal interaction, PBR/area-light conditions and exclusion of byte estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

M materials and their overlay lists require O(M+O) inspection, with a set bounded by four supported roles and fixed-size returned population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One role set deduplicates multiple consumers within the scope; changed materials/lights require fresh derivation and asset identity alone is not reused as proof.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only role strings escape; materials are borrowed and no lookup texture, native handle or asynchronous work is retained.
