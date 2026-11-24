# src/posture/HumanJacobian.ts#HumanJacobian

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each joint axis is the frame before the joint, turned by the factors composed before the angle's own, applied to the angle's basis axis, scaled by the rest frame's sign and the degree; the root's from its heading's order; a turn's linear velocity at the origin is `−ω × pivot`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to read and returns its motion array, keeping one owner for ordered variable formation and same-candidate preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are the clamped ones forward kinematics reads, so an angle set out of range moves the body as it is shown.

## @evidence contracts/development/implementation.md#efficient-algorithms

read performs one actual projection and at most two earlier factors per requested joint, then constant final work per variable, without FK. Initial legacy carried sets cost O(B squared) in a deep B-bone tree; candidate clamp preparation adds O(B), and numerical projection work remains. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The established weak body rig is unchanged; same-candidate joint preparation is shared only inside read, preserving every requested variable and its output order. Another candidate always enters another read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary per-read prefixes, clamps and the unused projected-joint map end after this wrapper returns. Motion moves sets borrow the existing weak body rig; only the caller-owned motion array escapes.

# src/posture/HumanJacobian.ts#HumanJacobian.read

## @evidence contracts/development/common.md#meaningful-documentation

States same-candidate input stability, ordered duplicate variables, clamped result provenance and the synchronous release boundary.

## @evidence contracts/development/implementation.md#principled-implementation

The same geometric Jacobian maps the clinical axis through its parent/rest frame and the preceding intrinsic-Euler factors. One actual rig projection and lazy quaternion-prefix chain per bone suffice for every requested axis of that unchanged candidate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

of delegates here; this read owns candidate-local preparation and ordered derivative formation. A lent canonical engine factory replaces only local clamp-metadata construction; rigOf and twist/velocity keep their existing responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Root heading and initial rig admission retain their original order. Only the actual same-skeleton canonical engine factory may be lent, with no solver override or projected answer. A bone is actually projected at its first requested angle, earlier factors remain lazy, and every variable forms its own motion; no perturbed pose, derivative result or numerical callback is memoized.

## @evidence contracts/development/implementation.md#efficient-algorithms

For D variables naming U joints, the first angle creates one O(B) canonical clamp preparation or borrows its operation's completed metadata; U actual projections replace D scans/projections. Each bone computes at most two factors and three prefix frames; D final formations remain. Place/heading-only reads allocate no angle clamp or prefix map. The unchanged first body rig has worst-case O(B squared) carried sets; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same-candidate clinical triples, canonical frames, resolved parents and rig rest transforms prove per-bone preparation equivalence. HumanArmJacobian lends setup.clamp and HumanBodyFit lends its fit-local canonical factory for the same unchanged skeleton/axes/domain operation, retaining every actual projection. Returned clamped joints also avoid projecting that candidate again for clamp-status checks; no candidate result crosses reads.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Read-local prefixes are O(U), plus O(B+U) when it owns clamp preparation, and end with this synchronous read. A lent factory belongs to the caller's unchanged operation and is not stored elsewhere. Motions and at most U clamped records escape; moves sets borrow the existing weak body rig, whose carried sets can total O(B squared). No new global cache, task or handle is retained.

# src/posture/HumanJacobian.ts#HumanJacobian.twist

## @evidence contracts/development/common.md#meaningful-documentation

States segment membership, world-origin input and per-coordinate angular/linear output at the segment origin.

## @evidence contracts/development/implementation.md#principled-implementation

For an affected segment, v_origin equals the world-origin linear velocity plus omega cross origin; an unaffected segment has zero angular and linear derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One membership gate and one spatial-twist shift serve all segment consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual supplied origin and affected set without numerical perturbation, tolerance or named-bone exceptions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One set membership and a fixed number of vector operations take constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the caller's completed variable motion rather than forming another Jacobian; many segment probes can share this shifted twist.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh outer record, borrowing the motion's angular vector or shared zero and owning a newly composed nonzero linear vector; it retains no input, map or handle.

# src/posture/HumanJacobian.ts#HumanJacobian.velocity

## @evidence contracts/development/common.md#meaningful-documentation

States attached-point world coordinates, per-variable metre derivative and unaffected-bone zero.

## @evidence contracts/development/implementation.md#principled-implementation

A spatial twist gives v_point equals v_world_origin plus omega cross world point, with the affected set deciding whether the coordinate carries that point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the IMotion representation with segment twist reading and performs only point evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No perturbed pose, contact proxy, tolerance or bone-specific branch replaces the supplied motion and point.

## @evidence contracts/development/implementation.md#efficient-algorithms

One membership lookup and fixed vector work take constant time and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's completed motion serves every point on its affected segments, with no repeated rig, clamp or axis preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a newly composed affected velocity or the existing shared zero; retains no point, motion, collection or resource handle.

# src/posture/HumanJacobian.ts#HumanJacobian.velocityY

## @evidence contracts/development/common.md#meaningful-documentation

States the scalar component, world frame, per-coordinate unit and unaffected-bone zero.

## @evidence contracts/development/implementation.md#principled-implementation

Expands exactly velocity's Y component as linear.y plus angular.z times point.x minus angular.x times point.z, with the subtraction grouped before the addition as in cross then add.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A component readout beside the existing full vector owner serves BodyFitRows.low; other callers retain velocity when they need XYZ.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves membership and actual Y arithmetic without clamping, tolerance, finite repair or a bone-specific shortcut; nonfinite vertical results propagate unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One membership lookup, two products, one subtraction and one addition replace full cross/add work and two vector allocations; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's same completed motion and point, materializing only the requested height derivative; no coordinate, point or numerical result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains no input, vector, map, closure or handle.
