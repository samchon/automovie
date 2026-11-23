# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance

## @evidence contracts/development/common.md#meaningful-documentation

States the two movements, their order, why the rise comes first, what bounds each and who refuses.

## @evidence contracts/development/design.md#principled-representation

A girdle angle, a heel angle and a lean solved once from the wrist's place on the posture, the body's three ways of closing a reach without a step.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two limits, the props, the solved stance and its solver; read by the touch law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The wrist is the caller's own goal and the rise and the lean are their owners', so no region, effector or body is named here.

# src/compose/AutoMovieMotionHumanTouchStance.ts#AutoMovieMotionHumanTouchStance.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the refusal; the namespace states the movements.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist's distance beyond the kept share falls monotonically while the shoulder rises toward the wrist's height, so the least girdle angle, then the least heel angle, is its bisected root; each is taken only for a wrist above the shoulder that it brings nearer, and the lean is solved on the risen posture.

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
