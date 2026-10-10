import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";

/** The two ordered source contact trajectories read on one actual surface.
 *
 * @author Samchon
 */
export interface IHumanFaceLipMarginPoints {
  /** Original ordered upper trajectory. */
  upper: IHumanFaceLipMarginPoint[];

  /** Original ordered lower trajectory. */
  lower: IHumanFaceLipMarginPoint[];
}
