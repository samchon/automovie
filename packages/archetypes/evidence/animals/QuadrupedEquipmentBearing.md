# src/animals/QuadrupedEquipmentBearing.ts#QuadrupedEquipmentBearing.yoke

## @evidence contracts/development/common.md#meaningful-documentation

States real neck tangency, a positive axial span centred on neckAt and restricted to the finite neck, the original beam endpoint and omission of an exactly zero connecting span.

## @evidence contracts/development/implementation.md#principled-implementation

The upward sagittal normal to the neck axis offsets the bearing axis by neckRadius+beamRadius. Two beam radii give its authored coarse axial length, clipped only to the finite neck endpoints. Its midpoint joins the clear beam; the original beam placement lies in the exterior tangent half-space, so the connecting cylinder cannot cut the neck.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the neck direction and upper normal, record one tangent bearing cylinder and then its nonzero beam link through the shared planner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Original beam and hitch geometry/clearance do not move. The support is visible geometry with ordinary volume and mass, not an affordance marker or a gap hidden by increased tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant vector arithmetic and at most two rods; their existing additional-sphere admission is O(S) for S emitted body spheres.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the rig axis, existing authored radius and already planned beam centre; the common primitive plan owns admission and eventual emission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only at most two scalar primitive records enter the caller's plan; no rig, source geometry, completed model or external resource is retained.

# src/animals/QuadrupedEquipmentBearing.ts#QuadrupedEquipmentBearing.pack

## @evidence contracts/development/common.md#meaningful-documentation

States flank line contact with nonnegative-Y normal, positive axial overlap, authored rail radius, two end connections and unchanged free-frame placement; side contact is geometric connection without a gravity or friction claim.

## @evidence contracts/development/implementation.md#principled-implementation

Select the closest closed-upper-flank vertex of the engine's shared radial primitive profile whose tangent half-space contains the frame rail with its radius. The body and bearing have the same +Z axis placement and opposite vertices of that same even profile, so both analytic circles and displayed polygonal courses touch. The side vertex remains feasible because the admitted frame X distance is barrel+clearance+thickness/2 and thickness/2 is at least railRadius. Positive axial overlap and exterior connecting cylinders retain the original body and frame boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select one feasible common-profile normal from the body and rail, record its parallel tangent bearing and connect corresponding axial endpoints. The closed upper quadrant includes the side station, preserving narrow positive pads and zero clearance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the existing public primitive angular profile without changing its resolution, reading back a mesh, shifting inside the analytic collider, selecting a species/fixture angle or relaxing a contact tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

A bounded quarter-profile scan and three rods per side; existing additional-sphere checks remain O(S), without model regeneration, iterative fitting or a collision solver.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both sides use the same projection and authored dimensions; real primitive admission and emission stay with the common plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Three independent scalar rod records enter the call-local plan; no caller rig, completed geometry, cache or external handle is retained.
