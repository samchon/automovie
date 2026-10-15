
import { MAIN_OUTLINE } from "./MAIN_OUTLINE";

const STAIR_PLAN = {
  west: -1.8,
  turnX: -0.65,
  east: 1.87,
  back: -4.56,
  turnZ: -3.41,
  front: -0.25,
  guardReserve: 0.075,
} as const;

/** The finished L void and its back guard band are the stair owner's shared plan. */
export const STAIR_OPENING = {
  ...STAIR_PLAN,
  guardBack: STAIR_PLAN.back - MAIN_OUTLINE.partition,
  outline: [
    { x: STAIR_PLAN.west, z: STAIR_PLAN.back },
    { x: STAIR_PLAN.east, z: STAIR_PLAN.back },
    { x: STAIR_PLAN.east, z: STAIR_PLAN.turnZ },
    { x: STAIR_PLAN.turnX, z: STAIR_PLAN.turnZ },
    { x: STAIR_PLAN.turnX, z: STAIR_PLAN.front },
    { x: STAIR_PLAN.west, z: STAIR_PLAN.front },
  ],
} as const;
