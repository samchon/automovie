import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanHand } from "../../compose/internal/AutoMovieMotionHumanHand";
import { bendFloorThumb } from "./bendFloorThumb";

/**
 * Open the working hand against its palmar plane as it arrives at the floor:
 * the flat shape with its thumb's metacarpal turned by the twist that clears
 * the palm (`bendFloorThumb`), both written by the same weight.
 *
 * @param body The body.
 * @param shape The posture whose root and heading the thumb is read in.
 * @param side The hand.
 * @param to The film second the hand is flat by.
 * @param weight The share of the flat hand at a film second, 0 to 1.
 * @returns The hand's writer.
 */
export function bendFloorHand(
  body: IAutoMovieMotionHumanBody,
  shape: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  to: number,
  weight: (seconds: number) => number,
): IAutoMovieMotionHumanPrimitive {
  const flat: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanHand.shape({
    side,
    shape: "flat",
    from: 0,
    to,
    weight,
  });
  const turn: number = bendFloorThumb(body, shape, side);
  if (turn === 0) return flat;
  const thumb: AutoMovieHumanoidBone = `${side}ThumbMetacarpal`;
  return {
    ...flat,
    write: (posture, seconds, previous, resolution, projection) => {
      const shown = flat.write(
        posture,
        seconds,
        previous,
        resolution,
        projection,
      );
      const angle = shown.joints[thumb]!;
      return {
        ...shown,
        joints: {
          ...shown.joints,
          [thumb]: [angle[0], angle[1], angle[2] + turn * weight(seconds)],
        },
      };
    },
  };
}
