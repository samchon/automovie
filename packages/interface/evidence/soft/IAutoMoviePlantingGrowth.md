# src/soft/IAutoMoviePlantingGrowth.ts#IAutoMoviePlantingGrowth

## @evidence contracts/development/design.md#principled-representation

Level extension clamps stage minus onset times level over the positive final-level growth span; zero stage emits nothing and full stage reaches every admitted level.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two unitless scalars express authored growth state without a time integration model or species-specific maturation table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Onset times deepest level must remain below one so no declared branch order is permanently unreachable; invalid spans refuse rather than being clamped into a different growth law.

## @evidence contracts/development/common.md#meaningful-documentation

Defines closed-unit stage, onset range, emergence formula and positive deepest-level span.
