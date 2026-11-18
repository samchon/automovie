import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
} from "@automovie/interface";

import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { kissBody } from "./kissBody";

/**
 * Build each kiss-search candidate: the kiss's body at its full share
 * (`kissBody`, the model the displayed kiss writes), with the neck's
 * flexion and the head's turn added.
 *
 * @param body The unchanged canonical body for this synchronous search.
 * @param entry The entry posture the kiss is written over.
 * @param stance The standing placements every candidate rises from.
 * @param twist The fixed head twist, degrees.
 * @param behind The backward displacement along the entry heading, metres.
 * @param seated Whether a seat bears the body, so it neither rises nor is lowered onto the feet.
 * @returns A fresh complete candidate posture for a pitch, roll, flexion and raise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry, stance, angle and displacement units, the seated case and the fresh candidate returned.
 * @evidence contracts/development/implementation.md#principled-implementation Each candidate is the displayed kiss's own body at the full share (`kissBody`: the rise, the hips' shift, the lean and the lowering onto the planted legs) with the head's flexion and turn shared over the neck and the head, so the mouth the search scores is the mouth the figure shows.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body model, then one head addition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate skips the lowering the display applies; no angle is clamped here.
 * @evidence contracts/development/implementation.md#efficient-algorithms The head twist's share is prepared once; each candidate costs one body model, the standing lowering's leg fits included.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body model is `kissBody`, shared with the kiss's display; only the fixed twist's head share is shared across candidates.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns this reader and the twist's share until it returns; each candidate posture is fresh and nothing else is retained.
 */
export function kissPose(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  twist: number,
  behind: number,
  seated: boolean,
): (s: Pick<IAutoMovieMotionHumanKiss.ISolved, "pitch" | "roll" | "flexion" | "raise">) => IAutoMovieMotionHumanPosture {
  const turn: ReturnType<typeof AutoMovieMotionHumanHead.share> = AutoMovieMotionHumanHead.share(2, twist);
  return (s: Pick<IAutoMovieMotionHumanKiss.ISolved, "pitch" | "roll" | "flexion" | "raise">): IAutoMovieMotionHumanPosture => {
    const leaned: IAutoMovieMotionHumanPosture = kissBody(body, entry, stance, s, 1, behind, seated);
    const head: ReturnType<typeof AutoMovieMotionHumanHead.share> = AutoMovieMotionHumanHead.share(0, s.flexion);
    const held: (bone: "neck" | "head") => readonly [number, number, number] = (bone: "neck" | "head"): readonly [number, number, number] =>
      leaned.joints[bone] ?? [0, 0, 0];
    return {
      ...leaned,
      joints: {
        ...leaned.joints,
        neck: [
          held("neck")[0] + head.neck![0],
          held("neck")[1],
          held("neck")[2] + turn.neck![2],
        ],
        head: [
          held("head")[0] + head.head![0],
          held("head")[1],
          held("head")[2] + turn.head![2],
        ],
      },
    };
  };
}
