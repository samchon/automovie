# src/film/gatePerformShotActions.ts#gatePerformShotActions

## @evidence contracts/development/implementation.md#principled-implementation

Visits actions in authoring order, gates actor identities and scalar domains, and elects the first frame camera deterministically. Failed-value text uses describeInvalidValue so ordinary coercion failures do not replace a located finding; throwing property accessors and malformed outer records remain outside this typed action-list boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the checks every action shares and the frame election; stage verbs are `gatePerformShotStageAction`'s, targets `resolvePerformShotTarget`'s and the framing vocabulary `validatePerformShotFraming`'s, so each rule has one home.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every action is checked by the same rules whatever its verb, the zero-span `"auto"` case is refused rather than given a minimum span, and a rival camera is refused rather than silently ignored.

## @evidence contracts/development/common.md#meaningful-documentation

States the actor and timing rules, the frame action's extra rules, the camera election and its refusal, where stage verbs are gated, and where violations and results go.

## @evidence contracts/development/implementation.md#efficient-algorithms

Local traversal is linear in actions and actor-list members with set lookups and per-list duplicate sets. Delegated target/rig/group/stage-verb checks, inspected id lengths and emitted diagnostic text add their own populations; supplied callbacks and conversion hooks have additional cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single pass over one action list; the staged tables it reads are the context's, built once per shot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan, bounded by the action count, is owned by `performShot` for the rest of its call; nothing else is retained.
