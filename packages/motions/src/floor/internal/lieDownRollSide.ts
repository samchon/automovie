import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";

/*
 * The side a lateral lie rolls to: left for `lateralLeft`, right for
 * `lateralRight`, none otherwise.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `rollSide`.
 */
export function lieDownRollSide(
  prepared: lieDownRollSide.IPrepared,
): AutoMovieHumanSide | undefined {
  const { position }: lieDownRollSide.IPrepared = prepared;
  return position === "lateralLeft"
    ? "left"
    : position === "lateralRight"
      ? "right"
      : undefined;
}

/*
 * The `rollSide` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownRollSide {
  /*
   * What `lieDown.plan` prepared for its `rollSide`.
   */
  export interface IPrepared {
    /*
     * The `position` `lieDown.plan` prepared.
     */
    position: IAutoMovieMotionHumanLieDown.Position;
  }
}
