# src/index.ts#readAutoMovieFilmDisplayTextureResidency

## @evidence contracts/development/implementation.md#principled-implementation

Reads the renderer-keyed fade/dissolve owners and copies each current width/height/copies3 extent, including failed terminal owners still retained by their state maps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This metadata projection follows existing compositor ownership and leaves draw, resize and disposal behavior with those owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failed disposal is not treated as freed storage: its extent remains reachable with the original cause until the renderer key is unreachable; reported rows are potential copy bounds rather than actual GLuint or freed-byte proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents actual acquired lifetimes, three RGBA8/no-mipmap copies, success-only row removal and failure retention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two WeakMap lookups and at most two fixed-size copied rows are constant work independent of scene and pixel population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only actual per-renderer owner state is reused; querying does not create an unused compositor or infer storage from arbitrary source sampling settings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned rows are owned scalar copies and acquire no resource; the renderer-keyed compositor owns retained copies and sticky failure, and successful owner disposal removes its map entry.
