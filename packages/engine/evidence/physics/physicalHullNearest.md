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

The prepared scalar reader packs planes and edges once. Each query keeps the linear plane scan, the actual facing-edge tests and the same square-root work. Scalar probes of tapered hulls avoid the final contact wrapper at each search step.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The original modes share the existing hull and flat geometry owners. The prepared reader shares only its fixed packed representation across changing points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The original weak backing follows its hull and the existing distance buffer grows with the largest queried hull. The prepared reader owns its packed arrays and working distances until release. A scalar read returns only a number.
