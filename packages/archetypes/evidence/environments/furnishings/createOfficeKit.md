# src/environments/furnishings/createOfficeKit.ts#createOfficeKit

## @evidence contracts/development/implementation.md#principled-implementation

Repeats a desk with an office chair on its +Z side, turned to face it with its front at the desk edge, on the planner's grid; places the filing cabinet on the -X wall with the 305.3 forward-approach clear floor and offsets it from the corner by the amount that clear floor overhangs it, so the reservation stays inside the room; places the bookcase on the +X wall. The grid avoids both pieces and the clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Chooses models, the group and the wall pieces; the planner owns the grid, fit and staging.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The clear floor figure comes from `ROOM_CLEARANCES`; the corner offset is derived from it and the measured cabinet width.

## @evidence contracts/development/common.md#meaningful-documentation

States the roles, the chair relation, the wall pieces, the clearance with its source and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws and measures each prototype once per occurrence; the shared planner's cost follows, bounded by the kit's few pieces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each role's model is drawn on its own seed stream, `<occurrence seed>/<role>`, so changing one producer does not reseed the others; pieces of one kind share one model and its box.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module captures its parameters only; each call's models and planner state live for that call and survive only in the emitted records.
