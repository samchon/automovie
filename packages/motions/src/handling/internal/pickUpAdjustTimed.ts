import { minimumJerk } from "@automovie/engine";

/**
 * The time share at which a minimum-jerk progress has gone a share of its way
 * (`minimumJerk.time`).
 */
export const pickUpAdjustTimed: typeof minimumJerk.time = minimumJerk.time;
