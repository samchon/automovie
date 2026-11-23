# src/physics/derivePhysicalProfile.ts#derivePhysicalProfile

## @evidence contracts/development/common.md#meaningful-documentation

Defines primitive density, collider and inertia approximations, local segment frames and complete overrides; options document SI units and the provenance the caller must supply.

## @evidence contracts/development/implementation.md#principled-implementation

Uses analytic primitive volume and centroid, solid-sphere inertia or the declared bounding-box approximation, then the parallel-axis theorem. Rest FK fixes segment frames; unattached parts are changed from model to the root's neutral frame. Positive finite density and part mass precede aggregate admission, followed by body consistency at the existing 1e-8 threshold and full profile validation. Imported geometry and empty segments require full overrides; no hull or more accurate capsule inertia is claimed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Original rest/parent preparation precedes per-segment override validation. Only a segment with no complete override filters current parts, then completes primitive admission before aggregation; final mass, neutral centre, joint derivation and profile validation keep their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Geometry, density, material, actuator and override choices come from the current call. An override is validated and cloned before any parts read for that bone; all-overridden models never read parts. Raw parent, model.parts and attachedBone observations retain their original order and frequency. Physical formulas, consistency tolerances and missing-actuator rejection remain unchanged; no mutable model is cached or repaired.

## @evidence contracts/development/implementation.md#efficient-algorithms

For B bones and P parts, the general raw path retains O(B*P) filtering because model/getter stability is not asserted; complete overrides skip those scans entirely. Rest/joint helpers retain their validation cost and each bone aggregates its selected parts. Private owned intermediate reductions reuse centres, one sphere moment, squared half-extents and one neutral inverse without changing the original products/sums; runtime gains are unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every unoverridden bone reads the current parts and attachment fields at its original observation point. Only its actually owned fixed neutral transform and fresh intermediate numerical records share repeated inverse, sphere-moment and squared-extent work. There is no cross-bone public-input snapshot or cross-call numerical cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A temporary parent map, selected-part arrays and primitive mass records are bounded by this call's bones and parts and release on return or throw. Returned profile records and cloned overrides, joints and materials transfer to the caller; no body, task or external handle is retained between calls.
