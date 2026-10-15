import { STAIR_RUN } from "./STAIR_RUN";
import { STOREYS } from "./STOREYS";
import { upperTreadStart } from "./upperTreadStart";

const STAIR_RISE = STOREYS.upperFloor / 18;
/** Rise, run and start positions of the stair's flights and closet. */
export const STAIR_STEPS = {
  rise: STAIR_RISE,
  run: STAIR_RUN,
  lowerStartZ: -1.45,
  approachZ: -0.85,
  landingTop: STAIR_RISE * 8,
  upperTreadStart,
  upperClosetStartX: upperTreadStart(7),
} as const;
