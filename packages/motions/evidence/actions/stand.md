# src/actions/stand.ts#stand.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the side's role, its default and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the quiet-standing law to prepareStand at the requested or default duration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound check and one delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The duration is the author's or the named provisional default; nothing is clamped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work; the plan's cost is prepareStand's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One plan per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan owns what prepareStand prepares.

# src/actions/stand.ts#stand.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States fixed entry geometry and independently timed duration plans; prepareStand documents the fixed context and ownership contract.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the existing quiet-standing law to prepareStand, sharing only duration-independent geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of stance construction serves raw and prepared callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No probe trajectory replaces the actual-duration stance and the side retains its existing sway sign.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry preparation serves each requested duration; time-dependent posture evaluations remain actual computations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, entry, skill, side, sway and support remain fixed; timing and fresh random channels belong to each child plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one two-foot preparation until its action is released; no FK workspace or evaluated pose is retained.

# src/actions/stand.ts#stand.relaxed

## @evidence contracts/development/common.md#meaningful-documentation

States the hanging posture, clearance, body dependence and resolution.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the body-dependent hanging-arm search to standRelaxed, preserving the standing law's public entry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No independent relaxed angle is kept here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

No algorithm is chosen by this entry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses standRelaxed's weak per-body cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

This entry owns no retained state.

# src/actions/stand.ts#stand.abduction

## @evidence contracts/development/common.md#meaningful-documentation

States the angle, its unit and its use by moving arms.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the shoulder abduction from this body's relaxed arm, the same collision-free hanging posture the stand law uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One member read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second standing angle is chosen.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

No algorithm is chosen.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the relaxed posture's per-body weak cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing itself.

# src/actions/stand.ts#stand.feet

## @evidence contracts/development/common.md#meaningful-documentation

States both feet's rule, the frame and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the flat targets of standFeet's contact-preserving course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The planted contacts stay where the entry put them.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry FK of the planted sockets, standFeet's cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One read per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh points and retains nothing.

# src/actions/stand.ts#stand.root

## @evidence contracts/development/common.md#meaningful-documentation

States the placement rule, its owner role and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The rest stance's root-to-feet offset turned to the heading, plus the upright alignment's lean, at the ankles' mean height less the ankle height and `DROP`, no higher than the closed-form height at which each hip lies the quiet stance's hip-to-ankle distance from its ankle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to standRoot, which owns the placement and the reach bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The height follows from the ankles given, never from a floor assumed at zero.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work after standUpright's per-body alignment.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads standUpright's alignment for the lean.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh point and retains nothing.

# src/actions/stand.ts#stand.legs

## @evidence contracts/development/common.md#meaningful-documentation

States the goals, their frame and the knees' bend.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to standingLegs with this law's `TOE_OUT`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The feet stay on the points given.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares standingLegs with prepareLegs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh goals and retains nothing.

# src/actions/stand.ts#stand.prepareLegs

## @evidence contracts/development/common.md#meaningful-documentation

States fixed heading/body geometry and changing root/ankle inputs; prepareStandingLegs owns the complete preparation contract.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the existing standing toe-out and knee-frame construction to prepareStandingLegs with this law's TOE_OUT.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One content-owner delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the same TOE_OUT, HumanFrame and HumanFoot geometry as legs.

## @evidence contracts/development/implementation.md#efficient-algorithms

The delegated fixed-yaw preparation removes repeated heading/contact construction across current-root queries; no numerical solve is skipped.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller keeps body/yaw fixed; the returned function reads every new root and ankle target independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the delegated two-foot preparation for its plan's lifetime; no query result is retained.

# src/actions/stand.ts#stand.posture

## @evidence contracts/development/common.md#meaningful-documentation

States the posture, its place and its use as every performer's start.

## @evidence contracts/development/implementation.md#principled-implementation

The stance with the body's relaxed hanging arms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to `stance`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arms are the body's measured relaxed ones.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work after the per-body relaxed arms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `stance` and `relaxed`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh posture and retains nothing.

# src/actions/stand.ts#stand.stance

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their units and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The rest feet turned to the heading at the floor point and ankle height, the root `root` places over them, the upright alignment's trunk and the legs planted on the feet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two feet, one root, one posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every place follows from the body's rest feet and measures.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `root`, `legs` and standUpright's alignment.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh posture and retains nothing.

# src/actions/stand.ts#stand.footprints

## @evidence contracts/development/common.md#meaningful-documentation

States the two instants read and what each serves.

## @evidence contracts/development/implementation.md#principled-implementation

One quiet-stand plan of one second, read at 0 and at its duration, when the settle and the sway's window have both ended; each foot's placement is its planted leg goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One plan, two readings, four placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The placements are this law's own goals; no foot is typed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One stand plan and two posture readings per climb plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stair and ladder climbs share this one reading of the stand.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records; the stand plan ends with the call.

# src/actions/stand.ts#stand.IFootprints

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its instant and frame.

## @evidence contracts/development/design.md#principled-representation

The entry posture plus the feet at the entry and settled, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all read by the stair and ladder climbs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the shared posture and foot placement types.
