# src/posture/prepareHumanPostureProjection.ts#prepareHumanPostureProjection

## @evidence contracts/development/common.md#meaningful-documentation

Defines the body-owned projector, ordinary per-call projection and what a function that is not the body's does. Member facts: joints: Defines the one-joint callable of the body's own projector, no admission verdict and the analytic consumer's full before/after live-check obligation.

## @evidence contracts/development/implementation.md#principled-implementation

Actual projection is the engine's clampPose.prepare on the body's rig; first-bone constraints, clinical frames, last-declared axes and numerical clamping retain their engine owners. A body describes the rig it was made from (`IHumanBody`), so its projector is prepared once with it and a rig edit is adopted by making a body. Member facts: joints: The body's pose clamp lends the exact joint owner it projects with, while every current Jacobian articulation still receives its numerical projection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The body owns the projector; this entry and its two companions only read it, and assembleHumanPosture remains the direct-joint assembly owner. Member facts: joints: One identity test before the engine's factory lookup; HumanJacobian retains current projections, factor order and derivative formation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No projected result, raw posture, goal, time, resolved flag or numerical acceptance decision is stored; every joint is still projected in original order. Member facts: joints: A function that is not this body's projector declines without invocation. This lends no source-validation or differentiability verdict and skips neither live body checks nor actual tuple validation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One property read. The projector prepares O(B+D) bone/name metadata for B bones and D joint names once a body, at each name's first projection, and every call retains O(J) actual projections and fresh output wrappers/arrays for J joints. Member facts: joints: Reads the projector's existing index and swing-axis metadata; derivative/projection arithmetic remains and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every operation of one body shares the body's one projector because the body and its rig are one value; nothing is compared or looked up. Member facts: joints: The same projector's one-joint owner; no prior numerical answer supplies the derivative.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing: the body owns its projector and its static rig metadata for the body's life, never a pose, target, result, FK reader or query history; returned pose ownership remains the engine's fresh wrapper/array and borrowed-member contract. Member facts: joints: The borrower holds the body's callable only for its operation.
