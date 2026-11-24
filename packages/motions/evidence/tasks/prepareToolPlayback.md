# src/tasks/prepareToolPlayback.ts#prepareToolPlayback

## @evidence contracts/development/common.md#meaningful-documentation

Local seconds select the tool's wrist and its original target solve. Rig or frame changes revert to original authoring.

## @evidence contracts/development/implementation.md#principled-implementation

One held trunk keeps the arm-chain and collider frames fixed across the cycle; only the two constant-wrist intervals reuse the same chosen bend.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tool law supplies its original target and transport, this helper supplies the fixed-input check and event binding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each changing target keeps the same sweep, reach fallback, timing and wrist transform; it is never inferred from a neighbor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare one chain and one fixed target after placement. Each work sample evaluates one current sweep, while approach and return use the original time-dependent arm move with its fixed target.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact XYZ and orientation admit the fixed tool trunk; the native plan checks profile and fallback shoulder dependencies.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One fixed trunk context and fixed wrist goal are owned by the native plan, with fresh target fields on return and no per-query records.
