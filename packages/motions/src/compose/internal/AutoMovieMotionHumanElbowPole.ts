import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * The pole of an arm.
 * Parameter body: The body.
 * Parameter posture: The posture whose arm is read, its limb goals stripped.
 * Parameter lower: The forearm bone, whose joint is the elbow.
 * Parameter hand: The hand bone.
 * Parameter at: The hand's world point in the posture.
 * Parameter elbow: The elbow's world point in the posture.
 * Returns: The pole, world metres; the elbow itself where the flexion moves no
 * hand.
 */
export function AutoMovieMotionHumanElbowPole(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  lower: AutoMovieHumanoidBone,
  hand: AutoMovieHumanoidBone,
  at: IAutoMovieVector3,
  elbow: IAutoMovieVector3,
): IAutoMovieVector3 {
  const joint: readonly [number, number, number] = posture.joints[lower] ?? [
    0, 0, 0,
  ];
  const flexed: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, {
      ...posture,
      joints: {
        ...posture.joints,
        [lower]: [
          joint[0] + AutoMovieMotionHumanElbowPole.FLEX,
          joint[1],
          joint[2],
        ],
      },
    }),
    undefined,
    new Set<AutoMovieHumanoidBone>([hand]),
  ).get(hand)!.worldPosition;
  const swing: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(flexed, at);
  if (!(AutoMovieEngineVector3.length(swing) > 1e-9)) return elbow;
  return AutoMovieEngineVector3.add(
    elbow,
    AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.normalize(swing),
      -AutoMovieMotionHumanElbowPole.POLE * AutoMovieEngineVector3.distance(at, elbow),
    ),
  );
}

/*
 * The bend pole of an arm laid on a goal: its elbow pushed out along the
 * olecranon. A nearly straight arm's elbow lies on the line from the shoulder
 * to the hand, so as a bend hint it names no side and the arm's solve may take
 * either branch from one sample to the next, flipping the arm about that line.
 * The olecranon is the way the elbow goes as the arm bends: opposite to where
 * an elbow flexion carries the hand, read by flexing the posture's elbow `FLEX`
 * degrees.
 */
export namespace AutoMovieMotionHumanElbowPole {
  /*
   * How far the pole stands out along the olecranon, a share of the forearm
   * (provisional).
   */
  export const POLE: number = 0.5;

  /*
   * The elbow flexion read for the olecranon's direction, degrees.
   */
  export const FLEX: number = 10;
}
