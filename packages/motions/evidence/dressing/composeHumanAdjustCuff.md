# src/dressing/composeHumanAdjustCuff.ts#composeHumanAdjustCuff

## @evidence contracts/development/common.md#meaningful-documentation

States which wrist is presented, which hand reaches and how the cue identifies the adjustment.

## @evidence contracts/development/implementation.md#principled-implementation

Opposite-hand self-touch presents the cuff wrist using the existing touch law's body-relative placement and reach rules.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Selects the wrist and opposite hand and appends a single squeeze.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the anatomical wrist region and the squeeze form's finger closing, with a provisional short dwell for staging.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One action is appended through the chain operator.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reuses the touch law. Separate adjustments share no computation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The result owns the appended intent. The composer retains no state.
