# src/exercise/WorkoutFeet.ts#WorkoutFeet.keep

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A `plant` support of a `stance` kind that does not stride is a planted leg goal on the entry's ankle and rotation; a `pivot` support is a planted goal on the foot turned about its ball by the posture's turn from the entry heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two lists of sides, read once, and one goal per side per posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A striding kind's feet are left to its keys, which solve its stance on the body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed planted feet prepare their heading/contact once through Leg.prepareGoal; each current root/yaw still computes its original knee hint. Pivot feet retain their current rotation and goal computation, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Entry placements, active sides, fixed pivot points/headings and planted-goal metadata belong to the unchanged body/entry. Each changing posture still gets an independent actual knee/leg goal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The keeper owns at most two fixed planted-goal readers or pivot records until its plan ends; no evaluated knee, current posture, FK reader or query history is retained.
