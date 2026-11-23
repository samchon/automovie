# src/kinematics/markAutoMovieRomOvershoot.ts#markAutoMovieRomOvershoot

## @evidence contracts/development/common.md#meaningful-documentation

States the input and its source, which joints are marked and how, the kind, label, colour, path and frame, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The measure is the pose gate's own overshoot sum, so a mark appears exactly where the gate reports a violation, and an overshoot is an anomaly of the joint, so the mark is flagged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and one map over the entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance hides a small overshoot, and no joint is named; an unmeasurable overshoot is marked rather than skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the entries.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh marks and keeps nothing.
