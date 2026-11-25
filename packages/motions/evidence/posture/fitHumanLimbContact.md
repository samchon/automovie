# src/posture/fitHumanLimbContact.ts#fitHumanLimbContact

## @evidence contracts/development/common.md#meaningful-documentation

States current world goal/contact, side, actual prepared workspace and point-fitting policy; no-contact goals return their one ordinary fit.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original fixed-point contact relation and Anderson mixing over the last three iterations (Walker and Ni 2011), on one map: every pass continues the seed the instant's first fit chose, so the swivel stays within the continued fit's step of it; retains the nearest actual fitted contact and its actual toe correction when iteration does not close.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner holds contact re-aiming once, while HumanLimbFit owns attachment/obstacle/source construction and selects ordinary versus explicit continuous-curve point fitting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains the 20-micrometre admission, original 16 mixed orientation passes and original accepted branch. An offset wrist failing actual FK admission can take up to fifteen improving projected-position corrections at the same bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fit without an offset contact. Both re-aim phases are bounded by REAIM_PASSES, continue the instant's first seed and stop on admission; three-iteration mixing closes a near-affine map in a few passes (measured on a coat's sleeves: re-aims running all 16 passes 116 to 12 of about 16,000 fits). The wrist-only projected correction also stops on its first non-improving fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the same goal-specific workspace across actual re-aimed targets; a later pass continues the first pass's swivel seed for a target millimetres away (a seed from this same synchronous fit, never another instant's); each fit and rotation remains current and the actual chosen toes travel with that candidate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Goal, workspace, fit policy and bounded current/best candidate state are synchronous local data. Returned records retain no reader, callback, source factory, history or handle.
