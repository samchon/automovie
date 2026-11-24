# src/validation/validateRotationArtifact.ts#validateRotationArtifact

## @evidence contracts/development/common.md#meaningful-documentation

Describes the finite component and unit norm checks, their diagnostic paths and when the norm is evaluated.

## @evidence contracts/development/implementation.md#principled-implementation

Checks all four components before invoking the collector's shared norm rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The declared quaternion type owns record shape. The collector owns unit-norm policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses nonfinite or nonunit input without adjusting its components.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four component checks and one norm use constant temporary work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Transform and cue gates use the same rotation record checks and shared collector tolerance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only appended findings keep any offending values. No rotation copy escapes the norm check.
