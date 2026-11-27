import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanPartnerClear } from "../../compose/internal/AutoMovieMotionHumanPartnerClear";
import { touchHoldRests } from "../../touch/internal/touchHoldRests";

/*
 * A place-over-head plan whose arms keep clear of the partner they dress: the
 * partner's body, over which the hands carry the loop and down to whose
 * shoulders they lower it, is both arms' obstacle at every second the course is
 * planned on (`AutoMovieMotionHumanPartnerClear`), read as the partner stands
 * then, as the partner audit reads it; the segments at either shoulder are the
 * ones the hands lie on there (`touchHoldRests`), every other one only in the
 * arms' way. A demand that leaves the arms out (the arms on their course) reads
 * neither their goals nor the partner.
 * Parameter body: The dresser's body.
 * Parameter plan: The law's plan, whose posture writes both arms' goals.
 * Parameter partner: The partner's reader.
 * Parameter start: The plan's start, film seconds.
 * Returns: The plan with each arm goal's `clear` and `rests` extended by the
 * partner's segments.
 */
export function placeOverHeadPartner(
  body: IAutoMovieMotionHumanBody,
  plan: IAutoMovieMotionHumanActionPlan,
  partner: IAutoMovieMotionHumanPerformerReader,
  start: number,
): IAutoMovieMotionHumanActionPlan {
  const shoulders: ReturnType<typeof touchHoldRests>[] = (
    ["shoulderLeft", "shoulderRight"] as const
  ).map(
    (
      region: PlaceOverHeadPartnerShouldersRegion,
    ): ReturnType<typeof touchHoldRests> =>
      touchHoldRests(partner.body, region, body.measure.hand),
  );
  return {
    ...plan,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const shown: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        channels,
        resolution,
        projection,
      );
      if (
        shown.limbs.leftArm === undefined &&
        shown.limbs.rightArm === undefined
      )
        return shown;
      const now: ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]> =
        partner.bones(start + seconds);
      const segments: IAutoMovieMotionHumanColliders.IPlaced[] =
        AutoMovieMotionHumanPartnerClear.at(partner, start + seconds);
      const lies: ReturnType<ReturnType<typeof touchHoldRests>>[] =
        shoulders.map(
          (
            read: ReturnType<typeof touchHoldRests>,
          ): ReturnType<ReturnType<typeof touchHoldRests>> => read(now),
        );
      const resting: ReturnType<ReturnType<typeof touchHoldRests>> = (
        segment: IAutoMovieMotionHumanColliders.IPlaced,
      ): boolean =>
        lies.some(
          (lie: ReturnType<ReturnType<typeof touchHoldRests>>): boolean =>
            lie(segment),
        );
      const clear: IAutoMovieMotionHumanColliders.IPlaced[] = segments.filter(
        (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          !resting(segment),
      );
      const rests: IAutoMovieMotionHumanColliders.IPlaced[] =
        segments.filter(resting);
      return AutoMovieMotionHumanPartnerClear.onto(
        AutoMovieMotionHumanPartnerClear.onto(shown, "leftArm", clear, rests),
        "rightArm",
        clear,
        rests,
      );
    },
  };
}

/*
 * The alternatives of `PlaceOverHeadPartnerShouldersRegion`'s site.
 */
type PlaceOverHeadPartnerShouldersRegion = "shoulderLeft" | "shoulderRight";
