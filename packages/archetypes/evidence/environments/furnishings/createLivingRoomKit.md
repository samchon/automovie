# src/environments/furnishings/createLivingRoomKit.ts#createLivingRoomKit

## @evidence contracts/development/implementation.md#principled-implementation

Measures the sofa, coffee table, armchair and bookcase, centres the sofa on the -Z wall and the bookcase on the -X wall by their measured widths, and places the coffee table and the armchairs by facing relations whose distances add the table gap to the measured table depth, so a reseeded sofa carries them with it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Chooses the models and the relations; the shared planner resolves, checks and stages them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No published standard read for this kit gives a sofa-to-table distance, so `tableGap` is an authored default stated as such; the armchairs reuse it for their knee space and spacing rather than inventing another figure.

## @evidence contracts/development/common.md#meaningful-documentation

States the roles, the relations, the default gap and its status, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws and measures each prototype once per occurrence; the shared planner's cost follows, bounded by the kit's few pieces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each role's model is drawn on its own seed stream, `<occurrence seed>/<role>`, so changing one producer does not reseed the others; pieces of one kind share one model and its box.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module captures its parameters only; each call's models and planner state live for that call and survive only in the emitted records.
