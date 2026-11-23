# src/index.ts#addMaterialShaderPatch

## @evidence contracts/development/implementation.md#principled-implementation

Captures a new ordered registration array and installs Three's supported onBeforeCompile/customProgramCacheKey hooks; all native shader fields pass through to each patch, while patch keys must identify source structure and avoid joined-key collisions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One material userData list records composition and is also consumed by Human albedo observation; the private captured array preserves the registration order for that hook installation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the documented native compile extension points rather than mutating Three prototypes; unrelated preexisting hooks are overwritten, not secretly preserved, and no automatic recompilation compensation is applied to already-compiled materials.

## @evidence contracts/development/common.md#meaningful-documentation

Gives ordered composition, cache-key role, native-hook ownership and current preexisting-hook/key/recompilation limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies P registered patch references for each addition and joins P keys per cache-key query; compiling executes P operations plus their source-edit costs. Registering P patches individually has quadratic total list-copy work, acceptable only for the current few material features rather than an unbounded plugin population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses prior registered operations and lets Three reuse programs by ordered joined structural keys; equivalent uniform values alone do not justify sharing effectful source edits, and callers own key correctness.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Material userData and installed closures retain the patch list/captured patch state until material references are released; there is no unregister API or population cap, and this helper acquires no shader program or texture itself.
