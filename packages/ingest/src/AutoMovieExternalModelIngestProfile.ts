

/**
 * Fixed normalization profiles the builder may select for an external model.
 *
 * `gltf-static-v1` checks structure and resources of a model with at least one mesh. `gltf-humanoid-v1` also requires a skin, a joint whose name maps to `hips`, and count-matched JOINTS_0/WEIGHTS_0 with nonnegative components and a finite positive total per vertex. `gltf-motion-v1` inspects animations instead of meshes and requires at least one. `vrm-humanoid-v1` requires a GLB or VRM container with VRM metadata declaring `hips` and the same structural skin coverage. Weight normalization, duplicate influences and additional joint-set completeness are not proved; these profiles do not certify anatomy or complete glTF validity.
 *
 * @evidence contracts/common.md#principled-implementation A closed union of four versioned profile literals makes the caller choose an interpretation explicitly instead of the inspector sniffing one.
 * @evidence contracts/common.md#clear-and-simple-design The union is mirrored at run time by a registry typed as a `Record` over it, so the type and the accepted strings cannot drift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default profile exists; an unknown string is refused by the inspector and by the runtime guard.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what each of the four profiles adds to the structural checks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The profile union is a type and has no runtime cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A literal union of profile names coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union allocates nothing; its runtime list is a frozen four-element constant.
 * @author Samchon
 */
export type AutoMovieExternalModelIngestProfile =
  | "gltf-static-v1"
  | "gltf-humanoid-v1"
  | "gltf-motion-v1"
  | "vrm-humanoid-v1";
