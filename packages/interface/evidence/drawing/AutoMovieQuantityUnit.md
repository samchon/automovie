# src/drawing/AutoMovieQuantityUnit.ts#AutoMovieQuantityUnit

## @evidence contracts/development/design.md#principled-representation `measureAutoMovieQuantities` maps each subject to its unit through an exhaustive record typed over `AutoMovieQuantitySubject`, so a new subject cannot compile without a unit, and all lengths are model metres with no conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four SI-style literals cover lengths, areas, volumes and counts; the unit is written on the finding so a reader of one row needs no lookup table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No scale or display unit is applied per consumer; every finding is reported in the model's own metres.

## @evidence contracts/development/common.md#meaningful-documentation

States what each literal means and that one finding's numbers all share its unit.
