# src/lexicon/HumanMountRider.ts#HumanMountRider.ankled

## @evidence contracts/development/common.md#meaningful-documentation

States what turns, about what, how far and when nothing changes.

## @evidence contracts/development/implementation.md#principled-implementation

The ball stays where the goal puts it and the ankle moves on its circle about the ball's lateral axis; the least turn that reaches is found by bisection, the distance being monotonic in the turn up to `ANKLING`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The rider's bounds handed to the search, which `ankleRidePedalFoot` owns so this file stays within its size.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pedal beyond even `ANKLING` leaves the foot short of it, which the contact audit reports; a refusal with the saddle height that fits is owed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four distance trials (none, the two signs and `ANKLING`) and twenty-four bisections, which narrow the `ANKLING` span to about two millionths of a degree; each trial is one rotation about the ball's prepared axis.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ball, the axis and the contact are read once per call and shared by every trial; the returned goal is placed by the same function the trials measure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; it returns the goal given or a new one.

# src/lexicon/HumanMountRider.ts#HumanMountRider.hold

## @evidence contracts/development/common.md#meaningful-documentation

States where the wrist goes, how the hand turns, how the fingers close and what the first pass leaves out.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's frame is built from the grip's own normal and axis, so it turns with the part at every instant; the way there is a straight line and the shortest turn from the hand the posture shows, and the elbow's pole blends from the elbow the posture shows, so the hand leaves the place it held and the arm the pose it held.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The target, the turn, the blend from the joints' hand, the fingers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip out of the arm's reach is not checked here: the limb fit leaves the hand short of it, which the contact audit reports. The closure is the caller's, curled on the real colliders.

## @evidence contracts/development/implementation.md#efficient-algorithms

Holding fully needs no resolution; a partial hold observes the free wrist and its ancestors. A native read omits unrelated simple leg fits through the canonical goal selector; an incoming custom reader keeps the full fit. The fingers blend linearly over the closed joints given.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's forward-kinematics reader and range-of-motion projector serve the resolution; the relaxed hand is `HumanHand.shape`'s table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader and the projector are used only during the call; the returned goal and joints hold numbers alone.

# src/lexicon/HumanMountRider.ts#HumanMountRider.taking

## @evidence contracts/development/common.md#meaningful-documentation

States the shared pre-grip pose and the query lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Both approaching hands start from the seated posture as shown, before either arm is guided by a grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read both origins together at first demand and use the ordinary grip interpolator for each hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The current seat, legs and other direct channels still enter forward resolution. Each actual grip supplies its own current position and turn.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one seated fit for both approaching wrists, and none after acquisition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Sharing is local to one authored posture and never uses a free wrist from another second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller holds the acquiring reader only while building its current two goals.

# src/lexicon/HumanMountRider.ts#HumanMountRider.closed

## @evidence contracts/development/common.md#meaningful-documentation

States what is closed on what, when it is solved and what the first pass leaves out.

## @evidence contracts/development/implementation.md#principled-implementation

The grasp laws' own closure on the prop's own colliders, placed by the prop's frame as `HumanGrasp` places them, with the hand's frame taken from `hold`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hand's frame, the placed colliders, one call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No named hand shape stands in for the closure.

## @evidence contracts/development/implementation.md#efficient-algorithms

One ordered O(S) distance scan selects the nearest of S support shapes, then one closure solve per hand per plan; each shape's distance is evaluated once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Solved once and blended to at every instant, since the hand and the grip do not move against each other.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountRider.ts#HumanMountRider.leant

## @evidenceExclude contracts/development/common.md#meaningful-documentation

One joint's flexion added.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

One sum.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountRider.ts#HumanMountRider.lean

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved and both ends of the result.

## @evidence contracts/development/implementation.md#principled-implementation `reach` for the hands that hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

As `reach`.

## @evidence contracts/development/implementation.md#efficient-algorithms

As `reach`, once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
