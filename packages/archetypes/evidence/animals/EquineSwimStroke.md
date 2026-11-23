# src/animals/EquineSwimStroke.ts#EquineSwimStroke

## @evidence contracts/development/implementation.md#principled-implementation

Each joint runs a minimum-jerk path between its measured mean extremes at its event phases, the closed-form point-to-point profile, so the extremes and their order are exact and velocity is continuous through each event.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Wrap the phase, then evaluate one two-segment cycle per joint from the shared event table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are the studies' Table 2 means, not tuned values; the authored event phases and proximal slopes are named as authored in their tables.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four constant-time cycle evaluations per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its two inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh four-number record.

## @evidence contracts/development/common.md#meaningful-documentation

States both sources, the angle conventions, the cycle origin, which event phases are measured and which authored, and the unmeasured proximal swing.
