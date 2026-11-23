# src/render/capture/IAutoMovieCaptureSelection.ts#IAutoMovieCaptureSelection

## @evidence contracts/development/design.md#principled-representation

The three selections the skill names need different data, so they are a union keyed by `kind`: only a swept selection has a unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The kind, the swept unit's path and the patterns the cell draws; the patterns are what the inspection core reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The whole is a member of the union, not an absent selection.

## @evidence contracts/development/common.md#meaningful-documentation

States what each kind selects and how `parts` reaches the drawing.
