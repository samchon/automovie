# src/architecture/validateBuiltTravelMotion.ts#validateBuiltTravelMotion

## @evidence contracts/development/implementation.md#principled-implementation

A one-degree-of-freedom joint needs a usable axis, a range containing its rest value 0, and a non-empty interval; the full-turn cap is shared with the swept-envelope solver so a range validation admits is one that solver can enumerate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rule for both panel and carriage travel, parameterized only by the moving member's name, so doors and lifts cannot drift apart.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No member kind is special-cased; prismatic and revolute differ only where the contract does, the pivot and the full-turn cap.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why the label exists, every axis, pivot and range rule, the cap and who relies on it, the units, and the path.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work for one motion, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one motion per call; each panel and carriage is checked once per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends at most a bounded handful of violations to the caller's collector and retains nothing.
