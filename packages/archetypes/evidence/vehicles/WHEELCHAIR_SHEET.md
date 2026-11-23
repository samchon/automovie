# src/vehicles/WHEELCHAIR_SHEET.ts#WHEELCHAIR_SHEET

## @evidence contracts/development/common.md#meaningful-documentation

States what the sheet holds and why it is its own file.

## @evidence contracts/development/design.md#principled-representation

The sheet's rows as printed, millimetres and degrees, converted where `createWheelchair` reads them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source, the row shape and the rows, which `createWheelchair`'s models and ranges read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rows the sheet contradicts itself on are left out and the conflict recorded.

# src/vehicles/WHEELCHAIR_SHEET.ts#WHEELCHAIR_SHEET.IRow

## @evidence contracts/development/common.md#meaningful-documentation

States what a row is, its units and how a two-caster row is paired.

## @evidence contracts/development/design.md#principled-representation

The sheet's columns as printed, millimetres and degrees, ranges as pairs and the per-width figures as triples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; what `createWheelchair` reads a model and its ranges from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No figure is converted or derived in the row: it holds the sheet's print, and the producer converts it.
