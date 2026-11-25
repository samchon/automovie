# src/everyday/restElbowSupport.ts#restElbowSupport

## @evidence contracts/development/common.md#meaningful-documentation

States which surface lies where and what the place depends on.

## @evidence contracts/development/implementation.md#principled-implementation

The supported arm is solved for its own goal first, so the palm is laid on the elbow that arm really has.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arm solve, one region placement and one hand turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The elbow is read from the solved pose, never estimated from the hint.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

handGoals owns the supported arm request and engine surface placement owns its actual elbow. One synchronous exact FK workspace serves the full native fitting and final actual elbow-frame observation, checking every changed dependency and retaining no fitted-pose result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local exact FK getter and temporary solved frames end at return or throw; only the fresh hand goal and its actual point/rotation escape, retaining no workspace or time history.
