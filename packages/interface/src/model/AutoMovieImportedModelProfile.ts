/**
 * Compiler-recognized normalization profile proved from resident model bytes.
 *
 * @evidence contracts/development/design.md#principled-representation The closed tags select existing static and humanoid glTF/VRM admission contracts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface All imported levels share the same profile choice.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A profile tag supplies no inferred rig or physical traits.
 * @evidence contracts/development/common.md#meaningful-documentation States compiler ownership and resident-byte qualification.
 */
export type AutoMovieImportedModelProfile =
  | "gltf-static-v1"
  | "gltf-humanoid-v1"
  | "vrm-humanoid-v1";
