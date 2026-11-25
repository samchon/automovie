# src/posture/HumanLegChain.ts#HumanLegChain.pose

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the null.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's branches and posing at the hip's frame under the pelvis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The chain, the branch, the pose, then the joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A branch the target no longer offers falls to the last one there is.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `hingedArmSwivel` and the leg's rest chain from the body's prepared chain constants (`IAutoMovieMotionHumanBody.chains`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh leg.

# src/posture/HumanLegChain.ts#HumanLegChain.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Defines unchanged source scope, model-metre targets, held-branch fallback, independent target semantics and caller release.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's exact hinge-span/source-frame preparation serves a fixed leg root; each target still solves the actual hinge roots and branch aim before the same two-stage FK used by pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

sourceOf owns fixed leg geometry, hingedArmSwivel owns roots/aim/swivel and placed owns the shared actual leg frames; this reader adds no IK or scoring policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No target is replaced by a reached point, no fit/seed is remembered, and original branch order/fallback and geometric-shell behavior remain.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed root composition and lazy constant hinge sinusoid/inverse serve all targets. Each query still performs constant root/branch/aim/FK work; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's fixed body/pelvis/hip prove source equivalence, so only source geometry is shared across the bow search's targets. Actual target roots, selected branch/swivel and returned points are computed independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One returned closure borrows body-derived source and hip plus one bounded engine preparation until caller release; target readers and generated frames end with each query and no target history or handles are retained.

# src/posture/HumanLegChain.ts#HumanLegChain.read

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The thigh's and the shank's rotations taken back to the hinge angle and the swivel `pose` reads them by.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The chain at the shown ankle, the bone-local rotations, the nearest branch, the swivel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The branch is the one whose hinge angle is nearest the shown one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `hingedArmSwivel.read`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanLegChain.ts#HumanLegChain.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The posture's fit, run on the hips alone: a leg's fit reads nothing above its hip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pose of the hips, the fit and its four requested bone frames feed the existing swivel reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fit is the posture's own, ROM bend search included.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds ordered authored-joint admission plus only the requested hips/thigh/shank/foot ancestor FK to the existing fit cost; unrelated body subtrees are not transformed for the swivel read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses applyHumanLimbFit (the direct solve) and read. One invocation-owned lazy resolution reader shares only exact unchanged FK prerequisites between the solve and the actual fitted-pose reading; all poses and swivel results remain actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns its reader only through synchronous return or throw; requested maps and snapshots do not enter the returned swivel/seed.

# src/posture/HumanLegChain.ts#HumanLegChain.seeded

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the continuation and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The posture's fit run on the hips alone, continued from a nearby seed where one is given, its warm start (`IAutoMovieSwivelNear`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pose of the hips, its directly solved fit and a requested four-frame FK feed read; one local lazy reader spans only that synchronous operation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fit is the posture's own, ROM bend search included; a continuation only replaces its sweep with a refinement about the seed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds ordered authored-joint admission and only the hips/thigh/shank/foot ancestor FK to the existing fit cost; unrelated body subtrees are not transformed for the swivel read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the direct solve and read; its one local lazy resolution reader shares exact unchanged prerequisites between the solve and its actual fitted-pose read, never targets, candidate answers or swivel values.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The invocation releases its FK getter/snapshots and temporary subset map on return or throw; only the actual swivel and seed escape.

# src/posture/HumanLegChain.ts#HumanLegChain.prepareSeeded

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed model-frame pelvis/hip, changing target/bend/rotation/near and caller-owned piece lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The existing hips-only root is constant for fixed pelvis/hip; each query still executes the directly solved limb fit and reads its actual shown branch/swivel.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareHumanLegSeededFit owns fixed construction/reader, HumanLimbFit owns every actual solve and read owns swivel extraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No target, bend, rotation or near seed is substituted or cached; the mirror and root-frame conventions remain with the solve's owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed root and bounded exact FK workspace serve repeated coordinate probes. Its actual local reader also lends matching source geometry/rig preparation across solves; every query retains its actual solve and current four-frame FK. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed source scalars and exact FK prerequisites are shared; the source owner additionally snapshots and checks the complete normalized/mirrored source before reusing only preparation. Changed goals/near remain actual query inputs and changed body/pelvis/hip require new preparation; no fitted result is lent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One piece owns fixed source/root and bounded reader state until release; temporary fitted maps end per query and no fitted answer, target history or handle is retained here.
