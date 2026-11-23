# src/production/IAutoMovieEnginePerformShotActionPlan.ts#IAutoMovieEnginePerformShotActionPlan

## @evidence contracts/development/design.md#principled-representation

Keeps the stage list and its violation paths as parallel arrays because the performance builder reports a masked clip by its position in the list it was handed, which is neither the input index nor stable once engine-injected recoils are appended.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result of the action pass holding the four lists and the election later stages read, instead of six loose variables threaded through each stage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Jobs are recorded only for actions whose checks passed, and the path list stores a full path per entry so an injected recoil can point at the author's `onHit` rather than a field it does not have.

## @evidence contracts/development/common.md#meaningful-documentation

States who builds it, how actions are sorted into it, which later stages mutate which fields, and for each field what it holds.
