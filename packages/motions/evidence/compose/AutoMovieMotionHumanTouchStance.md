# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the refusal; the namespace states the movements.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist's distance beyond the kept share falls monotonically while the shoulder rises toward the wrist's height, so the least girdle angle, then the least heel angle, is its bisected root; each is taken only for a wrist above the shoulder that it brings nearer, and the lean is solved on the risen posture. A one-handed stance is chosen between the forward lean and the lean on a trunk turned toward the wrist, in that order (`choose`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reach at a girdle and a heel angle, one rule for the least of either (`least`), the lean, the primitives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A region the rise does not bring nearer keeps the heels down; nothing is clamped, the lean refuses what remains.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains every original girdle/heel endpoint, bisection and three-progress reach probe. One fixed shoulder demand serves them, and each three-progress operation shares exact FK prerequisites without full bone output. Runtime lean/lowering borrow current-person metadata; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rise, LeanInto and raw lowering retain their original owners; Reach.prepareCheck binds only static body/limb names. Every original wrist callback/check still executes in order with its current posture, while dynamic workspaces stay local to that reach/write.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned stance owns props, fixed solved angles/feet and lean metadata until release. Every three-progress FK getter and runtime loan releases on synchronous return or throw; no sampled root, pose, wrist or query history enters plan state.

# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance.choose

## @evidence contracts/development/common.md#meaningful-documentation

States the paper's algorithm used, that the candidates are the law's own, the boundary of the refusals it reads and the refusal it raises.

## @evidence contracts/development/implementation.md#principled-implementation

Vahrenkamp, Asfour and Dillmann 2013, "Robot placement based on reachability inversion", ICRA pp. 1970-1975, §V Algorithm 1: each base pose is tried by solving the arm and checking the solution for collision, and the first that passes is returned. The poses tried are the candidates the law declares, in its order; no reachability map is built or sampled. The first passing candidate is the choice, and the candidates after it are not tried (the user's rule, compute only as needed).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the candidates through one try of a base (`reached`), and one refusal builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only a typed reach refusal is read as Algorithm 1's nothing; any other refusal or error propagates at once. An exhausted choice refuses with the first candidate's facts and every candidate's reason, never with a fallback stance; an empty candidate set is a parameter refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one check per candidate, and none after the first that passes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each candidate's check is the law's own and distinct.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps the refusals of the candidates tried until it returns or throws; retains nothing after.

# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance.attempt

## @evidence contracts/development/common.md#meaningful-documentation

States Algorithm 1's try of one base, its result and what propagates.

## @evidence contracts/development/implementation.md#principled-implementation

Vahrenkamp et al. 2013, §V Algorithm 1: one base pose tried, its stance returned, nothing on a reach refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the shared try (`reached`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refusal of any other kind propagates as raised.

## @evidence contracts/development/implementation.md#efficient-algorithms

One check.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same try `choose` and `reaches` use.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance.reaches

## @evidence contracts/development/common.md#meaningful-documentation

States what it returns: whether the candidate passes.

## @evidence contracts/development/implementation.md#principled-implementation

Vahrenkamp et al. 2013, §V Algorithm 1's try of one candidate (`attempt`), read as pass or fail.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison of `attempt`'s result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A check must return a value to pass; a refusal of any other kind propagates.

## @evidence contracts/development/implementation.md#efficient-algorithms

One check.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `attempt`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance.IChoice

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and order.

## @evidence contracts/development/design.md#principled-representation

The paper's finite candidate set and its per-candidate check, as a law declares them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members: the candidates and the check.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No score or tie rule beyond the declared order: the code computes no reachability quality.

# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance.IChoice.reach

## @evidence contracts/development/common.md#meaningful-documentation

States the stance it returns and the refusal that marks a candidate as not reaching.

## @evidence contracts/development/implementation.md#principled-implementation

Algorithm 1's check of one base: the law's own closed-form reach and clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call per candidate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A candidate that does not reach refuses its reach; it never returns a partial stance.

## @evidence contracts/development/implementation.md#efficient-algorithms

The law's own check, run at most once per candidate.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each law supplies its own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each law's own.
