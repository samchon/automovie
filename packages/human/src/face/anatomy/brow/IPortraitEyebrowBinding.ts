/** Ordered lower and upper host-skin boundaries of one complete eyebrow band.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowBinding {
  /** Anatomical side of the registered implantation band, independent of coordinates. */
  side: "left" | "right";
  /** Source indices from medial head to lateral tail. */
  upper: number[];
  /** Same anatomical direction as the upper row. */
  lower: number[];
}
