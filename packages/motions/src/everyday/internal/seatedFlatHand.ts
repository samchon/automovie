import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanHand } from "../../compose/internal/AutoMovieMotionHumanHand";

/*
 * A seated hand laid flat by a share: the flat shape with its thumb's
 * metacarpal turned by the body's flat-thumb twist
 * (`IAutoMovieMotionHumanBody.flatThumb`), so a palm laid on a thigh or an
 * armrest does not drive its thumb into it.
 * Parameter body: The body.
 * Parameter posture: The posture to write the hand into.
 * Parameter side: The hand.
 * Parameter share: 0 for the posture's own fingers to 1 for the flat hand.
 * Returns: The posture with the hand's fingers written.
 */
export function seatedFlatHand(
  body: Pick<IAutoMovieMotionHumanBody, "flatThumb">,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  share: number,
): IAutoMovieMotionHumanPosture {
  const flat: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanHand.shape({
    side,
    shape: "flat",
    from: 0,
    to: 1,
    weight: (): number => share,
  });
  const shown: IAutoMovieMotionHumanPosture = flat.write(posture, 0);
  const turn: number = body.flatThumb[side];
  if (turn === 0) return shown;
  const thumb: AutoMovieHumanoidBone = `${side}ThumbMetacarpal`;
  const angle: readonly [number, number, number] = shown.joints[thumb]!;
  return {
    ...shown,
    joints: {
      ...shown.joints,
      [thumb]: [angle[0], angle[1], angle[2] + turn * share],
    },
  };
}
