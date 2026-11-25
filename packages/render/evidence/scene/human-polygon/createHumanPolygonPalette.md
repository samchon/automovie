# src/scene/human-polygon/createHumanPolygonPalette.ts#createHumanPolygonPalette

## @evidence contracts/development/implementation.md#principled-implementation

Validates RGB overrides and assigns matching original meshes without modifying geometry, bone placements or body dimensions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Palette ownership stays separate from shape selection, display mesh assembly and joint annotations; the drawing retains the outer disposal guard.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy correction, shader, palette preset or new cleanup collector is introduced; the existing retirement reporter attempts independent owned materials.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed defaults, new-pool ownership before old retirement, sticky replacement failure and the caller's guarded fan-out responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each replacement scans emitted parts once and constructs at most one material per matched RGB value.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal current RGB overrides share one material; omitted parts reuse borrowed clay and every original geometry remains unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The current pool replaces the old pool; one failed replacement retains bounded uncertain owners and its original cause, while the caller's completed retirement releases pool references without retries.
