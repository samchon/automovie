/**
 * One fibre endpoint within the supporting brow and its signed lateral sweep.
 * A tip below its root allows an upper-band hair to converge with lower hairs.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowDirection {
  /** Tip across the brow: lower boundary zero, upper boundary one. */
  tip: number;
  /** Signed lateral bend in mm; positive points toward the anatomical tail. */
  outwardBend: number;
}
