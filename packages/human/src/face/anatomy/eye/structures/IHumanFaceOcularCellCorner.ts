/** One actual exterior triangle corner and its generating patch coordinates.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularCellCorner {
  /** Cap radial metres or sphere polar radians, according to the patch. */
  meridianParameter: number;
  /** Unwrapped azimuth radians over this triangle's actual local sector. */
  azimuthParameter: number;
  /** Actual represented head-frame position, metres, in the inspected state. */
  position: readonly number[];
}
