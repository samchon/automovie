# src/internal/validatePayloadClosure.ts#validatePayloadClosure

## @evidence contracts/development/implementation.md#principled-implementation

GLB buffer zero owns BIN with at most three pad bytes; URI buffers require exact lengths and views fit declared and resident bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One payload owner sequences buffer binding, orphan-BIN checks, view bounds and image presence before profile decoding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing sidecars throw; resolver effects occur per declared entry and are not silently deduplicated or replaced.

## @evidence contracts/development/common.md#meaningful-documentation

Comments state read-only resident bytes, URI resolver responsibility, padding limits and no network fetch.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows buffer/view/image counts and encoded data-URI bytes, plus the caller's complete resolver work for each declared external URI entry; repeated URIs repeat callback effects, borrowed payloads avoid copies, and data URIs allocate decoded arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each resolved buffer is reused by its accessors inside the call; callback effects prohibit caching by URI without caller guarantees.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The inspector owns the temporary payload list and decoded data-URI arrays only for the call; sidecar buffers remain borrowed.
