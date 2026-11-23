# src/scene/IAutoMovieInstancedModelRepresentation.ts#IAutoMovieInstancedModelRepresentation

## @evidence contracts/development/design.md#principled-representation

Extends rigid rest geometry with an optional per-part motion repertoire baked after extraction; null explicitly represents static output without pretending absent gait data is an empty animated table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The generic Cycle parameter lets adopted rigid objects promise null while generated animated entries retain their actual cycle representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No synthetic gait is created for missing skeleton, missing repertoire or an unrequested bake; each static cause remains represented by null.

## @evidence contracts/development/common.md#meaningful-documentation

Explains rest extraction before motion baking and the supported reasons a cycle is absent.
