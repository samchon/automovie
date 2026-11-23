# src/geometry/curve/generateAutoMovieCurveAssembly64.ts#generateAutoMovieCurveAssembly64

## @evidence contracts/development/implementation.md#principled-implementation

An iterative dependency scan calls a factory only after every declared incoming token exists, binds actual immutable values, and publishes every declared outgoing boundary once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One context plus pending/result/operator maps owns routing; anatomical key meanings and curve generation remain in callbacks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing endpoints, duplicate region factories, missing/repeated publications and an iteration without progress are rejected rather than filled with placeholder boundaries.

## @evidence contracts/development/common.md#meaningful-documentation

States construct-once ordering, concrete result ownership and failure/side-effect limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

For R regions and E edges, repeated full edge scans cost O(R²E) in the worst case, plus context, factory and coefficient-validation costs; map storage is O(R+E) besides generated fields.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each factory result and operator is reused by later dependents within this invocation; no graph result is cached across invocations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Pending entries are removed after success; completed maps/context transfer to the caller. On failure local maps become collectible, while externally retained callback effects are outside this function.
