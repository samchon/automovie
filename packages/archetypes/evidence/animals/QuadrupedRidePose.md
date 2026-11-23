# src/animals/QuadrupedRidePose.ts#QuadrupedRidePose.IGoal

## @evidence contracts/development/common.md#meaningful-documentation

Defines model-space forward metres, sole lift and relative fold degrees; terminal geometry supplies its own endpoint offset.

## @evidence contracts/development/design.md#principled-representation

The goal contains authored position/clearance and joint fold, without allowing a per-limb root shift or a changed segment length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These three values are already computed by the ride's stance/swing law and consumed only by pose emission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A terminal centre is not mislabeled as its sole, and no implementation tolerance or fitted attachment is exposed as an authoring knob.

# src/animals/QuadrupedRidePose.ts#QuadrupedRidePose.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States independent four-goal samples, degree head nod and soft vertical preference, returning root-included model geometry.

## @evidence contracts/development/design.md#principled-representation

A function of complete current goals emits a complete model through one fixed skeleton; no mutable previous-frame state is required.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the sample operation is exposed to rideQuadruped; prepared body/foot/FK data remain private.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The operation cannot request separate limb roots or bypass exact shape/attachment admission.

# src/animals/QuadrupedRidePose.ts#QuadrupedRidePose.IPrepared.sample

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are current model-space goals, nod degrees and the gait's soft root preference; returned model already includes the chosen root and preserves source contact identities.

## @evidence contracts/development/implementation.md#principled-implementation

Preview current axial frames, intersect four-limb reach with exact body-floor support, select one root and solve every terminal pose before generic FK must reproduce all five joints per limb.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Current head carriage, four endpoint constraints, shared root, four exact solves and one prepared FK emission form one stateless sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither goals nor attachments move independently; impossible intersections refuse. Terminal orientation and primitive support prevent a planted endpoint from concealing surface penetration.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses two O(B) FK evaluations, exact support over P body parts, four constant-size intersections/closed-form solves and one O(P+A+V) independent model emission; no physical simulation or iterative IK is introduced.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses prepared source chains, oriented terminal solvers, scalar clearances, carrier maps and the rig reader for every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Current targets, ranges and solved points are call-local; the prepared owner retains only its bounded source data and no completed pose history or external resource.

# src/animals/QuadrupedRidePose.ts#QuadrupedRidePose.IPrepared.frame

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are the same goals, nod and root preference as `sample` and a contact id; the frame is in model space, undefined for a contact a limb, a shoulder blade or a held line places.

## @evidence contracts/development/implementation.md#principled-implementation

The same settled root range, chosen root and pelvis turn as `sample`, the body's frames lowered from them, and the contact moved by its carrier bone's motion from neutral exactly as the emission moves it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One settle, one root choice, one body FK and one contact move.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A contact whose chain needs a limb solve, a blade turn or a held line's axis is left to `sample`; impossible goals refuse as `sample` refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Skips the four limb solves, the limb FK and the whole model's emission: one O(B) body FK and one contact move beyond the shared settle.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `sample`'s settle stage, the prepared rig reader and the carrier deltas the emission uses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The settled targets and frames are call-local; the prepared table of body-carried contacts is fixed at preparation.

# src/animals/QuadrupedRidePose.ts#QuadrupedRidePose.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States source identity, one-time preparation, fixed terminal orientation, exact cylinder/capsule support and root-included independent output.

## @evidence contracts/development/implementation.md#principled-implementation

Preserve each terminal axis and derive its exact lowest-surface endpoint offset along the support normal before the oriented four-link solve. The same source geometry supplies neutral parent frames and shared rigid FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare complete carriage, pose state and four terminal solvers, then close over only that immutable source context.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Source geometry is never reconstructed from a species table, terminal radius is not ignored and the gait's bob is explicitly a soft whole-body preference rather than a hidden hard-path clamp.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation indexes P parts, reads twenty limb points and prepares the B-bone rig once; each sample has linear model work and four fixed-size closed-form solves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing carriage, joint admission, exact limb, primitive support, common root intersection and generic pose owners supply their respective operations without duplicated solver mathematics.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains bounded independent source/FK metadata, four solvers and scalar clearances; no clock, renderer, process, global cache or prior sample survives.
