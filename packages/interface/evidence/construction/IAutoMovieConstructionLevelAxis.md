# src/construction/IAutoMovieConstructionLevelAxis.ts#IAutoMovieConstructionLevelAxis

## @evidence contracts/development/design.md#principled-representation

A part whose sections are the level planes (a trunk, a column) needs no tilted frame, and stations in world height keep its knots at their measured heights; a polar section needs its centre inside its box, which an origin course supplies without tilting the planes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record covers the fixed vertical and the drifting centre; the course reuses the outline type every other curve along a part uses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The planes stay level: a part that leans needs a straight, curved or jointed axis, not an origin course.

## @evidence contracts/development/common.md#meaningful-documentation

States the planes, the origin with and without its course, the axes, the station's meaning and the null case.
