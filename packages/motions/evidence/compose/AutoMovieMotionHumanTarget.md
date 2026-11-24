# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.fallback

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and that the result is not solid.

## @evidence contracts/development/implementation.md#principled-implementation

The shares times the body's stature, arm and half shoulder width give a point of the performer's floor frame, whose origin is on the floor under the root; it faces back along the heading or up.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One floor-frame transform and one facing choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The floor is the world's `y = 0`, the plane every foot placement stands on, and not the root's own height, which a crouch lowers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanFrame.point`, the owner of the floor-frame transform.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.resolve

## @evidence contracts/development/common.md#meaningful-documentation

States each input, which of them a targetless action uses and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each kind is read by its owner (the context's aim, the trunk's forward kinematics, the default) and marked solid when a real surface is there: a person, a prop, the performer's own body, a point given with its normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per case of the target union.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A `none` that states a line or a range keeps the virtual opponent it asks for instead of the default; a limb's self region throws instead of reading an unsolved bone.

## @evidence contracts/development/implementation.md#efficient-algorithms

One aim or one forward-kinematics pass per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to aim, HumanTrunk.region and fallback. A self-region may synchronously borrow its parent's same-body FK metadata; the actual raw posture and region are still read normally.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.away

## @evidence contracts/development/common.md#meaningful-documentation

States the direction's meaning, the inputs' frames and units and the fallback.

## @evidence contracts/development/implementation.md#principled-implementation

A standing body is displaced over the floor, so the push is the horizontal part of the line from the place to the body, normalised.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One difference and one conditional.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A source directly above or below has no horizontal direction, so the body goes backward of its own heading, the way a person recoils from a blow with no side; the threshold of a micrometre only guards the division.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `flinch`, `stagger` and `knockdown` read their direction here, on `Vector3` and `HumanFrame.point`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.hand

## @evidence contracts/development/common.md#meaningful-documentation

States how the surface meets the place and what the posture and the options decide.

## @evidence contracts/development/implementation.md#principled-implementation

A surface touches a place when their normals oppose, so the hand's rotation aligns the surface's normal with the place's reversed; the remaining turn about the normal takes the asked forward, or the heading, or up where the heading runs along the normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forward choice, one alignment and one bend: the solved elbow place when the options name neither a bend nor an outward share, the preset otherwise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The default forward is never parallel to the normal: the heading is horizontal, so when it runs along the normal the vertical cannot. A goal the solver refuses takes the `hang` preset, the default before the solver, and the resolver's audits report the reach.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanHand.offset`, `HumanHand.align` and `HumanHand.place` for the rotation and the wrist, and `AutoMovieMotionHumanBend.solve` and `arm` for the hint.

## @evidence contracts/development/implementation.md#efficient-algorithms

The solver's bounded sweep runs only for a goal without a stated bend; a stated bend is one lookup.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.prepareHand

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed body/side/normal/options and varying posture/world-point targets.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates unchanged surface geometry and explicit-forward alignment preparation to the same owner as hand, retaining actual current Bend solving.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade exposes HumanHandTarget.prepare for crawl's repeated flat-palm targets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No target point, solved elbow or previous fit is cached; existing defaults, reserve, fallback and ranges remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed explicit-forward alignment/local wrist offset prepare once; every varying default bend retains its bounded search and no measured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit unchanged body/surface/normal/options lifetime proves geometric reuse; current heading is still read when forward is absent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan-owned reader retains constant geometry snapshots and body metadata until release, with fresh output rotations and no query/result history.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.foot

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the foot's attitude and the default pivot.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid relation of a sole point to the ankle under the foot's rotation, the one `HumanFoot.pivot` owns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The place's normal is not read: a foot set down is flat on the floor, and a foot that strikes is turned by its striking law.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanFoot.pivot`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.feasible

## @evidence contracts/development/common.md#meaningful-documentation

States the paper and its passage, that feasibility is the whole test, the order and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Miller and Allen 2004, "GraspIt! A versatile simulator for robotic grasping", IEEE Robotics and Automation Magazine 11(4):110-122, "Future Directions" (p. 122): each candidate grasp is tested and evaluated only if feasible, no conflict with the arm kinematics and the hand or arm not blocked. The grasp quality (the ε1 of "Quality Measures") is not read, so the feasible candidates tie and the law's order decides.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the stance choice's candidate loop (`AutoMovieMotionHumanTouchStance.choose`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An infeasible candidate is passed over only on its reach refusal; an exhausted set refuses with every candidate's reason.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one test per candidate, none after the first feasible.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the stance choice's loop and refusal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past its return.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.IFeasible

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and order.

## @evidence contracts/development/design.md#principled-representation

The paper's candidate grasps and their feasibility test, as a law declares them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members: the candidates and the test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No quality score is carried, since none is read.

# src/compose/AutoMovieMotionHumanTarget.ts#AutoMovieMotionHumanTarget.IFeasible.test

## @evidence contracts/development/common.md#meaningful-documentation

States its result and the refusal that marks a candidate infeasible.

## @evidence contracts/development/implementation.md#principled-implementation

The paper's feasibility: the arm reaches the candidate and neither hand nor arm is blocked.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call per candidate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An infeasible candidate refuses its reach; it never returns a partial result.

## @evidence contracts/development/implementation.md#efficient-algorithms

The law's own test, run at most once per candidate.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each law supplies its own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each law's own.
