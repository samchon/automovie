# src/motion/prepareChainPlant.ts#prepareChainPlant

## @evidence contracts/development/implementation.md#principled-implementation

Removes only upper/lower articulation before FK, preserving current parent pose; strict descendant checks allow fixed intermediate bones, and relative rotations/local offsets recover the same chain for candidate FK under actual effective ROM.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation owns pose-invariant geometry used by the inverse solve, candidate point reader and final chain-frame reader, while target/bend choice belongs to each candidate input.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unresolved or branched pseudo-chains return null rather than treating same-named bones as adjacent; domains come from getConstraint on the actual rig, and no alternate geometric proxy replaces its offsets.

## @evidence contracts/development/common.md#meaningful-documentation

States articulation removal, model frame, topology/mapping premises, descendant-chain admission and null meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

One raw full FK or explicit prepared three-bone ancestor demand, plus two skeleton-domain scans and bounded descendant walks. Prepared FK writes its name map directly, without an intermediate frame array, mapped entry array or per-bone tuples. Every zeroed authored record remains admitted in order; returned geometry has constant-size vectors/frames/domains. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One record serves every candidate of the fixed source/chain. A supplied operation reader shares exact completed math; genuine immutable poseResolution shares static prerequisites and actual dependency rows with related poses. Fixed-frame recovery reuses that same producer's successful end conversion while rechecking the current joint. It must describe the exact rig/topology/mappings; changed source geometry requires new preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned fields borrow chain and resolved records and own derived offsets/relative rotations; temporary zeroed joints/FK map are released after return/null, with no resource handles.
