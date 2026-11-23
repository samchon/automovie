# src/production/IAutoMovieFormationPlacement.ts#IAutoMovieFormationPlacement

## @evidence contracts/development/design.md#principled-representation

A `Pick` of the six design fields slot placement reads and the optional blocks intersected with the terrain record, so the compiler proves placement needs nothing else and a compiled formation satisfies it structurally.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Derived from `IAutoMovieFormationDesign` rather than restated, so a change to any picked field's type reaches placement without a second declaration to update.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Leaves out hero overrides and model groups so a gate cannot depend on them, and no consumer adds a private field to it.

## @evidence contracts/development/common.md#meaningful-documentation

Names each picked field and what placement uses it for, the added terrain snapshot, and the omitted design members with the reason they are left out.
