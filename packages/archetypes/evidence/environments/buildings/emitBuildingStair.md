# src/environments/buildings/emitBuildingStair.ts#emitBuildingStair

## @evidence contracts/development/common.md#meaningful-documentation

States ownership of the staged treads, room connection and support coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Emits the ordinary scoped stair at the normalized local landing frames, then places each surface and route point through the building's same upright transform.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared passage producer owns flight geometry. This adapter attaches its result to the existing environment model, element, room, surface and connector tables.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Room links and geometry refer to real scoped stair records. Slab apertures are already present in the admitted building plan.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the flight's admitted number of treads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Every flight is a distinct staged occurrence with no retained prototype.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the caller's assembly tables, bounded by the authored flight. Local temporary frames and maps are released before returning.
