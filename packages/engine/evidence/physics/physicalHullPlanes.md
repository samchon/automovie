# src/physics/physicalHullPlanes.ts#physicalHullPlanes

## @evidence contracts/development/implementation.md#principled-implementation

A supporting plane through a non-collinear triple has every point behind it (de Berg et al., Computational Geometry, chapter 11). Reading each plane from the first triple of its own members reproduces what an ascending scan of all triples accepts first on that face. On a closed convex surface every edge lies on exactly two faces, so faces that all support the points and leave no edge on one face alone bound the whole hull: a missing face would leave its neighbours' shared edges single.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns reading, ordering and admitting planes; `physicalHullTriangles` or a source hull names the candidates, `physicalHullLoop` orders each boundary, and `physicalHullFaces` owns the hull record and its memo.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

One tolerance decides every side and member test. A carried candidate that fails to support the points, or a surface left open, returns null instead of a partial hull.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F V) side and member tests for F faces over V points, O(F V log V) loops, and O(F^2) comparisons to drop repeats and to close the surface. A face seeks its first triple among its members, at worst cubic in the collinear members leading its index order.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One hull's planes per call; `physicalHullFaces` remembers the result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Membership arrays, O(F V) booleans, are call-owned and die with the call; the result holds normals, offsets and index lists only.

## @evidence contracts/development/common.md#meaningful-documentation

States the order, how a plane is read, when a face is dropped, and the check that carried candidates must pass.
