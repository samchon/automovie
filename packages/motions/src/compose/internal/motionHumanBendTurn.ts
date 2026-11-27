import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionHumanBendChain } from "./motionHumanBendChain";

/*
 * Turn an actual elbow hint around its shoulder-to-wrist line.
 * Parameter props: Original body/trunk/side and world wrist request, used by the
 * canonical chain owner.
 * Parameter elbow: Original world-metre elbow hint.
 * Parameter degrees: Counter-clockwise degrees seen from the wrist looking toward
 * the shoulder.
 * Returns: The original borrowed elbow for a missing/degenerate chain or
 * on-line point; otherwise a fresh world point at the same radius from the
 * line.
 */
export function motionHumanBendTurn(
  props: IAutoMovieMotionHumanBend.ISolve,
  elbow: IAutoMovieVector3,
  degrees: number,
): IAutoMovieVector3 {
  const chain: motionHumanBendChain.IChain | null =
    motionHumanBendChain(props.body, props.posture, props.side);
  if (chain === null) return elbow;
  const axis: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(props.point, chain.shoulder);
  if (!(AutoMovieEngineVector3.length(axis) > 1e-9)) return elbow;
  const line: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(axis);
  const foot: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    chain.shoulder,
    AutoMovieEngineVector3.scale(
      line,
      AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(elbow, chain.shoulder), line),
    ),
  );
  const radial: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(elbow, foot);
  if (!(AutoMovieEngineVector3.length(radial) > 1e-9)) return elbow;
  const angle: number = (degrees * Math.PI) / 180;
  return AutoMovieEngineVector3.add(
    foot,
    AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(radial, Math.cos(angle)),
      AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(line, radial), Math.sin(angle)),
    ),
  );
}
