import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";

/** The record of `IStretchQuadricepsProps`'s site. */
type IStretchQuadricepsProps = {
  body: IAutoMovieMotionHumanBody;
  side: AutoMovieHumanSide;
  hip: IAutoMovieVector3;
  shoulder: IAutoMovieVector3;
  forward: IAutoMovieVector3;
  least: number;
};

/**
 * Where the lifted ankle is held in the standing quadriceps stretch: the least
 * fold of the leg that brings the ankle within the same-side arm's length of
 * its shoulder.
 *
 * The knee folds from `least` degrees with the thigh hanging straight down;
 * when the knee's whole range still leaves the ankle beyond the arm, the thigh
 * swings back at the hip, up to the hip's extension range. A body whose arm is
 * short for its leg folds further, as a person does who cannot reach the foot.
 * When no fold within the ranges reaches, the deepest one is returned and the
 * hand closes as near as the arm allows.
 *
 * @param props The body, the lifted leg's side and hip joint, the same-side
 *   shoulder joint, the unit heading and the least knee flexion in degrees;
 *   points in world metres.
 * @returns The ankle, world metres.
 */
export function stretchQuadriceps(
  props: IStretchQuadricepsProps,
): IAutoMovieVector3 {
  const m: IAutoMovieMotionHumanBody["measure"] = props.body.measure;
  // A segment hanging straight down, turned back by an angle.
  const turned: (length: number, degrees: number) => IAutoMovieVector3 = (
    length: number,
    degrees: number,
  ): IAutoMovieVector3 => {
    const angle: number = (degrees * Math.PI) / 180;
    return Vector3.add(
      Vector3.scale(props.forward, -Math.sin(angle) * length),
      { x: 0, y: -Math.cos(angle) * length, z: 0 },
    );
  };
  const hanging: IAutoMovieVector3 = turned(m.thigh, 0);
  const reach: number = m.upperArm + m.forearm;
  const ankle: (flexion: number, extension: number) => IAutoMovieVector3 = (
    flexion: number,
    extension: number,
  ): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.add(
        props.hip,
        extension === 0 ? hanging : turned(m.thigh, extension),
      ),
      turned(m.shank, extension + flexion),
    );
  const reached: (point: IAutoMovieVector3) => boolean = (
    point: IAutoMovieVector3,
  ): boolean =>
    Vector3.length(Vector3.subtract(point, props.shoulder)) <= reach;
  const knee: number = Math.max(
    props.least,
    AutoMovieMotionHumanRange.limit(`${props.side}LowerLeg`, "flexion") ??
      props.least,
  );
  const hip: number = Math.abs(
    AutoMovieMotionHumanRange.limit(`${props.side}UpperLeg`, "extension") ?? 0,
  );
  for (let flexion: number = props.least; flexion <= knee; flexion++) {
    const point: IAutoMovieVector3 = ankle(flexion, 0);
    if (reached(point)) return point;
  }
  for (let extension: number = 1; extension <= hip; extension++) {
    const point: IAutoMovieVector3 = ankle(knee, extension);
    if (reached(point)) return point;
  }
  return ankle(knee, hip);
}
