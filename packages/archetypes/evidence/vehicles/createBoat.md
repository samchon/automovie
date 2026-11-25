# src/vehicles/createBoat.ts#createBoat

## @evidence contracts/development/implementation.md#principled-implementation

Selects the canonical producer for the saved hull kind and forwards all dimensions and selectors.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validated kind selects its own hull and outfit producer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The saved parameters pass unchanged to the selected producer, which owns their admission and its provisional constants.

## @evidence contracts/development/implementation.md#efficient-algorithms

One kind check and one table lookup before the selected producer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The saved and named calls are the same producer with the same seed data.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the boat floats, its axes, who sits, stands and holds where, the oars' articulations, and what is out of scope.
