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
 * @param seated Whether a seat bears the body, so it neither rises nor is lowered onto the feet.
 * @returns A fresh complete candidate posture for a pitch, roll, flexion and raise.
 */
export function kissPose(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  twist: number,
  seated: boolean,
): (
  s: Pick<
    IAutoMovieMotionHumanKiss.ISolved,
    "pitch" | "roll" | "flexion" | "raise" | "sink" | "twist" | "shift" | "advance" | "bearing"
  >,
) => IAutoMovieMotionHumanPosture {
  const initialTurn: ReturnType<typeof AutoMovieMotionHumanHead.share> =
    AutoMovieMotionHumanHead.share(2, twist);
  return (
    s: Pick<
      IAutoMovieMotionHumanKiss.ISolved,
      "pitch" | "roll" | "flexion" | "raise" | "sink" | "twist" | "shift" | "advance" | "bearing"
    >,
  ): IAutoMovieMotionHumanPosture => {
    const turn: ReturnType<typeof AutoMovieMotionHumanHead.share> = s.twist === undefined ? initialTurn : AutoMovieMotionHumanHead.share(2, s.twist);
    const leaned: IAutoMovieMotionHumanPosture = kissBody(
      body,
      entry,
      stance,
      s,
      1,
      seated,
    );
    const head: ReturnType<typeof AutoMovieMotionHumanHead.share> =
      AutoMovieMotionHumanHead.share(0, s.flexion);
    const held: (bone: "neck" | "head") => readonly [number, number, number] = (
      bone: "neck" | "head",
    ): readonly [number, number, number] => leaned.joints[bone] ?? [0, 0, 0];
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
