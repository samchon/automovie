import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Per-vertex skeletal binding: which bones influence each vertex and by how
 * much. Drives mesh deformation when the skeleton poses.
 *
 * Both arrays are grouped in fours per vertex (glTF's 4-influences-per-vertex
 * convention): vertex `i` is influenced by `bones[4i .. 4i+3]` with normalized
 * `weights[4i .. 4i+3]`.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-derived-deformation-basis Exposes `IAutoMovieMeshSkin` as the portable data boundary for the asset derived deformation basis requirement.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-derived-deformation-staleness Types `IAutoMovieMeshSkin` for the asset spec derived deformation staleness system contract.
 * @author Samchon
 */
export interface IAutoMovieMeshSkin {
  /**
   * The bones any vertex may be bound to (the skin's joint set).
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-derived-deformation-basis Exposes `joints` as the portable data boundary for the asset derived deformation basis requirement.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-derived-deformation-staleness Types `joints` for the asset spec derived deformation staleness system contract.
   */
  joints: AutoMovieHumanoidBone[];

  /**
   * Per-vertex bone indices into `joints`, grouped in fours.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-derived-deformation-basis Exposes `boneIndices` as the portable data boundary for the asset derived deformation basis requirement.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-derived-deformation-staleness Types `boneIndices` for the asset spec derived deformation staleness system contract.
   */
  boneIndices: number[];

  /**
   * Per-vertex influence weights in `[0,1]`, grouped in fours, summing to 1.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-derived-deformation-basis Exposes `weights` as the portable data boundary for the asset derived deformation basis requirement.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-derived-deformation-staleness Types `weights` for the asset spec derived deformation staleness system contract.
   */
  weights: number[];
}
