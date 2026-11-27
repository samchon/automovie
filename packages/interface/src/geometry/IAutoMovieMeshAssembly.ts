import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";

/**
 * What `mergeMeshParts` returns: one merged rigid mesh plus the index
 * range each member occupies, so a finish, a budget or a quantity take-off can
 * still address a member after the buffers were concatenated.
 */
export interface IAutoMovieMeshAssembly {
  /**
   * The merged rigid mesh, members placed by their transforms and concatenated
   * in declaration order.
   */
  mesh: IAutoMovieMesh;

  /**
   * One index range per contributing member, in declaration order, covering the
   * whole index buffer without gaps.
   */
  groups: IAutoMovieMeshGroup[];
}
