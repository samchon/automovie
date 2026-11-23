# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.anchor

## @evidence contracts/development/common.md#meaningful-documentation

States the rule.

## @evidence contracts/development/implementation.md#principled-implementation

A region rides its own bone, so whatever moves that bone moves what rests on it; a reader of a limb's bone resolves the limb (`bones`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback bone: a limb anchor is read where the limb's fit puts it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.bones

## @evidence contracts/development/common.md#meaningful-documentation

States which resolution is taken when, the borrowed reader and the requested set.

## @evidence contracts/development/implementation.md#principled-implementation

A trunk bone stands from the root and the joints alone; a limb's stands where its fit puts it, so only then are the limbs fitted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One membership test, one resolution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A limb anchor is never read off the trunk-only resolution, whose limb bones stand at clinical zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

A trunk anchor costs one trunk resolution; a limb anchor one whole-posture fit; with a requested set, forward kinematics composes only those bones and their ancestors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A limb anchor's fit and its read-back share one forward-kinematics reader, and a caller's reader is shared with them, so one posture evaluation composes each bone once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader is held only during the call; the returned map holds bone records alone.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.posture

## @evidence contracts/development/common.md#meaningful-documentation

States what carries the borne body and what the hands do.

## @evidence contracts/development/implementation.md#principled-implementation

The borne root frame is the bearer's anchor bone's displayed frame composed with the key frame, a parent constraint at its offset as a held object keeps its offset in the hand; the resting region therefore stays on its region however the bearer's trunk turns. The frame becomes the root and a whole-body rotation about it (#3423), and each clinging hand's world goal is taken back through that rotation so the turned goal lands on the bearer's region.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The anchor's frame, the composed frame, the posture, the hands.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The held regions are the bearer's hands' to reach (`holds`); the borne body is not dragged onto the hands.

## @evidence contracts/development/implementation.md#efficient-algorithms

The reusable reader prepares the key and hand geometry once. Each instant only places the current anchor and occupied clinging palms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The key posture is `key`'s. The engine places the held region and `HumanHandTarget` places the actual clinging palm.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function of the instant's bones.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.preparePosture

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed shape and the current dependencies.

## @evidence contracts/development/implementation.md#principled-implementation

The posed borne body follows the exact anchor, and the palm goal preserves the bearer contact point and its outward normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the key and the occupied clinging palm readers, then places them by the current anchor and regions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled bearer pose or arm fit is retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed hand preparation per occupied grip; free hands perform no setup or per-frame fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both palms read the same body transform and the already resolved exact bearer bones.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its fixed key, clinging regions and palm readers until it is released.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.holds

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the order and the null.

## @evidence contracts/development/implementation.md#principled-implementation

The hold is read off the same key relation the borne body rides by, in the same anchor frame, so the bearer reaches where the borne body lies without reading it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the shared carried-hold geometry reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bearer never reads the borne body's displayed bones, which read the bearer's, so the two cannot chase each other.

## @evidence contracts/development/implementation.md#efficient-algorithms

One key read resolves the collider profile's bone demand and the occupied hold regions' bones with their ancestors. Both grips share the collider placement and there is no key read when both hands are free.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual contact point already belongs to the coupling when it supplies `at`. Each grip shares the key heading and the inverse of a further bearer's anchor.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.stance

## @evidence contracts/development/common.md#meaningful-documentation

States the two cases, the inputs and their units.

## @evidence contracts/development/implementation.md#principled-implementation

Applies the bend law's continuous lowering to the same planted standing posture at every parameter, rather than changing the kinematic representation at zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One standing posture and one lowering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No zero-only trunk shortcut with different feet, knee extension or trunk alignment.

## @evidence contracts/development/implementation.md#efficient-algorithms

One lowering, constant work beyond its leg solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `bendLower.lower` and `stand.posture` own both operations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.stood

## @evidence contracts/development/common.md#meaningful-documentation

States which resolution is taken when.

## @evidence contracts/development/implementation.md#principled-implementation

One kinematic map for the whole parameter domain, so finite differences describe a stance's derivative rather than a branch's finite jump.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture resolution and one forward kinematics pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A standing bearer is never substituted with a clinical-zero skeleton.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolved pose per stance, shared by the fitter's stance cache.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `stance`, `resolveHumanPosture` and `poseBones`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.key

## @evidence contracts/development/common.md#meaningful-documentation

States what the posture takes from the row.

## @evidence contracts/development/implementation.md#principled-implementation

The carry's table posture, both legs alike, the arms left to the clinging goals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are the row's provisional ones, stated there.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanCarriedCouplingPose.ts#HumanCarriedCouplingPose.region

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the frame and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The region's bone-local point carried by its bone's world frame (`resolveAutoMovieHumanoidSurfaces.point`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one placement; the carry laws' one region reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bone is refused, never read as the origin.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The engine's surface placement owns the point.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.
