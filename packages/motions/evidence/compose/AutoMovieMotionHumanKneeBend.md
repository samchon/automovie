# src/compose/AutoMovieMotionHumanKneeBend.ts#AutoMovieMotionHumanKneeBend.at

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are body/side, current world root and degree yaw, degree foot heading and outward degree splay; absent heading follows current yaw and splay defaults to zero.

## @evidence contracts/development/implementation.md#principled-implementation

Carries the actual LowerLeg rest point by root/yaw, then performs the original unit-forward transform under heading plus left splay or minus right splay.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two original HumanFrame.point calls own the nested point construction without another knee model.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No contact, one-metre step, heading default, side sign, arithmetic grouping or missing-rest behavior is changed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant two-frame rigid work has no varying population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses HumanFrame's existing scalar point owner, which also owns prepared fixed-point products.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh point with no retained body, current posture, reader, history or handle.

# src/compose/AutoMovieMotionHumanKneeBend.ts#AutoMovieMotionHumanKneeBend.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Every call reads the current root and yaw and returns a fresh world hint; the body, side, heading and splay are the plan's.

## @evidence contracts/development/implementation.md#principled-implementation

HumanFrame.preparePoint keeps both nested origin/local product groups of `at`: the outer unit-step transform under the fixed heading is prepared once, and the inner rest-knee transform once per consecutive yaw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The rest knee and the outer transform are read at preparation; each call rebuilds the inner transform only on a new yaw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point result, pose identity, heading approximation or omitted zero term is used; root translation and exact yaw remain inputs and every output is fresh.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed outer trigonometry is computed once and the inner once per consecutive exact yaw; every request keeps both translation groups. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body's rest knee and the fixed heading justify product reuse; a changed yaw replaces the one inner reader. No earlier world knee is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns the rest point, the outer transform and at most one last-yaw inner transform until release; it retains no root, world point, pose history or handle.
