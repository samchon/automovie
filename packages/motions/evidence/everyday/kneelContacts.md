# src/everyday/kneelContacts.ts#kneelContacts

## @evidence contracts/development/common.md#meaningful-documentation

States which part bears when, on which floor, and the share timebase.

## @evidence contracts/development/implementation.md#principled-implementation

A window opens at the start of the first phase whose two keys both hold the contact and closes at the start of the first that does not; a foot holds when `kneelKeys.still`, a knee when both keys are at or past the one it lands in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One open/close scan per part over the phases, four parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The knees' windows come from the keys that put them on the floor, never from a sampled height; the support is the entry's, defaulting to the ground only when the entry declares none.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four scans of the P phases, O(P) once per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each side's floor support is read once and serves its foot and its knee.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
