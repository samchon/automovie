# src/architecture/validateBuiltConnectorOperation.ts#validateBuiltConnectorOperation

## @evidence contracts/development/implementation.md#principled-implementation

A state is a total assignment of one in-range value to every carriage, checked with a seen set per state and a carriage index, ownership is membership in the subtree of the run's elements, and a served stop must be one of the stops `builtConnectorStops` lists, the same list every stop query reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The connector half of operation validation, separated from `validateBuiltEnvironment`; it mirrors the opening operation and shares its travel rule and the work-wide `driven` table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No connector kind or state name is special-cased; reverse drive is refused only for a one-way run, as the contract states, and a second driver of an element is refused rather than overriding the first.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every carriage, state, drive, stop and current-state rule, the one-driver rule and how `driven` is used and changed, the path, and the skip for an unoperated run.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds element subtree, stop set and carriage index once, then checks state values by map lookup. Every state also scans all C carriages for missing assignments, so the cost includes O(S·C + V) for S states and V supplied values, even on sparse invalid states, plus elements, roots, stops and carriage validation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per operated run; the work-wide `driven` table is the state shared across calls, by design.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The subtree, stop set, carriage index and per-state sets are released on return; `driven` grows by at most one entry per carriage and is owned by the caller.
