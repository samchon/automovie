import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";

/**
 * Fresh rigid mesh buffers and a parallel list of member ranges after placement
 * and concatenation.
 */
export interface IAutoMovieMeshAssembly {
  /**
   * Owned merged buffers, with explicit triangle indices and no skin. UVs and
   * normals survive when every contributing mesh carries the corresponding
   * attribute.
   *
   * RGB and relief weights are copied when any member supplies them, with
   * identity value one for missing members. Explicit physical source references
   * retain their identities.
   */
  mesh: IAutoMovieMesh;

  /**
   * One range for each declared member, in declaration order. Empty members can
   * have zero-length ranges at the current index offset.
   */
  groups: IAutoMovieMeshGroup[];
}
