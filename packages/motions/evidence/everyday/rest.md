# src/everyday/rest.ts#rest.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the plan, context, paired-place/duration refusals, original place units and entry-to-rest transport; the namespace and parameter fields own each place's meaning.

## @evidence contracts/development/implementation.md#principled-implementation

Builds the original self-surface rest goals, carries them with the base root/heading to the body as it stands at the last arrival, solves the places there once, and carries both arms from their entry angles to their solved places on one minimum-jerk arrival in joint space, the clearing course planned against that arrival; finger shares follow the same course and base contacts remain unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed rest geometry, finger entries, the solved places and the planned arrival prepare once. Each query reads the actual base, writes the held arm angles and current fingers, then carries the arms while they travel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves paired-place rules, raw duration validation, goal surfaces, current base posture and the farther hand's transport time; the places are solved by the posture resolver itself, and an arrived arm holds that solution rather than an approximation of it.

## @evidence contracts/development/implementation.md#efficient-algorithms

The places fit once per plan. Standalone reach preparation evaluates the fixed clearance keys once; native display samples then evaluate the arm blend without matching or storing displayed times. An arrived arm has no goal to fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each held arm uses the action's own solved place. The native display reach uses the fixed arrival course and retains the live finger/base writer. The authoring and carrier branches borrow a synchronous exact FK/ROM operation context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns fixed local rest/finger/entry metadata and the existing clearance coefficients until release. Query-local FK/ROM loans and temporary postures never enter retained frame state or returned goal fields; seeking grows no history.

# src/everyday/rest.ts#rest.goals

## @evidence contracts/development/common.md#meaningful-documentation

States the input posture, the places and which hands get goals.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `restGoals`, the owner of every place's effector goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call; the law and the executable cases read the goals through it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: `restGoals` states its rules.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

What `restGoals` costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A delegating facade.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
