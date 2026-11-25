# src/posture/HumanColliderDistance.ts#HumanColliderDistance

## @evidence contracts/development/common.md#meaningful-documentation

Defines signs, world metres, strict first winner, conservative screening, unchanged placement and the prepared segment/taper reader's operation-owned lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Reduces actual engine signed shape distances, less the supplied segment taper; a containing sphere provides a lower bound and retains the original greater-or-equal rejection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single ordered reducer serves cold calls and prepare's closure; that closure owns only world-sphere and opaque shape-reader scratch, while bounds and exact proximity mathematics retain their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps shape order, strict minima, taper arithmetic and empty-body refusal; a screen never substitutes for an actual winning distance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans F ordered shapes and pays exact query cost only where original screens permit; prepared operations compute at most F world spheres and opaque engine readers, without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Optional bounds/readers are valid only for this exact unchanged ordered placement; every segment and taper still runs its actual query and comparison.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Cold calls retain no placement/scratch; an explicit synchronous prepared operation owns one closure, its borrowed unchanged placement and at most F lazy world spheres/shape readers until release or throw. No queried point, result, global map, task or handle is retained.
