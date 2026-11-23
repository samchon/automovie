# src/architecture/environmentSupportReport.ts#environmentSupportReport

## @evidence contracts/development/implementation.md#principled-implementation

Each piece's world box is its model's rest extent, from `computeModelRestExtent`, carried through `setPieceMatrix`, the transform the renderer draws it under. Walkable surfaces are read through `propSupportGap`'s footprint probes and the deepest probe answers; other pieces count where their plan boxes share area, with their box top as the face. The support is chosen as `builtEnvironmentSupportSweep` chooses it: the highest top at most the underside plus the tolerance, else the lowest top above, so a tucked chair rests on the floor and a sunk crate reports its negative gap. A non-resting piece with a wall mount is wall-borne when its least corner distance along the wall's inward normal is within the tolerance, which works for any room yaw. Building bodies take their own sweep's verdict at the placement height. Limits: box tops are proxies for the supporting faces, so a piece over the hole in a table's footprint still reads the table top.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The composer gathers inputs; this function measures and classifies; the building sweep, the surface probe and the rest extent stay with their owners and are reused unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No verdict depends on a scene, fixture or piece kind. The tolerance is the shared support tolerance unless the caller states one. Nothing is refused: findings are reported, because a hanging lamp can be intended.

## @evidence contracts/development/common.md#meaningful-documentation

States the measurement, the candidate choice, every verdict, the building rule and the refusal of a bad tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is O(pieces x (pieces + walkable surfaces x probe cost)) plus each building's sweep: every piece is compared with every other piece's plan box. A set holds tens to hundreds of pieces, so the quadratic scan stays small; each piece's rest extent and corners are computed once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each piece is measured once and serves both as a subject and as a candidate; each surface's footprint is built once for all pieces.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The maps of measured pieces and findings live for the call; the returned findings, one per piece, are the only retained output.