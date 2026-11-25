# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and owner.

## @evidence contracts/development/design.md#principled-representation

The planner's own readers of one group over one span.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the course reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every reader is the planner's, so the course and the optimiser read one problem.

# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.IProps.at

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; the caller of `course`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.IProps.aimed

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; the caller of `course`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.IProps.problem

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; the caller of `course`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; the caller of `course`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.course

## @evidence contracts/development/common.md#meaningful-documentation

States the instants, the phases, the result and when there is none.

## @evidence contracts/development/implementation.md#principled-implementation

The hold is the rig's analytic two-bone fit at every frame, each continuing the frame before it the first continuing the law's own fit of its goal where the law gives that fit's seed (`hold`, one model between the law's search and its course), or, with no reach before the hold, the rest arms the course leaves from (their swivel and branch in closed form, `HumanLimbFit.seed`), so the hold starts on the solution of its goal nearest the arm shown: interval continuation of the swivel, the arm's one free coordinate on its goal (Tolani, Goswami and Badler 2000, section 3.2.4), so neither the elbow's side nor the forearm's twist jumps between two frames, and a vanished admitted arc refuses at its fit; the transports are the trajectory reader's blend, and the whole is admitted by the trajectory model's own feasibility reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The instants, one ordered continuation over the hold, the original model admission, then a local contact-branch continuation for a refused hold.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is admitted that the model refuses; a refused course only seeds the optimiser, every requirement intact.

## @evidence contracts/development/implementation.md#efficient-algorithms

One continued two-bone limb fit per arm per hold instant, a refinement within one swivel step of the instant before (no sweep), the first of a hold continued from the law's seed or, with no reach, from the rest's closed-form seed, on the planner's solved base with no posture solve; no fit on a transport instant, then one model evaluation, in place of the optimiser's penalty rounds of convexified programmes and its sampling planner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the planner's cached postures, bases and goals, and the trajectory's playback.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-instant arms live until the admission; the readers returned keep only the trajectory's playback data.

# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.grid

## @evidence contracts/development/common.md#meaningful-documentation

States which instants the grid holds, how each interval is cut, the source of the knot rule, the units and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The span's four instants and its knots are grid instants, as trajopt imposes a pose term at a timestep (github.com/joschu/trajopt src/trajopt/problem_description.cpp at 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause; Schulman et al. 2014, IJRR 33:1251, section VII-B); each interval between two of them is cut into equal pieces no longer than the optimiser's waypoint spacing, `STEP`. With no knots it is the phrases' own grid, unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of the grid, read by `course`; the optimiser's waypoints add the same knots (`AutoMovieMotionHumanArmPlanned.planned`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tuned value: the spacing is `STEP`, and 1e-9 s only tells coincident instants apart.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the span's frames plus a sort of its few breaks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the span.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array and retains nothing.

# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.IArm

## @evidence contracts/development/common.md#meaningful-documentation

States each member: the side, the rest, the return, the bone ridden and the hold's seed.

## @evidence contracts/development/design.md#principled-representation

The planner's per-arm inputs the laid course reads, angles in degrees as `IAngles` holds them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the laid course; the planner's `IPlanned` carries satisfy it, and only the members `course` reads are named.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A named interface in place of the inline object type it replaces, with the same members.

# src/compose/AutoMovieMotionHumanArmCourse.ts#AutoMovieMotionHumanArmCourse.IAt

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

The posture so far and its resolved pose without the group's arms, at one instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the laid course; the planner's `at` returns it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A named interface in place of the inline object type it replaces, with the same members.