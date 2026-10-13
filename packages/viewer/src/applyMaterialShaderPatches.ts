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
 */
export const applyMaterialShaderPatches = <Shader>(
  patches: readonly { apply: (shader: Shader) => void }[],
  shader: Shader,
): void => {
  for (const patch of patches) patch.apply(shader);
};
