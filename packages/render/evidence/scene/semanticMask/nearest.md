# src/scene/semanticMask/nearest.ts#nearest

## @evidence contracts/development/implementation.md#principled-implementation

Walks the actual object-parent chain including self and returns the first root claimed by the supplied palette map, otherwise undefined.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closest-ownership law is shared by paint and audit instead of independently guessing inherited semantic ids.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Object3D acyclic parent structure and same-scene root map are premises; no fabricated default root turns an unclaimed mesh into addressed geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Documents self-inclusive closest root and undefined for an unclaimed chain.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most D ancestor Map lookups cost O(D) with constant coordinator state and no subtree or palette enumeration.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller map is reused while walking this current chain; cached ancestry would be invalid after reparenting and none is retained here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Object/map remain borrowed and only a borrowed entry or undefined escapes, with no resource or persistent reference acquired.
