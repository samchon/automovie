# src/film/staging/prepareStageSupport.ts#prepareStageSupport

## @evidence contracts/development/common.md#meaningful-documentation

States world metre/shot-second queries, the ordered authored windows, and distinct unsupported and suspended answers.

## @evidence contracts/development/implementation.md#principled-implementation

Finds the last window whose inclusive start is at or before the time by binary search. Checks surface availability and footprint, evaluates canonical height and chooses minimum absolute offset from world Y, preserving id order on ties.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds an actor-indexed table and uses canonical footprint and height helpers for geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing footprint or nonfinite height cannot satisfy a nonempty window. No query can escape its named eligible set to use the scene-wide rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares each referenced footprint once. Each lookup takes logarithmic window selection plus containment and height work for its listed surfaces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares prepared rings among actors and windows within this admitted stage. The preparation borrows the same stage geometry for the lifetime of the lookup.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned table owns window indices and synchronous query closures and retains shared preparation while the caller keeps it. It allocates no host resources.
