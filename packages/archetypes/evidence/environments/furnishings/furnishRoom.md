# src/environments/furnishings/furnishRoom.ts#furnishRoom

## @evidence contracts/development/implementation.md#principled-implementation

Measures the oriented rest box of every model in the room frame. Keep-outs are blocked first, overrides of grid roles claimed next, then related pieces resolve with their clearances. A repeating lattice starts at the minimum XZ edges with one aisle of perimeter inset; each cell translates the group box so neighbouring boxes have the stated aisle, and a slot is taken only when every missing member clears every blocked rectangle. Each staged frame lifts the origin to the placement's Y, the underside on the floor unless a wall relation hangs it. Each wall piece's wall becomes a mount: the inner face's room point and inward normal moved into the world by the room frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan geometry lives in `FurnishingRect` and relations in `resolveFurnishingPieces`; this function validates the room, orders the claims, fills the grid and stages every role through the common prop adapter. Kit producers supply models and relations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Grid spacing uses conservative group boxes. The 915 mm default is the U.S. Access Board's accessible-route width, used as a layout default and not a compliance claim. Explicit overrides are never moved, and continuous actor clearance is not solved.

## @evidence contracts/development/common.md#meaningful-documentation

States the claim order, floor seating, slot and aisle policy, overrides, refusals and emitted records including mounts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each prototype is measured before the call and projected once. Grid slots are considered at most once, each checking the blocked rectangles. Output work grows with the staged roles and their affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Instances share their model prototypes, measured boxes and one prop adapter per model; per-occurrence ids, frames and mounts are rebuilt from the inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The blocked and placement maps live for the call. The returned records are bounded by the pieces, the requested group count and the model affordances. No external resource is held.
