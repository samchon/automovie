# src/actions/supportContactOnFloor.ts#supportContactOnFloor

## @evidence contracts/development/common.md#meaningful-documentation

States world-metre input, unnamed-target default and the existing floor/bearing threshold.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same less-than-or-equal height predicate as the support form; all supported contact parts receive a bearing pattern exactly in this case.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target default and one comparison serve form construction and the seed's bearing-only question.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The canonical bearing threshold, equality case and null-target height remain unchanged; no current bone pose is inferred.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work replaces unused contact-form/quiet-stance geometry when a caller asks only whether a bearing pattern exists.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Form construction and bearing-only observations use one threshold owner without sharing current query results.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state, body, pose, workspace or handle.
