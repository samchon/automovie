# src/index.ts#IAutoMovieSceneSoftProps

## @evidence contracts/development/common.md#meaningful-documentation

Documents full-frame replacement, subject identity and the release boundary.

## @evidence contracts/development/design.md#principled-representation

One owner updates from world-metre frame data and handles geometry and material lifetimes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

buildScene and draw subjects call the same update and release operations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies the whole frame and producer status. The handle neither samples time nor owns the scene's other objects.

# src/index.ts#IAutoMovieSceneSoftProps.update

## @evidence contracts/development/common.md#meaningful-documentation

States the full-frame input, retained identity and omitted-subject outcome.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The signature has no algorithm; buildSceneSoftProps provides it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

The signature has no body; buildSceneSoftProps supplies the decomposition.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The signature defines the replacement boundary; buildSceneSoftProps owns admission and projection.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The signature chooses no traversal or allocation strategy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The signature establishes subject identity; buildSceneSoftProps owns reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The signature acquires no resources; buildSceneSoftProps owns their lifetime.

# src/index.ts#IAutoMovieSceneSoftProps.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States the resources released and the closed lifetime.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The signature has no algorithm; buildSceneSoftProps provides it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

The signature has no body; buildSceneSoftProps supplies the decomposition.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The signature defines a lifetime boundary; buildSceneSoftProps owns independent release attempts.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The signature chooses no traversal or allocation strategy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The signature starts no new operation after closure; buildSceneSoftProps supplies the guard.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The signature acquires no resources; buildSceneSoftProps owns their release.
