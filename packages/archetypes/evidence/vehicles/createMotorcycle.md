# src/vehicles/createMotorcycle.ts#createMotorcycle

## @evidence contracts/development/implementation.md#principled-implementation

Two wheels a wheelbase apart, a body box, a seat slab at the drawn seat height and a handlebar the drawn width across; a scooter's body stands under its seat only, with a front shield under the handlebar and the floorboard between the two, the step-through that tells it from a motorcycle; the foot contacts are `pedal` plates without travel, the kind a foot rests on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the read machine whole (`MODELS`), draw the dimensions no maker states, the wheels and the body by kind, then the seat, the bar and the foot contacts, a scooter's with its shield.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No engine, tank or controls; the front wheel does not steer, since a single-track vehicle turns by its lean.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the machine's origin and front and where the rider's seat, hands and feet go.
