# src/striking/StrikingBody.ts#StrikingBody.trunk

## @evidence contracts/development/common.md#meaningful-documentation

States dropped limb goals, the result's role as limb-solve input, unchanged-skeleton topology and the optional synchronous borrowed FK workspace.

## @evidence contracts/development/implementation.md#principled-implementation

The posture resolved with no limb goals, then complete forward kinematics with the canonical axes, rest frames and the body's parent-first topology.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture resolution and the canonical poseBones adapter keep mapping, topology and direct Map insertion with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual posture clamp, digit solve and needed FK ancestor remains; requested output names omit only unused transforms, and the optional reader shares exact scalar prerequisites without a posed-result cache or changed goal policy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Posture assembly/clamping still scans rig/joints and retains actual digit searches. Requested final FK admits all joints but computes only demanded ancestry and allocates only requested transforms; omitted demand returns the full map. A parent reader shares only equal scalar prerequisites, and a genuine same-operation projector reuses only fixed ROM metadata while every joint is projected; no measured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses body topology and, only when supplied, one parent-owned exact FK workspace across actual posture and displayed-frame reads; every posture and authored record still executes normally with fresh output transforms.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns a fresh map/transforms. An optional local getter borrows at most one parent reader only until return or throw; no reader, supplier or posed result enters body memory, a returned plan or persistent state.

# src/striking/StrikingBody.ts#StrikingBody.prepareTrunk

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed canonical body/name demand, snapshot behavior, changing posture/source and independent output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The same trunkPose owner clears only limb goals and executes original seeded assembly/clamping/digit semantics. poseBones.prepare binds the body's genuine requested-name producer once; each current admitted pose still supplies its actual FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One demand preparation returns one reader; the original one-shot trunk and this repeated-demand path share the exact posture owner, and canonical poseBones retains name/topology/FK ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every current authored joint, root rotation, digit demand and clamp remains. No fabricated indices, caller resolved flag, pose answer, target, seed or query history enters the factory; omitting demand preserves complete FK output.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed K-name sorting/reachable-demand preparation runs once for N queries. Each query retains full authored admission and actual digit work, followed by its original requested FK ancestry and fresh maps/frames; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An explicit unchanged body and snapshotted real bone set establish demand equivalence. Every changing posture, borrowed FK source and genuine ROM projection loan is used only by its current synchronous invocation. Canonical owners check exact dependencies/provenance and every authored joint is still projected.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one bounded body/demand producer until its action or search ends; it retains neither source set, pose, reader nor answers. Each invocation creates or borrows one local exact workspace released on return or throw, and only its fresh bone map escapes.

# src/striking/StrikingBody.ts#StrikingBody.region

## @evidence contracts/development/common.md#meaningful-documentation

States the result's frame and what the offset selects.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's bone-local region frame or exact authored tangent-offset ray is placed on its actual world bone; pointNormal retains the original point and normal math while omitting unconsumed forward.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant point/normal work at the region centre, or the original rest-pose/skin-ray cost at an offset. The canonical pointNormal producer omits unused forward rotation and an extra stripping wrapper; both actual consumed vectors stay fresh and speedup is unmeasured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; a strike reads its offset point a few times per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBody.ts#StrikingBody.frame

## @evidence contracts/development/common.md#meaningful-documentation

States bone-local units/frame, canonical-body stability and the central-versus-offset cases.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the prepared anatomical centre frame, or the engine's existing offset ray on the same skeleton/profile for the exact requested tangent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One centre/offset branch owns the choice shared by region placement and fixed-target consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the same region, tangent, skin ray and out-of-domain refusal; no surface tolerance or target point is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Centre selection is constant work; a nonzero tangent pays the engine's original rest-pose/skin-ray cost once when a fixed-target consumer prepares it. No speedup is measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The immutable canonical body contract fixes skeleton/profile and a caller's explicit region/tangent fixes this bone-local frame; consumers may retain that metadata while still placing the actual posed bone at every observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This function stores no cache; callers borrow the central frame or own the offset result for their geometry's lifetime, without retaining a world pose, observation or FK reader.

# src/striking/StrikingBody.ts#StrikingBody.radius

## @evidence contracts/development/common.md#meaningful-documentation

States the definition, its owner and the producer defect thrown on.

## @evidence contracts/development/implementation.md#principled-implementation

The body's own region extent: half the way to the nearest region facing the same way, within its segment's half breadth, read from the body's rest pose when the body is built.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the body's surface table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No radius is typed or recomputed here; a missing extent throws rather than falling back.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The extent is the one the body owns, the same the touch law's landing disc reads; no store beside the body keeps a second copy.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBody.ts#StrikingBody.socket

## @evidence contracts/development/common.md#meaningful-documentation

States the rotation's meaning and the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The bone-local socket point rotated by the world rotation, valid because the canonical rig rests unrotated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBody.ts#StrikingBody.fist

## @evidence contracts/development/common.md#meaningful-documentation

States the rest axes mapped and the non-parallel premise.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's two-axis frame alignment from the rest finger axis and palm normal onto the requested ones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rest-axis read and one alignment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBody.ts#StrikingBody.foot

## @evidence contracts/development/common.md#meaningful-documentation

States the rest axes mapped and the non-parallel premise.

## @evidence contracts/development/implementation.md#principled-implementation

The same two-axis frame alignment from the rest toe axis and instep normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One alignment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBody.ts#StrikingBody.curl

## @evidence contracts/development/common.md#meaningful-documentation

States each joint's angle, its source range and why angles are used.

## @evidence contracts/development/implementation.md#principled-implementation

Fixed clinical flexions inside the AAOS normal ranges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the four fingers and the thumb's two joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBody.ts#StrikingBody.colliders

## @evidence contracts/development/common.md#meaningful-documentation

States which shapes and who places them.

## @evidence contracts/development/implementation.md#principled-implementation

Placement is `HumanColliders.placed`; this function only lists each placed segment's shapes with the segment's pose and bone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over placed segments and shapes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in shapes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
