# src/compose/touchGoal.ts#touchGoal

## @evidence contracts/development/common.md#meaningful-documentation

States the lift, the travel, the stand-off and who else reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The goal is laid on the region frame each second with the kind's offsets in that frame; a held rotation turns with the heading and the wrist follows from it so the effector still meets its place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The constants once, then one region read, the offsets and one effector goal per second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lift, the travel and the stand-off are shares of the hand; a count that is not whole throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

One region read per second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the effector, laid direction and tangent owners. One wave of the touch's count, prepared at its first stroke sample, serves every later one. Current FK/genuine ROM metadata is forwarded to region/collider callbacks for that invocation only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function retains props, fixed entry-frame hints and at most one count-bound wave reader until release. Query metadata remains callback arguments and never enters the retained reader or returned goal; no time/result history is stored.
