import { STAIR_STEPS } from "../STAIR_STEPS";

/** Coat closet volume beside the stair. */
export const COAT_STORAGE = {
  x: [STAIR_STEPS.upperClosetStartX + 0.07, STAIR_STEPS.upperClosetStartX + 0.72] as const,
  frontZ: -3.51,
  top: 2.15,
  opening: { from: -4.51, to: -3.56 },
  backWallX: STAIR_STEPS.upperClosetStartX,
} as const;
