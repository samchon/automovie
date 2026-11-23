# src/environments/furnishings/createKitchenKit.ts#createKitchenKit

## @evidence contracts/development/implementation.md#principled-implementation

Lays one run along the -Z wall, each piece abutting the one before through `after`, and reserves the NKBA work aisle, 1.067 m for one cook or 1.219 m for two, as a front clearance across each counter and the range, as wide as that piece. The refrigerator keeps none, because no cited figure covers it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Chooses models, the run and the aisle by cook count; the planner owns fit and the refusal naming the work aisle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both aisle figures come from `ROOM_CLEARANCES` with their source; no sink is drawn because no archetype draws one, and the JSDoc says so.

## @evidence contracts/development/common.md#meaningful-documentation

States the roles, the run order, the aisle by cook count and its source, the missing sink and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws and measures each prototype once per occurrence; the shared planner's cost follows, bounded by the kit's few pieces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each role's model is drawn on its own seed stream, `<occurrence seed>/<role>`, so changing one producer does not reseed the others; pieces of one kind share one model and its box.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module captures its parameters only; each call's models and planner state live for that call and survive only in the emitted records.

# src/environments/furnishings/createKitchenKit.ts#createKitchenKit.IParams

## @evidence contracts/development/design.md#principled-representation

The furnishing layout plus a closed one-or-two cook count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the furnishing layout, as the cafe kit does, with only the kit's own input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The layout's members are not restated.

## @evidence contracts/development/common.md#meaningful-documentation

States the cook count and its default.
