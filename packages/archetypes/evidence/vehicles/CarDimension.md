# src/vehicles/CarDimension.ts#CarDimension

## @evidence contracts/development/common.md#meaningful-documentation

Names every free dimension with its unit and meaning, the standard it is measured by where one applies, and which classes lack which dimensions.

## @evidence contracts/development/design.md#principled-representation

A closed union of the dimension names `createCar.UNITS`, `CAR_BANDS` and `CAR_MODELS` key by, each with one stated unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the car; `createCar.Dimension` is its public name and the car's bands, models and builders read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A class's bands omit the dimensions of the parts it lacks, so no class draws a figure it cannot build.
