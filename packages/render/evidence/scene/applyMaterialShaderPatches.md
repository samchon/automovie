# src/index.ts#applyMaterialShaderPatches

## @evidence contracts/development/implementation.md#principled-implementation

Sequentially invokes the registered operations on the same complete mutable shader input, preserving native fields and predecessor edits; operations must obey their own shader/key contract and a thrown operation propagates with earlier mutations intact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only ordered composition; patch-specific source edits and material hook/cache registration remain with their respective owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not copy/project native fields, replace callbacks or repair operation failures; every registered operation is invoked by order without fixture filtering.

## @evidence contracts/development/common.md#meaningful-documentation

States shared input identity, native-field preservation, registration order and nontransactional stop-on-throw behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits P operations once with constant coordinator storage; dominant time is the sum of each patch's source/uniform editing work, with no redundant shader copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the captured ordered list and same input object during one compilation; mutable shader effects are rerun for a new compile rather than sharing an already-edited foreign shader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the list and shader only during the call, retains neither and launches no task; material/patch owners govern any resources captured by supplied operations.
