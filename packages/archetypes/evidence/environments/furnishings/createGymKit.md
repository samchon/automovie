# src/environments/furnishings/createGymKit.ts#createGymKit

## @evidence contracts/development/common.md#meaningful-documentation

States the room origin, orientation, bench and weight roles, attached contact paths and failure condition.

## @evidence contracts/development/implementation.md#principled-implementation

Positions the measured rest boxes of flat benches and dumbbells. The two weights stand alongside a bench without crossing its sides. FurnishRoom uses the lowest rest extent on Y to place each model on the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Chooses the room's two model prototypes and their group relationship. Common layout and prop instantiation stay in furnishRoom.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The station does not claim movement or manufacturer clearances for training equipment. Capacity, useful aisle and approach reservations are checked by the shared planner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds and measures two model prototypes once per occurrence. Cost then follows the shared room planner's candidate and requested population sizes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each occurrence shares a bench prototype and a dumbbell prototype across its stations. Instance ids and transforms remain distinct.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned module keeps the layout parameters. Each call owns its model draws and emits a population bounded by the requested stations. It owns no external resources.
