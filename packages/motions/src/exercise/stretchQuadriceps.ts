import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";

/**
 * Where the lifted ankle is held in the standing quadriceps stretch: the
 * least fold of the leg that brings the ankle within the same-side arm's
 * length of its shoulder.
 *
 * The knee folds from `least` degrees with the thigh hanging straight down;
 * when the knee's whole range still leaves the ankle beyond the arm, the
 * thigh swings back at the hip, up to the hip's extension range. A body whose
 * arm is short for its leg folds further, as a person does who cannot reach
 * the foot. When no fold within the ranges reaches, the deepest one is
 * returned and the hand closes as near as the arm allows.
 *
 * @param props The body, the lifted leg's side and hip joint, the same-side
 *   shoulder joint, the unit heading and the least knee flexion in degrees;
 *   points in world metres.
 * @returns The ankle, world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved, the order the two joints give in, the fallback and every input's unit.
 * @evidence contracts/development/implementation.md#principled-implementation The stretch is the knee's flexion with the hip extended; the hand must hold the ankle, so the fold is the least one the arm's length allows, read off the body's own segments.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fold function and two scans, the knee before the hip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both ends are the range table's limits, never stated angles, and an unreachable ankle is returned at the deepest fold instead of beyond a range.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most one evaluation per degree of the two ranges, each constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing computed twice; the limits come from `AutoMovieMotionHumanRange.limit`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function stretchQuadriceps(props: {
  body: IHumanBody;
  side: "left" | "right";
  hip: IAutoMovieVector3;
  shoulder: IAutoMovieVector3;
  forward: IAutoMovieVector3;
  least: number;
}): IAutoMovieVector3 {
  const m = props.body.measure;
  // A segment hanging straight down, turned back by an angle.
  const turned = (length: number, degrees: number): IAutoMovieVector3 => {
    const angle: number = (degrees * Math.PI) / 180;
    return Vector3.add(
      Vector3.scale(props.forward, -Math.sin(angle) * length),
      { x: 0, y: -Math.cos(angle) * length, z: 0 },
    );
  };
  const ankle = (flexion: number, extension: number): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.add(props.hip, turned(m.thigh, extension)),
      turned(m.shank, extension + flexion),
    );
  const reached = (point: IAutoMovieVector3): boolean =>
    Vector3.length(Vector3.subtract(point, props.shoulder)) <=
    m.upperArm + m.forearm;
  const knee: number = Math.max(
    props.least,
    AutoMovieMotionHumanRange.limit(`${props.side}LowerLeg`, "flexion") ??
      props.least,
  );
  const hip: number = Math.abs(
    AutoMovieMotionHumanRange.limit(`${props.side}UpperLeg`, "extension") ?? 0,
  );
  for (let flexion: number = props.least; flexion <= knee; flexion++)
    if (reached(ankle(flexion, 0))) return ankle(flexion, 0);
  for (let extension: number = 1; extension <= hip; extension++)
    if (reached(ankle(knee, extension))) return ankle(knee, extension);
  return ankle(knee, hip);
}
