# src/environments/furnishings/resolveFurnishingPieces.ts#resolveFurnishingPieces

## @evidence contracts/development/implementation.md#principled-implementation

Each relation is solved from measured rest boxes. A wall piece's origin is solved in the wall's run coordinates: `u` along the run from its start corner, which is the piece's local +X at the wall's heading, and `v` out from the wall, so its box starts at the offset or `gap` past its `after` piece's box end and its back face lies at `v = 0`; each wall maps `(u, v)` to room XZ by its table. A facing piece's origin is solved in the target's frame, where its reversed axes put its front face `distance` beyond the target's front face and its box centre on the target's box centre plus `offset`. The elevation default reads the model's own underside, so a hung producer keeps its cited height and a floor piece stands at zero. Pieces resolve in record order and may name only earlier ones, so there are no cycles. A clearance must stay clear of boxes and keep-outs but may share floor with another clearance, as a work aisle spans neighbouring counters; it is labelled by its name, which defaults to its side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The resolver owns relation solving and clearance reservation; `FurnishingRect` owns plan geometry and claims; `furnishRoom` owns keep-outs, overrides of grid roles, the grid and staging.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mounting height or clearance figure is added here; every value comes from the relation, the room or the measured box. A layout override replaces a piece's relation, as overrides do for grid roles. Refusals name the occurrence, the role and the cause.

## @evidence contracts/development/common.md#meaningful-documentation

States the claim order, the run coordinates, the override rule, the returned records and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(pieces x blocked rectangles) for the claims and clearance checks; a room holds tens of pieces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each piece's box is measured once by the caller; later relations read the stored placement, heading and run end instead of recomputing them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The maps live for one call and are returned to the room builder; the blocked map grows by one entry per piece and clearance.
