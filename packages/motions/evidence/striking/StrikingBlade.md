# src/striking/StrikingBlade.ts#StrikingBlade.shoulder

## @evidence contracts/development/common.md#meaningful-documentation

States the instant and the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The shoulder of the body as the advance leaves it at the decisive instant: the leading foot placed its travel ahead, the pelvis carried and lowered until both legs reach, the same posture the plan shows then.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One trunk resolution and one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The advance's own posture is used, so the reach is measured on the body that performs it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One trunk resolution.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBlade.ts#StrikingBlade.turned

## @evidence contracts/development/common.md#meaningful-documentation

States what is added, the sign and the split's owner.

## @evidence contracts/development/implementation.md#principled-implementation

Axial rotation of the trunk is mostly thoracic, so the chest takes `AutoMovieMotionHumanTrunk.CHEST` of the twist and the spine the rest; the pelvis and the feet are not turned.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two joints written over what the posture holds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A twist of 0 returns the posture unchanged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingBlade.ts#StrikingBlade.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the plan's decisive instant; the namespace states the time course.

## @evidence contracts/development/implementation.md#principled-implementation

The tool's pose is the path read at `AutoMovieMotionClock.through`, which passes the decisive pose at speed (a strike delivers its speed at its end, Putnam 1993), blended from and to the entry hold on the clock's minimum-jerk envelope (Flash and Hogan 1985); the body is decided first, from the advance alone, and both arms are fitted on it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The base, then the tool's frame at a second, then the two arm goals written on the base's posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The elbow hint is the arm's least-strain place with the hanging arm as its named fallback; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original lazy decisive fit establishes its arm reference. Every requested shoulder/chest observation still admits the current raw posture and returns its own demanded map. Base lowering and those observations borrow one native exact workspace, sharing only checked scalar prerequisites; all original fits remain and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing reference/hint, fixed hand-angle and hand-local tool contact/limit geometry stays per plan; every actual frame still creates fresh wrist goals and task records. One lazy genuine raw-trunk demand binds only fixed chest/shoulder names for the plan. Every current authored posture is still admitted and resolved; one explicit posture invocation lends the parent's genuine FK workspace through current base lowering and each demanded shoulder/chest observation, sharing only equal checked scalar prerequisites. Each raw trunk source is read independently because posture identity does not certify its getters or fields. Its decisive-pose fit/read-back remains independent, and no query loan is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its original stroke/base/entry, fixed hand/reference data and lazy tool-goal/fixed-name trunk producers. A query-local exact getter borrows its optional parent through base lowering/current trunk and ends on return or throw; the decisive fit stays independently scoped, and no reader/map/projector enters output postures.

# src/striking/StrikingBlade.ts#StrikingBlade.coursed

## @evidence contracts/development/common.md#meaningful-documentation

States when it applies, what is reached and what is held, and the pace.

## @evidence contracts/development/implementation.md#principled-implementation

A moving effector goal is one trajectory problem solved once with branch continuity and clearance; the held span keeps one basin of the arm, so no held instant asks the arm to cross between basins, and the reach that does cross is the planner's own at the pace of the arm's own travel.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The guarded plan, the span from its clock, one pace, one course.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The goals are `plan`'s own; the planner's refusal stands.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course per plan; the pace is read once, on first use, over the stroke at 240 Hz.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the goals to `plan`, the pace to `precisionStrokePeak` and the solve to `courseArmGoal`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the goal plan, the course and one pace number for the plan's life.
