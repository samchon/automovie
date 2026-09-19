import { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * One merged mesh plus the material groups its members occupy.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Produces one composed mesh without discarding its member groups.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Preserves individual member spans in the merged output.
 */
export interface IAutoMovieMeshAssembly {
  /**
   * The merged rigid mesh.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Carries the geometry shared by the logical assembly.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Provides the composed representation alongside member identities.
   */
  mesh: IAutoMovieMesh;
  /**
   * Declaration-ordered index ranges, one per contributing member.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Retains the declared ordering and addressability of group members.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Maps every individual contributor into the shared mesh.
   */
  groups: IAutoMovieMeshGroup[];
}
