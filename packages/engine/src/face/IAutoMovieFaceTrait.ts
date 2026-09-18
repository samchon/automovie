import { AutoMovieFaceParameterName } from "@automovie/interface";

/**
 * One present leaf of an {@link IAutoMovieFace}, projected onto its morph
 * target: the flat `parameter` name the template carries, the dotted `path` the
 * document spells it at (for violation messages), and the weight.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-deformable-surface Projects an authored face description onto the named morph controls that deform its base surface.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-skin-morph-facts Carries each selected morph control together with its source path and bounded weight.
 * @author Samchon
 */
export interface IAutoMovieFaceTrait {
  /**
   * Morph-target name the trait drives.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-deformable-surface Identifies the morph control used to deform the face surface.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-skin-morph-facts Preserves the name of the morph fact applied to the base geometry.
   */
  parameter: AutoMovieFaceParameterName;

  /**
   * Dotted document path of the leaf, e.g. `"jaw.chin.length"`.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-deformable-surface Relates a selected face field to the control that deforms the surface.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-skin-morph-facts Retains the authored source path for the emitted morph fact.
   */
  path: string;

  /**
   * The signed effective weight on this side.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-deformable-surface Supplies the bounded control value used by the selected surface deformation.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-skin-morph-facts Represents the effective weight applied to the named morph difference.
   */
  weight: number;
}
