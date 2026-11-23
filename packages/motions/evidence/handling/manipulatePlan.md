# src/handling/manipulatePlan.ts#manipulatePlan

## @evidence contracts/development/common.md#meaningful-documentation

States the prepared inputs, timebase, shared geometry and ownership of returned posture records.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk wrist transport and digit descent retain the law's original equations; sorted activation windows store the greatest authored index reached so unordered times keep the original last-matching-contact rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation owns invariant placements and windows; evaluation selects one contact per participating hand and writes its goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No contact, timing, depth or digit goal is removed or approximated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation is O(N log N) time and O(N) space; each posture selects two active windows at most in O(log N), with constant geometry work instead of scanning and rebuilding all N contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each contact's wrist and shape, and each hand's rotation and bend, are shared only within the plan whose body, posture, presses and interval determine them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan owns O(N) prepared contacts and windows and releases them with the plan; no global cache or process is retained.
