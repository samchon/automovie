import { WallTop } from "./WallTop";
import { WallFaceSplit } from "./WallFaceSplit";

/** The top policy of the length interval [from,to] and the surface owners of the low and high long faces. */

export interface WallSegment {
  from: number;
  to: number;
  low: string;
  high: string;
  top: WallTop;
  lowSplit?: WallFaceSplit;
  highSplit?: WallFaceSplit;
}
