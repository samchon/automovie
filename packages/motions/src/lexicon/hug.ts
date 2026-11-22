import type {
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanTouch,
} from "@automovie/interface";

/**
 * A criss-cross hug between closely staged, facing partners with their heads
 * offset. Each right arm reaches around the partner's shoulder to the upper
 * back and each left arm around the waist to the lower back. Each performer's
 * hands share a hold and return to their entry poses. Use with
 * `HumanChain.mutual` and the `one` and `other` chains. The touch law fits the
 * arms to the staged bodies and may refuse an unreachable or obstructed reach.
 *
 * Dueren et al. (2021, Fig. 2) studied the criss-cross arm placement and used
 * 1, 5 and 10 second holds measured from hand contact. The `hold` parameter
 * sets the nominal touch dwell in seconds and defaults to one for a brief greeting.
 * https://doi.org/10.1016/j.actpsy.2021.103441
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the required staging, four contacts, release, reach refusal, hold units and default, and study.
 */
export const hug: IAutoMovieMotionHumanMutual<
  { hold?: number },
  "one" | "other"
> = {
  name: "hug",
  roles: ["one", "other"],
  /** Both roles hold the opposite role's back at two heights. */
  act: (
    role: "one" | "other",
    params: { hold?: number },
    cast: Readonly<Record<"one" | "other", string>>,
  ): IAutoMovieMotionHumanMutual.IAct => {
    const subject: string = cast[role === "one" ? "other" : "one"];
    return {
      name: "touch",
      params: {
        target: { kind: "person", subject, region: "upperBack" },
        other: { kind: "person", subject, region: "lowerBack" },
        hand: "right",
        effector: "palm",
        kind: "hold",
        hold: params.hold ?? 1,
      } satisfies IAutoMovieMotionHumanTouch.IParams,
    };
  },
};
