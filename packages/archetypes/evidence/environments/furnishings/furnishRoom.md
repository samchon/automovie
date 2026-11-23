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

# src/environments/furnishings/furnishRoom.ts#furnishRoom.DEFAULT_AISLE

## @evidence contracts/development/common.md#meaningful-documentation

Cites the U.S. Access Board §403.5.1 walking width and states it is a layout default, not a compliance claim.

# src/environments/furnishings/furnishRoom.ts#furnishRoom.IItem

## @evidence contracts/development/design.md#principled-representation

A role suffix, a model, its measured box and a pose relative to the group origin in metres and degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The cafe, gym and office kits describe their repeated group with it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The box is measured by the kit, not authored.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

# src/environments/furnishings/furnishRoom.ts#furnishRoom.IGrid

## @evidence contracts/development/design.md#principled-representation

A positive count, the name of the kit's count parameter, a role prefix and a nonempty group.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kits with a repeated group pass it; a room of related pieces alone omits it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The grid is one optional record, so a count without a group cannot be written.

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

# src/environments/furnishings/furnishRoom.ts#furnishRoom.IParams

## @evidence contracts/development/design.md#principled-representation

The room layout, related pieces in order and an optional grid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`createFurnishedRoom`, the cafe and gym kits and the room kits call the planner with it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Pieces and grid are independent optional parts; the planner resolves pieces before the grid.

## @evidence contracts/development/common.md#meaningful-documentation

States each member and the resolution order.

# src/environments/furnishings/furnishRoom.ts#furnishRoom.measure

## @evidence contracts/development/implementation.md#principled-implementation

Reads the engine's rest extent, the geometry film framing uses, and refuses a model without one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one measurement every kit and the relation producer share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback size.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the units and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One extent computation per model.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Callers measure each prototype once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
