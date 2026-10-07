import type { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

/** One longitudinal flow witness across the root band, independent of population.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowSection {
  /** Medial-to-lateral fraction, with complete endpoint witnesses at zero and one. */
  at: number;
  /** Direction for a shaft rooted at the lower band endpoint. */
  lower: IPortraitEyebrowFlowDirection;
  /** Direction for a shaft rooted at the upper band endpoint. */
  upper: IPortraitEyebrowFlowDirection;
}
