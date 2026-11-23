import type { IAutoMoviePropBox } from "./IAutoMoviePropBox";

/**
 * One axis-aligned model-local volume another prop may not occupy.
 *
 * `validatePropPlacements` refuses a blank or repeated clearance id within the
 * prop and a box that is not finite with `min < max` on every axis. It then
 * transforms the keep-out volume by the prop's staged placement and refuses it
 * when it overlaps the transformed occupancy of any other forged, uniquely
 * staged prop whose footprint is absent or finite. Boxes that only touch on a
 * face do not overlap, and a clearance is tested neither against its own prop
 * nor against building geometry.
 */
export interface IAutoMovieClearanceBox extends IAutoMoviePropBox {
  /** Stable, non-blank clearance id, unique within the prop. */
  id: string;
}
