# src/vehicles/CarAffordance.ts#CarAffordance

## @evidence contracts/development/common.md#meaningful-documentation

Names every affordance id, the part it belongs to, the direction of a positive travel, which ids ride another, and which classes lack which ids.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal ids `CarBody`, `CarRear` and `CarCabin` build, so an act names a part the car has a word for.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the car; `createCar.Affordance` is its public name and the car's builders and `driveCar` read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One union serves every class; the builders omit the ids of the parts a class lacks rather than the union naming a class per id.
