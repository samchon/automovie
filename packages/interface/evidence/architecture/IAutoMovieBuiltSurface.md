# src/architecture/IAutoMovieBuiltSurface.ts#IAutoMovieBuiltSurface

## @evidence contracts/development/design.md#principled-representation

Reuses the scene's own surface record, footprint and height rule, so a building support patch is evaluated by the same footprint and height functions a staged scene uses; validation runs the scene space validator over every building surface together with `walkable`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A pair of the owning logical space id and the unchanged scene surface, the same space-beside-thing shape `IAutoMovieBuiltPopulation` uses, with no building-specific surface fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Lowering filters `walkable` per generated scene space by the surfaces that space owns rather than copying the whole list into each, and an unresolved space id is a validation error instead of a fallback space.

## @evidence contracts/development/common.md#meaningful-documentation

States where lowering puts the surface, which ids `walkable` and a support locator cite, and that the space id must resolve.
