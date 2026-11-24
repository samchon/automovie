# src/environments/furnishings/createBedroomKit.ts#createBedroomKit

## @evidence contracts/development/implementation.md#principled-implementation

Centres the measured bed on the -Z wall and reserves the 2010 ADA 806.2.3 parallel-approach clear floor, 0.76 m out from each long side and 1.22 m along it; puts the wardrobe at the +Z wall's run corner and the chest after it, each keeping the 305.3 clear floor, 0.76 m wide by 1.22 m deep, for a forward approach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Chooses models, relations and the cited clearances; the planner owns fit and refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every clearance figure comes from `ROOM_CLEARANCES` with its clause; the chest gap is an authored default stated as such. A narrow room is refused by the planner naming the bed's side clearance.

## @evidence contracts/development/common.md#meaningful-documentation

States the roles, walls, clearances with their sources, the refusals and that the figures are not a compliance claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws and measures each prototype once per occurrence; the shared planner's cost follows, bounded by the kit's few pieces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each role's model is drawn on its own seed stream, `<occurrence seed>/<role>`, so changing one producer does not reseed the others; pieces of one kind share one model and its box.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module captures its parameters only; each call's models and planner state live for that call and survive only in the emitted records.
