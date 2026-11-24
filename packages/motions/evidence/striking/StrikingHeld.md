# src/striking/StrikingHeld.ts#StrikingHeld.follows

## @evidence contracts/development/common.md#meaningful-documentation

States the window, the blend and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

One row for every follow-up: the held tool's actions differ only in the instant they open from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The blade's and the firearm's actions read this one table instead of a copy each.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by `HumanSword`, `HumanSwordGuard`, `HumanSwordThrust`, `HumanSwordParry` and `HumanWeaponPresent`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the result's frame and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The displayed prop is taken into the entry hand's grip frame, the offset the performance keeps. The shared held-frame reader then derives the explicit two-point working line or the point's declared direction and its source-frame roll.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The bare hand first, then one change of frame for the point, the axis and the edge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop without the named point is refused; an edge that is missing or parallel to the axis is replaced by a direction square to the axis, stated in `IPoints`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One forward kinematics of the entry pose and a scan of the prop's affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.bare

## @evidence contracts/development/common.md#meaningful-documentation

States the socket, axes, frame and absence of a held prop.

## @evidence contracts/development/implementation.md#principled-implementation

The canonical hand runs along its signed X axis; the grip socket's backward forward vector supplies the edge, squared to that axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One socket read and one tool record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the body's grip frame and canonical skeleton convention, with no fabricated entry state.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by of and the supporting-hand goal.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.read

## @evidence contracts/development/common.md#meaningful-documentation

States the input's frame, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

StrikingHeldFrame reads the same rigid offset for a candidate and an actual grip; an explicit origin defines the working line independently of a surface normal, with the point frame's roll reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One change of frame for the point, the axis and the edge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop without the named point is refused; an edge that is missing or parallel to the axis is replaced by a direction square to the axis, stated in `IPoints`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A scan of the prop's few affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one reading of a tool from a held frame, for the held prop and a candidate grip alike.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.hand

## @evidence contracts/development/common.md#meaningful-documentation

States each input's frame and unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The rotation that carries the tool's axis and edge in the hand onto the asked world pair (`HumanHand.align`), then the grip socket placed back from the point by the rotated offset: the rigid relation of an effector offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One alignment and one subtraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An edge parallel to the axis is squared against the world's up or forward instead of throwing, since a thrust states no edge.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.prepareHand

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed tool/orientation premise, metre offset, changing world point and fresh output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The existing HumanHand.align relation fixes rotation from the hand-local tool pair to the normalized world pair. Its rotated kept-point offset is independent of the world placement and is subtracted in the same original expression.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Alignment and fixed offset are prepared once; the returned reader performs one subtraction and copies the fixed quaternion into a fresh frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves normalization, parallel-edge fallback, kept-point geometry and operation order; no pose, fit, candidate acceptance or time answer is prepared.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant setup replaces repeated alignment/offset rotation for K placements under the same orientation; each placement uses constant arithmetic and fresh output allocation. Physical arm fitting remains payable and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicitly fixed tool/back/axis/edge scalar geometry proves alignment and offset equivalence. A changed held grip or orientation requires a new producer; changing world points are always evaluated anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader owns one fixed quaternion and vector for its enclosing search or fixed-axis operation; each output is independent, no inputs/candidate history are retained, and release of the operation drops the reader.

# src/striking/StrikingHeld.ts#StrikingHeld.point

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The grip socket plus the rotated offset, the inverse of `hand`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rigid transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.strayed

## @evidence contracts/development/common.md#meaningful-documentation

States the two points read and the case of a kept working point.

## @evidence contracts/development/implementation.md#principled-implementation

Two points of a rigid line fix where it lies and where it points: the displacement a viewer would see.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two readings of `point`, the greater.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both points are read, in metres, never an angle mixed in.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one measure of a held tool's pose: a law's (`StrikingRoll.miss`) and a grasp's use (`HumanGraspUse.presented`) read it alike.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.goal

## @evidence contracts/development/common.md#meaningful-documentation

States what the goal holds and which point stays when the turn gives way.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist follows rigidly from the grip socket and hand rotation; the kept contact lets the resolver re-aim the wrist. The same two offsets strayed judges become point limits, so a trajectory preserves the action's physical miss bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One wrist placement and one offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A held-prop goal keeps the original planting and both task limits so transitions retain the tool contact; a bare-hand goal retains its original absence of prop planting and limits.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.prepareGoal

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/tool/back prerequisites, changing world frame/bend and exact output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

StrikingHeldGoal prepares the original canonical grip and rigid contact/limit offsets once; every actual frame still determines its wrist by the same inverse rigid placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared goal owner serves this fixed-operation producer and the original one-shot goal, with one physical policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves strain, original planted/prop distinction, kept contact, both ordered MISS task limits and all later fits; no candidate, pose or time answer is reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant setup removes repeated fixed grip/tool arithmetic across K candidates, retaining actual per-frame wrist placement, fresh goal/task records and every physical solve. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit unchanged canonical body/tool geometry and back prove only local-offset equivalence; changed geometry requires another producer, while each frame and bend still evaluate anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The enclosing fixed-tool action or synchronous search owns fixed grip/contact/two-limit metadata until action release or search completion/failure. Fresh mutable outputs retain no factory, body or query history; borrowed rotation/bend retain their existing input semantics.

# src/striking/StrikingHeld.ts#StrikingHeld.grips

## @evidence contracts/development/common.md#meaningful-documentation

States what the window does and when there is none.

## @evidence contracts/development/implementation.md#principled-implementation

A held prop stays held across actions only while each action that drives its hand declares a grip on it, the performance's rule; the window spans the whole action.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingHeld.ts#StrikingHeld.holds

## @evidence contracts/development/common.md#meaningful-documentation

States what is left held, with which fingers, and when there is none.

## @evidence contracts/development/implementation.md#principled-implementation

The action takes the hand over by its grip window, which ends the earlier hold, so it leaves a hold of its own from its start; the fingers are the displayed ones, which the grip closed until contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fingers are read from the entry pose, never re-closed, so the hand does not re-seat what it holds.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One scan of the entry pose's joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
