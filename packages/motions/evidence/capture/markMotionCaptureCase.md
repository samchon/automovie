# src/capture/markMotionCaptureCase.ts#markMotionCaptureCase

## @evidence contracts/development/common.md#meaningful-documentation

States each overlay's shape, the kind, label and colour rules and why, the flag rule, the paths, the frame and the degenerate cases.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/passes.md`: each kind of thing in one colour throughout a capture, a finding drawn where it was measured; a kind per colour keeps the case's own colours and obeys the inspection's colour law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Name each colour's kind, then one pass per overlay.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No colour is changed and the flag is the case's own limit, compared strictly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the overlays' points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure mapping of one case.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh marks and keeps nothing.
