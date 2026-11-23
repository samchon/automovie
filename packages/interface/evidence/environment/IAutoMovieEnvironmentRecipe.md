# src/environment/IAutoMovieEnvironmentRecipe.ts#IAutoMovieEnvironmentRecipe

## @evidence contracts/development/design.md#principled-representation

An environment is an id, an optional root frame in world metres, an optional seed and a finite record of items. Keys identify occurrences, while a definition can be reused at several frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The root frame lets a containing definition reuse a recipe as a placed group. Top-level recipes normally need only id and items.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The composer checks nonblank slash-delimited root paths and slash-free item keys, admits only rigid root frames, and reports invalid or cyclic references. It does not repurpose a stage scene id as an item id.

## @evidence contracts/development/common.md#meaningful-documentation

Defines scope and key spelling, item order, seed semantics and root placement default.
