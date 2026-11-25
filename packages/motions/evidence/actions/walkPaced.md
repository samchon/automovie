# src/actions/walkPaced.ts#walkPaced

## @evidence contracts/development/common.md#meaningful-documentation

States what the clock moves, what stays the plan's own and how the table is read.

## @evidence contracts/development/implementation.md#principled-implementation

A time warp: the pose stays a pure function of the film second, and every named instant is mapped by the same table, so events, contacts and poses agree. It never runs backwards because the table never falls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two maps over one table: film to plan by index, plan to film by a binary search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The table is taken as given; what pace it may ask is its maker's to bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

A pose costs one index; a named instant one binary search of the table.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to cache: the table is the cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the plan and the table for as long as the returned plan is held.
