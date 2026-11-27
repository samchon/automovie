import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/*
 * The walk's plants, read on the action's clock.
 *
 * Part of `HumanTravelLeaf.openDoor`'s plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `plants`.
 */
export function HumanTravelLeafPlants(
  prepared: HumanTravelLeafPlants.IPrepared,
): IAutoMovieMotionHumanContactWindow[] {
  const { standing, walked, seconds }: HumanTravelLeafPlants.IPrepared =
    prepared;
  const plants: IAutoMovieMotionHumanContactWindow[] =
    walked === null
      ? standing.contacts
      : walked.contacts
          .filter(
            (c: IAutoMovieMotionHumanContactWindow): boolean =>
              c.part === "leftFoot" || c.part === "rightFoot",
          )
          .map(
            (
              c: IAutoMovieMotionHumanContactWindow,
            ): IAutoMovieMotionHumanContactWindow => ({
              ...c,
              from: Math.min(1, (c.from * walked.duration) / seconds),
              to: Math.min(1, (c.to * walked.duration) / seconds),
            }),
          )
          .filter(
            (c: IAutoMovieMotionHumanContactWindow): boolean => c.to > c.from,
          );
  return plants;
}

/*
 * The `plants` of `HumanTravelLeaf.openDoor`'s plan and what it reads.
 */
export namespace HumanTravelLeafPlants {
  /*
   * What `HumanTravelLeaf.openDoor`'s plan prepared for its `plants`.
   */
  export interface IPrepared {
    /*
     * The standing plan.
     */
    standing: IAutoMovieMotionHumanActionPlan;

    /*
     * The walk round with the leaf, or none when standing holds.
     */
    walked: IAutoMovieMotionHumanActionPlan | null;

    /*
     * The action's seconds.
     */
    seconds: number;
  }
}
