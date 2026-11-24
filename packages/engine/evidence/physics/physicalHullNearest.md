# src/physics/physicalHullNearest.ts#physicalHullNearest

## @evidence contracts/development/common.md#meaningful-documentation

States both geometric cases, scalar/full result modes, contact features, signed metre frame, volume refusal and the flat form read by both overloads.

## @evidence contracts/development/implementation.md#principled-implementation

The signed distance of a convex polytope from its half-space form (Ericson, Real-Time Collision Detection, section 5.1): the greatest plane distance when no plane is in front, and the Voronoi region of a face or an edge of the facing faces otherwise; a vertex region is the end of an edge. The inner-side test is the edge's triple product with the projection written as one product with the precomputed in-face direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point-to-hull body serves the original contact and scalar modes. physicalShapeQuery supplies the actual shape-local point, while physicalHullSegment continues to own segment minimization; typed-array plane/edge loops keep the original arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance, plane/edge order, deepest/least comparison, early return or volume refusal changes. Scalar mode omits only final contact fields; full mode retains its fresh point and original borrowed/copy normal policies. Bounded loop indices justify the existing non-null assertions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keeps the full plane scan, facing-edge tests and original squared-distance/root work. Scalar queries avoid the unobserved final wrapper and point/normal records, including every search probe of a tapered hull; no distance or geometric candidate is omitted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both modes share this one distance calculation and the existing physicalHullFaces/flat geometry owners. The unchanged weak hull preparation and plane-distance workspace serve every actual query; no target or point result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Existing weak flat forms live with their hull records, and the existing distance buffer grows to the largest queried hull and is overwritten per call. Scalar mode returns only a number; full mode keeps its original contact ownership, with no new persistent state.

# src/physics/physicalHullNearest.ts#physicalHullNearest.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Names the fixed supporting faces, the changing point in shape-local metres, the signed scalar result and the caller's responsibility to keep the preparation unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing point-to-half-space and closest-edge search in scalar mode.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The wrapper supplies the fixed hull to the same proximity computation that serves the standalone scalar and contact entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves all plane and edge admissions, exact ordering and the refusal when the hull has no volume.

## @evidence contracts/development/implementation.md#efficient-algorithms

Packs planes and edges once, then reads each query in linear face and reached-edge work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller supplies the same supports it already prepared. Changing points reuse only their fixed packed representation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned reader owns its packed arrays and one working distance array. Each call writes and reads the working distances synchronously.
