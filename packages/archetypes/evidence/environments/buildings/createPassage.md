# src/environments/buildings/createPassage.ts#createPassage

## @evidence contracts/development/implementation.md#principled-implementation

A rigid horizontal span frame comes from world XZ landing separation. Its direction must align with either sign of each fitted opening's horizontal normal within 1e-9 in cosine. Closed slabs use the two top edges and thickness; steps take equal run and rise from that same span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolves endpoints and fits the requested variant before a common slab emitter creates one model and support per section.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bridge requires level endpoints, a ramp can enforce an authored maximum slope and a stair cannot hide a level or excessively large flight. No stair bypasses authored landing and host clearance design.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for a bridge or ramp, linear in the admitted step count for one flight.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolves a new occurrence's landing frames and geometry once; no cache shares placements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reusable definition retains a copy of its scalar dimensions and anchor names. One result owns a bounded set of slab records and does not retain a placement callback.

## @evidence contracts/development/common.md#meaningful-documentation

States named landing authority, dimensions, result populations and refusals.
