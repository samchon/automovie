# src/expression/AutoMovieArkitChannel.ts#AutoMovieArkitChannel

## @evidence contracts/development/design.md#principled-representation

The union reproduces Apple's documented 52 blend shape locations, grouped by facial region in the source, and `validateExpression` checks each authored `channel` against a runtime `Set` of the same names because a type alone cannot reject a string at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed string union is the whole vocabulary with no wrapper or registry, and it is the only structural constraint on `IAutoMovieBlendshapeChannel.channel`, with magnitudes left to the validator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No channel is renamed or added for a particular avatar; the remaining weakness is that the engine and viewer name lists are type-checked only as subsets of the union, so nothing but review keeps them complete when a channel is added here.

## @evidence contracts/development/common.md#meaningful-documentation

States the standard behind the names, the `[0, 1]` range and who enforces it, the exact or case-insensitive morph matching in the viewer, the duplicated runtime lists that must change together, and the upstream reference.
