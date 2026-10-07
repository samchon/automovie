import type { IHumanSourceLidSeatSide } from "./IHumanSourceLidSeatSide.ts";

/**
 * `lid-seat-source-receipt.json`: the neutral lid cage re-authored onto the
 * source globe, with the dimensions it used and what it moved.
 *
 * @author Samchon
 */
export interface IHumanSourceLidSeatReceipt {
  /** Authoring rule revision. */
  revision: string;

  /** Posterior margin height that was authored, in metres. */
  posteriorClearanceMetres: number;

  /** Minimum authored bed reach; the actual discrete upper/lower arcs are recorded per side, metres. */
  medialBedMetres: number;

  /** Coordinate frame of every length and position. */
  frame: string;

  /** Both eyes. */
  sides: IHumanSourceLidSeatSide[];

  /** What this authoring does not establish. */
  qualification: string;
}
