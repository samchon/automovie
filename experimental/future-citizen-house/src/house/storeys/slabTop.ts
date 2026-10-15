/** Each storey owns its horizontal structure and finish. Cutting the stair hole
 * is rect subtraction on the source input, not a viewer clipping approximation.
 * Board membership is generated from metric pitch and clips at room/hole edges. */

import { datum } from "../datum";
import { finishDepth } from "./finishDepth";

export const slabTop = (level: 0 | 1): number =>
  datum.floors[level] - finishDepth;
