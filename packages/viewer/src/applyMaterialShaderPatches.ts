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
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Composes every registered material operation into the same shader source and uniforms.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Preserves the registration order used by the native material compile hook.
 */
export const applyMaterialShaderPatches = <Shader>(
  patches: readonly { apply: (shader: Shader) => void }[],
  shader: Shader,
): void => {
  for (const patch of patches) patch.apply(shader);
};
