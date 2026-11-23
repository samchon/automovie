# src/cinematics/IAutoMovieDeliveryCrop.ts#IAutoMovieDeliveryCrop

## @evidence contracts/development/design.md#principled-representation `resolveAutoMovieDeliveryCrop` accepts four finite edges in `[0, 1]` with `left < right` and `top < bottom` and returns a copy; the viewer installs the window as a `three.js` view offset on the full aspect, and frustum culling maps the same edges to normalized device coordinates, so rendering and visibility use one window.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four normalized edges are the whole window, resolution-independent by construction; omission of the whole record on its owner means the full gate, so the record never needs a "no crop" flag.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A malformed window throws instead of being clamped into range, and the full `0, 0, 1, 1` window clears the view offset rather than installing an identity one.

## @evidence contracts/development/common.md#meaningful-documentation

States the origin, normalization, inclusive boundaries, resolution independence, the open and closed range of every edge, and the failure a malformed window raises.
