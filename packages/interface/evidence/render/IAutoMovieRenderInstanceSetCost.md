# src/render/IAutoMovieRenderInstanceSetCost.ts#IAutoMovieRenderInstanceSetCost

## @evidence contracts/development/design.md#principled-representation

Compiled slot and chunk counts are exact while draw submissions are bounded over chunks, available prototypes and the most expensive drawable LOD part population; culling and selection only reduce that peak.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates logical population size and prototype count from submission bound so compact sets are not priced as one scene node or expanded dense members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A legacy one-prototype set explicitly counts one; no average LOD or sampled visible subset understates the conservative admissible frame cost.

## @evidence contracts/development/common.md#meaningful-documentation

Defines set id, exact slots/chunks/prototypes and the upper-bound nature of draw calls.
