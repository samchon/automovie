/**
 * Group-owned aperture placement; broad body sections never refit these axes.
 *
 * @author Samchon
 */
export interface IPortraitNasalApertureFrame {
  /** Vestibular axis origin in head millimetres. */
  origin: readonly number[];

  /** Nonzero inward direction, normalized independently of the body sections. */
  inward: readonly number[];
}
