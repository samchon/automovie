import type { AutoMovieImportedModelProfile } from "../AutoMovieImportedModelProfile";

/**
 * Fixed normalization profiles the builder may select for an external model.
 *
 * `gltf-static-v1` checks structure and resources of a model with at least one
 * mesh. `gltf-humanoid-v1` also requires a skin, a joint whose name maps to
 * `hips`, and count-matched JOINTS_0/WEIGHTS_0 with nonnegative components and
 * a finite positive total per vertex. `gltf-motion-v1` inspects animations
 * instead of meshes and requires at least one. `vrm-humanoid-v1` requires a GLB
 * or VRM container with VRM metadata declaring `hips` and the same structural
 * skin coverage. Weight normalization, duplicate influences and additional
 * joint-set completeness are not proved; these profiles do not certify anatomy
 * or complete glTF validity.
 */
export type AutoMovieExternalModelIngestProfile =
  | AutoMovieImportedModelProfile
  | "gltf-motion-v1";
