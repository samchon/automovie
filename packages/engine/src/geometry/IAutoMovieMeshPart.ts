import { IAutoMovieMeshTransform } from "./IAutoMovieMeshTransform";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * One named member of an assembly, optionally placed by its own transform.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Preserves an addressable member inside a logical mesh group.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Retains member identity while composing shared geometry.
 */
export interface IAutoMovieMeshPart {
  /**
   * Stable member identity, unique inside one assembly.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Keeps the grouped member independently addressable.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Preserves individual identity inside the composed group.
   */
  id: string;
  /**
   * The member's geometry in its own local frame.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Carries the geometry owned by one logical group member.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Keeps the member's own representation distinguishable after composition.
   */
  mesh: IAutoMovieMesh;
  /**
   * Where the member sits in the assembly frame.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Places one member without erasing its group identity.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Resolves member placement while preserving individuality.
   */
  transform?: IAutoMovieMeshTransform;
}
