# src/inspectAutoMovieExternalModelBytes.ts#inspectAutoMovieExternalModelBytes

## @evidence contracts/development/implementation.md#principled-implementation

The inspector follows the glTF 2.0 and GLB container rules: strict UTF-8 JSON with duplicate members refused by an iterative scan, index validation for the structural and profile fields it reads, forest and cycle checks by iterative parent walks, accessor and sparse ranges from component sizes with matrix column padding, payload lengths against declared buffers, and VRM 0.x thumbs migrated to VRM 1.0 slots by the published rename; the selected profile does not prove complete glTF validity, normalized complete skinning or anatomical correctness, and `VRMC_vrm` 1.0-beta thumb names are read as 1.0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The exported orchestrator sequences structural, payload and profile owners; source-preserving internal splits keep each concern within the file/export limits, while public result types have independent file-named owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Profiles and container suffixes are contract constants, no model or path is special-cased, the alias table is a `Map` so inherited names never resolve, and every refusal is the first violation found rather than a repaired value.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states how the container is chosen, every structural requirement, the duplicate-member reason, the no-guess no-repair rule, the VRM 1.0-beta limitation, each parameter's role and call frequency, and that the result holds no byte reference.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows container bytes for UTF-8/JSON and duplicate scanning, declared entries and name text, skinned components, motion values and encoded data URIs, plus full caller resolver work per external URI entry; resource/extension sorting uses O(U log U) and O(X log X) prefix-scanning comparisons. Per-accessor readers resolve views/strides once, and the BIN slice borrows container storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one inspection, a motion accessor is decoded once per accessor and type and shared by every channel that cites it, each track receiving its own copy, and a mesh and skin pair bound on several nodes is weight-checked once; the key is the accessor index or pair, which is valid because the document is immutable during the synchronous call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The decoded JSON, payload list, readers and caches live only for the call and are released on return or throw; the result retains copies proportional to resources, slots and motion data, and keeps neither the container nor sidecar bytes.
