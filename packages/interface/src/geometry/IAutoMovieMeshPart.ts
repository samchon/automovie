import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieMeshTransform } from "./IAutoMovieMeshTransform";

/**
 * Rigid member input for procedural mesh assembly. Its ID is copied into the
 * matching output range and its optional transform places the mesh in assembly
 * coordinates.
 */
export interface IAutoMovieMeshPart {
  /**
   * Unique member ID inside one assembly. The merge compares strings as
   * supplied and preserves the original ID.
   */
  id: string;

  /**
   * Borrowed unskinned geometry in its local metre frame. Merge reads the input
   * buffers and builds new output buffers.
   */
  mesh: IAutoMovieMesh;

  /**
   * Optional placement to assembly coordinates. Omission skips the placement
   * step before concatenation.
   *
   * Scaling preserves the original texture coordinates. Their values continue
   * to measure the unscaled geometry.
   */
  transform?: IAutoMovieMeshTransform;
}
