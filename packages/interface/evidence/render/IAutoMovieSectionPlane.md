# src/render/IAutoMovieSectionPlane.ts#IAutoMovieSectionPlane

## @evidence contracts/development/design.md#principled-representation

A plane in point-normal form defines the half-space `n·(p − p0) > 0` as removed; the engine readers normalize the normal on use, keep the boundary itself, and refuse a zero or non-finite normal or a non-finite point, while the viewer negates the normal because `three.js` keeps the side its normal points at and also keeps distance zero, so engine and renderer agree on one closed kept side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A point and a normal rather than a signed offset, because an authoring agent reaches a cut through geometry it already has, such as a floor level, a room's content bounds or a wall's face, and can name a point on it and the side to discard without solving for an offset it never measured.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The plane lives beside the frustum tests instead of in the scene, so delivery acceptance never depends on it, and a degenerate plane throws rather than silently meaning keep everything or remove everything.

## @evidence contracts/development/common.md#meaningful-documentation

States why the type exists, why it is not a camera field, its evaluators and the viewer adapter, why it is spelled point-normal, and for each field its space, its units, the side the normal names and the normalization and refusal rules.
