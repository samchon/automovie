/**
 * A compact envelope of soft-tissue displacement. Lengths use millimetres.
 * Projection is a surface offset, not a measurement of fat volume or thickness.
 * Zero projection and lift retain the supplied host's existing expression.
 *
 * @author Samchon
 */
export interface IPortraitCheekVolume {
  /**
   * Optional support-centre shift [outward, up, forward] from the bound skin
   * anchor, in mm. Outward is mirrored by the anatomical side; a negative first
   * coordinate moves both cheeks towards the nose. Omission retains the anchor.
   */
  offset?: [number, number, number];

  /** Positive transverse support radius in the head frame. */
  width: number;

  /** Positive vertical support radius in the head frame. */
  height: number;

  /** Positive depth support radius; limits influence through the head. */
  reach: number;

  /** Peak anterior displacement along head Z, in mm. */
  projection: number;

  /** Peak upward displacement along head Y, in mm. */
  lift: number;
}
