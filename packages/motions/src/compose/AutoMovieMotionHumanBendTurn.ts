import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";

/**
 * Turn an actual elbow hint around its shoulder-to-wrist line.
 *
 * @param props Original body/trunk/side and world wrist request, used by the
 *   canonical chain owner.
 * @param elbow Original world-metre elbow hint.
 * @param degrees Counter-clockwise degrees seen from the wrist looking toward
 *   the shoulder.
 * @returns The original borrowed elbow for a missing/degenerate chain or
 *   on-line point; otherwise a fresh world point at the same radius from the
 *   line.
 */
export function AutoMovieMotionHumanBendTurn(
  props: IAutoMovieMotionHumanBend.ISolve,
  elbow: IAutoMovieVector3,
  degrees: number,
): IAutoMovieVector3 {
  const chain: AutoMovieMotionHumanBendChain.IChain | null =
    AutoMovieMotionHumanBendChain(props.body, props.posture, props.side);
  if (chain === null) return elbow;
  const axis: IAutoMovieVector3 = Vector3.subtract(props.point, chain.shoulder);
  if (!(Vector3.length(axis) > 1e-9)) return elbow;
  const line: IAutoMovieVector3 = Vector3.normalize(axis);
  const foot: IAutoMovieVector3 = Vector3.add(
    chain.shoulder,
    Vector3.scale(
      line,
      Vector3.dot(Vector3.subtract(elbow, chain.shoulder), line),
    ),
  );
  const radial: IAutoMovieVector3 = Vector3.subtract(elbow, foot);
  if (!(Vector3.length(radial) > 1e-9)) return elbow;
  const angle: number = (degrees * Math.PI) / 180;
  return Vector3.add(
    foot,
    Vector3.add(
      Vector3.scale(radial, Math.cos(angle)),
      Vector3.scale(Vector3.cross(line, radial), Math.sin(angle)),
    ),
  );
}
