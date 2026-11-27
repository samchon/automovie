import type {
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanTouch,
} from "@automovie/interface";

/*
 * Two facing partners within arm's reach each rest their right palm on the
 * other's left shoulder, then return their hands. Pass to `AutoMovieMotionHumanChain.mutual`
 * with the `one` and `other` chains. The reaches start together and each palm
 * stays through the touch law's contact phase and the nominal `hold` dwell in
 * seconds. The touch law can stretch the dwell with the rest of the action. The
 * touch law fits the arms and refuses targets out of reach.
 *
 * Yahiro et al. (2026) studied face-to-face palm contact on the shoulder in
 * greetings and comforting gestures. Reciprocity and the default one-second
 * hold are staging choices. https://doi.org/10.5100/jje.62.75
 */
export const shoulderClasp: IAutoMovieMotionHumanMutual<
  IAutoMovieMotionHumanTouch.IHold,
  ShoulderClasp
> = {
  name: "shoulderClasp",
  roles: ["one", "other"],
  /*
   * Each role performs a palm hold on the opposite role's left shoulder.
   */
  act: (
    role: ShoulderClaspRole,
    params: IAutoMovieMotionHumanTouch.IHold,
    cast: Readonly<Record<CastEntryItem, string>>,
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

/*
 * The alternatives of `CastEntryItem`'s site.
 */
type CastEntryItem = "one" | "other";

/*
 * The alternatives of `ShoulderClaspRole`'s site.
 */
type ShoulderClaspRole = "one" | "other";

/*
 * The alternatives of `ShoulderClasp`'s site.
 */
type ShoulderClasp = "one" | "other";
