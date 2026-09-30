/**
 * One thickness-ratio witness along the right(-1) to left(+1) oral span.
 *
 * @author Samchon
 */
export interface IPortraitLipBandKnot {
  /** Ordered transverse fraction from anatomical right (-1) to left (+1). */
  at: number;

  /** Positive ratio of the current band's vertical thickness; one is identity. */
  scale: number;
}
