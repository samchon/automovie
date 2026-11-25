# src/physics/physicalHullNearest.ts#physicalHullNearest

## @evidence contracts/development/common.md#meaningful-documentation

States the two geometric cases, the contact and scalar modes, shape-local metres and volume refusal. The prepared scalar reader borrows fixed supporting faces and receives varying shape-local points.

## @evidence contracts/development/implementation.md#principled-implementation

Reads signed distance from the existing supporting half-spaces. Inside, the greatest signed plane distance gives depth. Outside, the face and edge Voronoi regions supply the nearest feature. The prepared path uses the same exact scalar search. Ericson, Real-Time Collision Detection, section 5.1. The inner-side test uses the edge triple product as one product with its precomputed in-face direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point-to-hull numerical owner serves the original contact and scalar modes and the fixed supporting-face reader. The shape query supplies the actual point, and the segment query retains its segment minimizer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All entries keep the original plane and edge admission, order, comparisons and volume refusal. Scalar mode omits final contact materialization, while full mode produces a fresh point with the original normal ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

The prepared scalar reader borrows the shape-owned flat form or packs the fixed faces once. Each query keeps the linear plane scan, the actual facing-edge tests and the same square-root work. Scalar probes of tapered hulls avoid the final contact wrapper at each search step.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The single-query modes share the same hull and flat geometry owners. The prepared reader shares its fixed packed representation and fully overwrites its working distances for every point.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A direct read owns one distance array for the duration of its call. The prepared reader owns the fixed flat representation and one distance array for its operation. A scalar read returns only a number.
