/** One actual exterior triangle corner and its generating patch coordinates.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual represented exterior-corner coordinates paired with the local parameters of their generating patch.
 * @evidence contracts/common.md#clear-and-simple-design Named members keep the represented quantities and their correspondence in one result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual represented data without a clinical default, hidden tolerance or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Member documentation preserves the numerical meaning, units and ownership required by the consumer.
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
