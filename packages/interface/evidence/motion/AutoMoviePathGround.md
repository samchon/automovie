# src/motion/AutoMoviePathGround.ts#AutoMoviePathGround

## @evidence contracts/development/design.md#principled-representation

A scalar represents a plane and a two-coordinate function represents single-valued terrain height; followPathMotion evaluates this source at path samples instead of treating waypoint Y as competing ground data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One scalar-or-function seam accepts flat ground and spaceGround's surface query without coupling path baking to support-space internals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Terrain is supplied by authored height data or a callback, with no special surface id or slope built into the union.

## @evidence contracts/development/common.md#meaningful-documentation

States world-axis units, ignored waypoint elevation, finite-result admission and the existing support-space adapter.
