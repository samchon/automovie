import type { IAutoMovieMotionHumanFirearm } from "@automovie/interface";

/**
 * The reach holster preset: the right palm held on the right hip for 0.3 s, the
 * reach for the holstered firearm. The `reachHolster` row of `HumanFirearm`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_FIREARM_REACH_HOLSTER: IAutoMovieMotionHumanFirearm.IReachHolsterPreset =
  {
    target: { kind: "self", region: "hipRight" },
    effector: "palm",
    kind: "hold",
    hand: "right",
    hold: 0.3,
  };
