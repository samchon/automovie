# src/reaction/staggerContacts.ts#staggerContacts

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, each input's unit and the windows' unit and order.

## @evidence contracts/development/implementation.md#principled-implementation

A foot bears between its swings: one scan of the declared steps per foot closes a window at each step's start and opens the next at its landing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop per side over the steps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A step that starts at the instant its foot landed opens no empty window; the last window's start is held inside the action.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(s) for s recovery steps, twice.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
