# src/film/staging/setPieceMatrix.ts#setPieceMatrix

## @evidence contracts/development/implementation.md#principled-implementation `Matrix4.compose` builds `T · R · S` with the `three.js` element order, over the decomposed transform `setPieceTransform` gives `stageScene`'s node, so the matrix equals the one the staged node is drawn with.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One set-piece matrix shared by the prop occupancy, clearance, anchor and support-face queries, which each carried a private copy; the placement rules themselves live once in `setPieceTransform`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every piece is placed by the same precedence of rotation over facing over none; no model or prop kind is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix layout, the source of each of translation, rotation and scale with their defaults and units, the composition order, and that it matches staging.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one quaternion from an angle at most and one sixteen-entry composition.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one piece; each prop query composes it once per staged prop.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned matrix.
