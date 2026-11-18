import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";

/**
 * Turn an actual elbow hint around its shoulder-to-wrist line.
 *
 * @param props Original body/trunk/side and world wrist request, used by the canonical chain owner.
 * @param elbow Original world-metre elbow hint.
 * @param degrees Counter-clockwise degrees seen from the wrist looking toward the shoulder.
 * @returns The original borrowed elbow for a missing/degenerate chain or on-line point; otherwise a fresh world point at the same radius from the line.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines source chain/wrist, elbow units, turn sense, preserved radius and original borrowed-versus-fresh output cases.
 * @evidence contracts/development/implementation.md#principled-implementation The original Tolani shoulder-wrist swivel projects the elbow to the line, then rotates its radial vector by the unchanged cosine/sine/cross-product formula.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Original chain admission, two 1e-9 degeneracy branches, line foot and one radial rotation remain one numerical owner behind Bend.turn.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No legality claim, target replacement, radius change, branch threshold or floating-point grouping is introduced; callers still judge the turned hint through their original actual solver.
 * @evidence contracts/development/implementation.md#efficient-algorithms One original chain preparation and constant vector/scalar work per call; this extraction changes ownership without claiming a measured speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Bend.turn delegates this exact existing formula; chain preparation stays with its established actual geometry owner and no goal/result is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Releases chain geometry at synchronous return/throw; output retains no body, source request, FK reader, query/time history or handle.
 */
export function AutoMovieMotionHumanBendTurn(props: IAutoMovieMotionHumanBend.ISolve,
  elbow: IAutoMovieVector3, degrees: number): IAutoMovieVector3 {
  const chain: AutoMovieMotionHumanBendChain.IChain | null =
    AutoMovieMotionHumanBendChain.of(props.body, props.posture, props.side);
  if (chain === null) return elbow;
  const axis: IAutoMovieVector3 = Vector3.subtract(
    props.point,
    chain.shoulder,
  );
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
