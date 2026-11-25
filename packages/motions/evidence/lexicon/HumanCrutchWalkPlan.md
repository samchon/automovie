# src/lexicon/HumanCrutchWalkPlan.ts#HumanCrutchWalkPlan

## @evidence contracts/development/common.md#meaningful-documentation

States what the plan returns for the walk's context.

## @evidence contracts/development/implementation.md#principled-implementation

The crutch gait on the support law: each station advances both crutch tips, then the hands bear on the planted grips while the feet swing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanCrutchWalk.plan`, its plan, apart from the law's crutch track.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanCrutchWalk.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `HumanCrutchWalk.plan` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the crutch course crutchWalkCourse the law's track also reads.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.
