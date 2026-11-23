# src/construction/IAutoMovieSolidAtlas.ts#IAutoMovieSolidAtlas

## @evidence contracts/development/design.md#principled-representation

A merged solid is traced against as faces with their kept regions and the map across their shared boundaries, so a curve crosses from face to face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Body snapshots, prepared profiles and single-surface adapters share face lookup and kept/across callbacks used by trace and rail solvers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point past an open boundary has no neighbour and reads null.

## @evidence contracts/development/common.md#meaningful-documentation

States the faces, the kept test and the crossing map.
