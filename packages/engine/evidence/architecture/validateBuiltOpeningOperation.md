# src/architecture/validateBuiltOpeningOperation.ts#validateBuiltOpeningOperation

## @evidence contracts/development/implementation.md#principled-implementation

A state is a total assignment of one in-range value to every panel, checked with a seen set per state and a panel index, and ownership of a panel's element is membership in the filling element's subtree, computed by the shared breadth-first walk.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The opening half of operation validation, separated from `validateBuiltEnvironment`; travel is judged by the rule shared with connector carriages, and the work-wide `driven` table is threaded through both so doors and runs share one element budget.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No door type, state name or hardware kind is special-cased, and a second driver of an element is refused rather than allowed to silently override the first.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every panel, state, current-state and hardware rule, the one-driver rule and why, how `driven` is used and changed, the path, and the skip for an unoperated opening.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds the element subtree and panel index once, then checks supplied values by map lookup. Each of S states also scans P panels for missing assignments, so state work is O(S·P + V), even with few invalid supplied values; adds element, panel and hardware scans.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per operated opening; the work-wide `driven` table is the state shared across calls, by design.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The subtree, panel index and per-state sets are released on return; `driven` grows by at most one entry per panel and is owned by the caller.
