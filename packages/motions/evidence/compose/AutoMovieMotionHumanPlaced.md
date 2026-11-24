# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.arm

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The surface laid against the place's reversed facing by `AutoMovieMotionHumanTarget.hand`, carried in joint space (Soechting and Lacquaniti 1981).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One carried arm and one hand shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The weight is clamped by the carry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed hand surface/options prepare once per arm; each actual goal shares one wrist placement with its default bend and final assembly, while every original bend/carry trajectory/full-posture solve remains. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

HumanHandTarget owns fixed geometry/dynamic orientation, ArmTarget owns contact assembly and original hand/carry primitives keep composition. Current-person FK/ROM inputs flow synchronously to each actual place callback rather than preparing independent observation contexts there.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Primitives keep props and constant surface/options until release. Optional current-call FK/ROM inputs and each lazy wrist remain synchronous, without retained loans, query pose/time history or solver readers in the plan.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.grid

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result's frame and what each axis is read from.

## @evidence contracts/development/implementation.md#principled-implementation

A posture's root is the origin its pitch and roll turn about, so a law that pitches the trunk over its hips moves the root far behind the feet; the pelvis is where the body stands, so the frame's origin is the floor point under the displayed hips less the standing hips' offset, which is the root itself for an upright posture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One anchor and two calls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A nudge past the target's bound throws there; the heights do not follow a crouch, and a law that means a place on the displayed trunk reads `joint`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `AutoMovieMotionHumanTargetGrid.place` and `fallback`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.joint

## @evidence contracts/development/common.md#meaningful-documentation

States valid current trunk/girdle joint inputs and world-metre output; optional same-person FK is borrowed only for the existing raw authored-joint observation.

## @evidence contracts/development/implementation.md#principled-implementation

A place on the performer's own trunk (ahead of the chest, under the shoulders, behind the head) moves with the trunk's pitch, roll and drop, so it is read from the trunk's forward kinematics on the posture written so far.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup of one resolve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A limb bone below the shoulder joint is not placed by a posture and is not offered by the parameter's documentation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics pass per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates actual requested output to HumanTrunk.resolve, optionally borrowing this same-person FK source without changing raw admission or adding ROM projection.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.carried

## @evidence contracts/development/common.md#meaningful-documentation

States what is carried, between which postures, and a use.

## @evidence contracts/development/implementation.md#principled-implementation

The arms hang from the chest, so a place of theirs keeps its coordinates in the chest's frame while the spine bends; the point is taken into the standing chest's frame and out of the bent one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two resolves and one change of frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The chest's frame is read from the trunk's forward kinematics, so every joint below it counts, not one stated angle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two forward-kinematics passes per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every call retains its original source and current raw trunk reads; an optional current-person loan shares only current exact FK metadata and never prepares the borrowed standing graph across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Source/current point-transform scratch and the optional FK loan end with this synchronous call. Only the fresh world point escapes, without a retained posture, reader, query history or handle.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.carryFrom

## @evidence contracts/development/common.md#meaningful-documentation

States immutable source frame, varying current posture, world-metre points and reader lifetime; optional same-person FK is borrowed only at the current chest read and raw authored-trunk policy remains unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original current-chest times inverse-source-chest rigid transform; the source inverse and each current relative rotation are independent of the points they carry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Source preparation, one current chest read and a pure point transform expose the two distinct invariant scopes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every current posture still performs canonical authored-joint FK with its actual root; no time samples, body size assumptions or fitted motion results are reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demanded source chest FK per plan and one demanded current chest FK per place evaluation replace two FK calls per carried point; P points then use O(P) rigid transforms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same unchanged body/source posture share only the source chest; one current call shares its actual chest among its points. An optional same-person FK loan shares original raw chest dependencies while changed current posture still receives its actual read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns one source chest frame and inverse; each evaluation owns one current point-transform closure until its points are placed, with no FK reader or current-time history stored in the plan.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.shoulders

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Both arms hang from and reach from their shoulder joints, so a place for two hands together (a club's grip, a ball held up, the floor under a support) is read from their midpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve and one mean.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read on the displayed trunk, never rebuilt from the measure's heights.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics pass per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates both actual shoulder outputs to HumanTrunk.resolve, borrowing optional same-person FK without changing authored-joint admission or adding ROM projection.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.wrist

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the defaults and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The arm reaches to the wrist, not to the surface, so a law that derives a trunk height or a pitch from a hand on the floor measures the reach to the wrist the laid hand needs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The wrist is the hand owner's, never half a hand's length typed in a law.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanHand.reach`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.root

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their frames and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The root's turn carries every resting point rigidly, so the root that holds one of them still is the world point less the turned resting point: a trunk that pitches about its hips, or swings about its shoulders over planted hands, is written by its pivot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turn is the posture owner's composition of the three angles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `humanPostureHeading`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.girdle

## @evidence contracts/development/common.md#meaningful-documentation

States the result and its consumer.

## @evidence contracts/development/implementation.md#principled-implementation

The mean of the two resting joints, the point both arms reach from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mean.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read from the body's rest, never from the measure's heights.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanPlaced.ts#AutoMovieMotionHumanPlaced.pitch

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the sign, the unit and the result past the trunk's length.

## @evidence contracts/development/implementation.md#principled-implementation

The resting vector from the hips to the shoulders' midpoint keeps its length under the root's pitch, so its height is that length times the cosine of the pitch plus the vector's own resting lean, solved for the pitch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One length, one resting lean and one arccosine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cosine is bounded to [-1, 1] because a trunk cannot stand its shoulders further from its hips than its own length; the caller's reach verdict reports what that leaves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `girdle`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
