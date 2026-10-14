/**
 * Apply the captured registration list to one shader in order. The material's
 * native compile hook supplies this shader before compilation; each operation
 * observes its predecessor's source and uniforms. The same complete input
 * object passes to each operation; this owner neither projects its fields nor
 * substitutes renderer configuration or material lifetime state.
 *
 * An operation's exception propagates immediately. Earlier edits remain on
 * the caller's object and later operations do not run; composition owns no
 * rollback or copy of a native program.
 *
 * @evidence contracts/common.md#principled-implementation Sequentially invokes the registered operations on the same complete mutable shader input, preserving native fields and predecessor edits; operations must obey their own shader/key contract and a thrown operation propagates with earlier mutations intact.
 * @evidence contracts/common.md#clear-and-simple-design Owns only ordered composition; patch-specific source edits and material hook/cache registration remain with their respective owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not copy/project native fields, replace callbacks or repair operation failures; every registered operation is invoked by order without fixture filtering.
 * @evidence contracts/common.md#meaningful-documentation States shared input identity, native-field preservation, registration order and nontransactional stop-on-throw behavior.
 * @evidence contracts/performance.md#efficient-algorithms Visits P operations once with constant coordinator storage; dominant time is the sum of each patch's source/uniform editing work, with no redundant shader copy.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the captured ordered list and same input object during one compilation; mutable shader effects are rerun for a new compile rather than sharing an already-edited foreign shader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the list and shader only during the call, retains neither and launches no task; material/patch owners govern any resources captured by supplied operations.
 */
export const applyMaterialShaderPatches: <Shader>(
  patches: readonly { apply: (shader: Shader) => void }[],
  shader: Shader,
) => void = <Shader>(
  patches: readonly { apply: (shader: Shader) => void }[],
  shader: Shader,
): void => {
  for (const patch of patches) patch.apply(shader);
};
