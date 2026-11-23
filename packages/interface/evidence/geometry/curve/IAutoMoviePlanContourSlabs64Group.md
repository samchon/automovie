# src/geometry/curve/IAutoMoviePlanContourSlabs64Group.ts#IAutoMoviePlanContourSlabs64Group

## @evidence contracts/development/design.md#principled-representation

Side-local integer ordinals preserve separate section domains; empty sides represent terminals or unresolved incidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieContourSlabs64 supplies groups to boundary preparation and contour face generation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported groups retain their incidence and reason instead of being silently rematched; ordinary inferred matching remains the planner's explicit legacy mode.

## @evidence contracts/development/common.md#meaningful-documentation

Defines side index scopes, event borrowing, empty groups and later reason mutation.
