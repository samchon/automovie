import { WallTop } from "./WallTop";
import { WallFaceSplit } from "./WallFaceSplit";

/** The top policy of the length interval [from,to] and the surface owners of the low and high long faces. */

export interface WallSegment {
  /** Start of the interval along the wall. */
  from: number;
  /** End of the interval along the wall. */
  to: number;
  /** Surface owner of the long face on the lower-coordinate side. */
  low: string;
  /** Surface owner of the long face on the higher-coordinate side. */
  high: string;
  /** How the wall ends at its top over this interval. */
  top: WallTop;
  /** Roof-line split of the lower-side face. */
  lowSplit?: WallFaceSplit;
  /** Roof-line split of the higher-side face. */
  highSplit?: WallFaceSplit;
}
