# src/scene/medium/readAutoMovieSceneMedium.ts#readAutoMovieSceneMedium

## @evidence contracts/development/implementation.md#principled-implementation

Reads the record `applySceneMedium` stored under the shared key, null when absent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one reader the stage, the scene pass and the medium pass share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No default medium is invented.

## @evidence contracts/development/common.md#meaningful-documentation

States what it returns and when null.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.