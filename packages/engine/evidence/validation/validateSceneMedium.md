# src/validation/validateSceneMedium.ts#validateSceneMedium

## @evidence contracts/development/common.md#meaningful-documentation

States what is admitted, the absent and null cases, the range rules and the fog exclusion, where buildScene runs it and why, and the violation paths.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the medium's ranges and the fog exclusion to appendSceneMediumArtifact, the rules staging applies, with a scene's `fog` set to a record as the exclusion's fog, so a scene authored directly cannot carry what a stage is refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scene-level admission beside validateSceneEnvironment, returning a validation as that gate does, so the render scene builder refuses an invalid medium before it attaches the fog or the medium.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is clamped and no fog is dropped in favour of the medium; the scene is refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constant work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns one collector until return; only the returned violations transfer to the caller.