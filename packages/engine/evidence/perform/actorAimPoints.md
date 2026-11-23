# src/perform/actorAimPoints.ts#actorAimPoints

## @evidence contracts/development/implementation.md#principled-implementation

Adds eyeHeight to world Y for each placement with an actor context; the existing synthesis convention treats actor positions as ground origins and height as metres.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single lifted placement table lets point, node and group resolution use the same positional resolver without a second averaging implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

This is the staged vertical eye-height convention, not animated eye FK; a rig's lean or arbitrary transform does not move these aim points.

## @evidence contracts/development/common.md#meaningful-documentation

States metre eye-height lift, exact key preservation, borrowed non-actor points and gaze-only use.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N placements, one O(N) pass and O(N) map entries plus fresh vectors only for entries with eye height.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The action's lookAt resolver shares this table; it is rebuilt from resumed contexts and placements so previous-beat positions are not stale.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The invocation owns the map and lifted vectors; unlifted vectors are borrowed and no persistent table or task is retained.
