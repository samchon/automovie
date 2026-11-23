import type { IAutoMovieMotionHumanFirearm } from "@automovie/interface";

/**
 * The reach holster preset: the right palm held on the right hip for 0.3 s, the
 * reach for the holstered firearm. The `reachHolster` row of `HumanFirearm`
 * reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanFirearm.IReachHolsterPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanFirearm.REACH_HOLSTER`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_FIREARM_REACH_HOLSTER: IAutoMovieMotionHumanFirearm.IReachHolsterPreset =
  {
    target: { kind: "self", region: "hipRight" },
    effector: "palm",
    kind: "hold",
    hand: "right",
    hold: 0.3,
  };
