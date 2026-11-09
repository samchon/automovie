/**
 * Fixed normalization profiles the builder may select for an external model.
 *
 * `gltf-static-v1` checks structure and resources of a model with at least one mesh. `gltf-humanoid-v1` also requires a skin, a joint whose name maps to `hips`, and count-matched JOINTS_0/WEIGHTS_0 with nonnegative components and a finite positive total per vertex. `gltf-motion-v1` inspects animations instead of meshes and requires at least one. `vrm-humanoid-v1` requires a GLB or VRM container with VRM metadata declaring `hips` and the same structural skin coverage. Weight normalization, duplicate influences and additional joint-set completeness are not proved; these profiles do not certify anatomy or complete glTF validity.
 *
 * @evidence contracts/development/design.md#principled-representation A closed union of four versioned profile literals makes the caller choose an interpretation explicitly instead of the inspector sniffing one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The union is mirrored at run time by a registry typed as a `Record` over it, so the type and the accepted strings cannot drift.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No default profile exists; an unknown string is refused by the inspector and by the runtime guard.
 * @evidence contracts/development/common.md#meaningful-documentation The documentation states what each of the four profiles adds to the structural checks.
 */
export type AutoMovieExternalModelIngestProfile =
  | "gltf-static-v1"
  | "gltf-humanoid-v1"
  | "gltf-motion-v1"
  | "vrm-humanoid-v1";
