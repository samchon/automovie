import type {
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanTouch,
} from "@automovie/interface";

/**
 * Two facing partners within arm's reach each rest their right palm on the
 * other's left shoulder, then return their hands. Pass to `HumanChain.mutual`
 * with the `one` and `other` chains. The reaches start together and each palm
 * stays through the touch law's contact phase and the nominal `hold` dwell in
 * seconds. The touch law can stretch the dwell with the rest of the action. The
 * touch law fits the arms and refuses targets out of reach.
 *
 * Yahiro et al. (2026) studied face-to-face palm contact on the shoulder in
 * greetings and comforting gestures. Reciprocity and the default one-second
 * hold are staging choices. https://doi.org/10.5100/jje.62.75
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, contact sides, timing in seconds, out-of-reach rule and source.
 */
export const shoulderClasp: IAutoMovieMotionHumanMutual<
  IAutoMovieMotionHumanTouch.IHold,
  "one" | "other"
> = {
  name: "shoulderClasp",
  roles: ["one", "other"],
  /** Each role performs a palm hold on the opposite role's left shoulder. */
  act: (
    role: "one" | "other",
    params: IAutoMovieMotionHumanTouch.IHold,
    cast: Readonly<Record<"one" | "other", string>>,
  ): IAutoMovieMotionHumanMutual.IAct => ({
    name: "touch",
    params: {
      target: {
        kind: "person",
        subject: cast[role === "one" ? "other" : "one"],
        region: "shoulderLeft",
      },
      hand: "right",
      effector: "palm",
      kind: "hold",
      hold: params.hold ?? 1,
    } satisfies IAutoMovieMotionHumanTouch.IParams,
  }),
};
