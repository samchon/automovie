import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/*
 * Rank actual elbow candidates on the original bend point's radial side. Cold
 * rankings continue reading all supplied points at every candidate; prepare
 * shares only one explicitly unchanged sweep's axis/hint geometry.
 * Parameter shoulder: World-metre shoulder point.
 * Parameter wrist: World-metre wrist point defining the swivel axis.
 * Parameter bend: World-metre point whose side of that axis the elbow takes.
 * Returns: The original legality/strain-first key inside the one-degree side
 * band and side-distance key outside it.
 */
export function AutoMovieMotionHumanBendSide(
  shoulder: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  bend: IAutoMovieVector3,
): IRank {
  return (
    candidate: AutoMovieMotionHumanBendSearch.ICandidate,
  ): AutoMovieMotionHumanBendSearch.IScore => {
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(wrist, shoulder),
    );
    const a: IAutoMovieVector3 = across(shoulder, axis, candidate.elbow);
    const b: IAutoMovieVector3 = across(shoulder, axis, bend);
    return ranked(
      Vector3.length(a) < 1e-9 || Vector3.length(b) < 1e-9
        ? 0
        : 1 - Vector3.dot(Vector3.normalize(a), Vector3.normalize(b)),
      candidate,
    );
  };
}

/*
 * Fixed radial geometry of one actual ranked elbow sweep.
 */
export namespace AutoMovieMotionHumanBendSide {
  /*
   * The ranking of one sweep about a fixed shoulder, wrist and hint: the axis
   * and the hint's unit across it are computed once, and each candidate's elbow
   * is projected and scored as the cold ranking does.
   */
  export function prepare(
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    bend: IAutoMovieVector3,
  ): IRank {
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(wrist, shoulder),
    );
    const hint: IAutoMovieVector3 = across(shoulder, axis, bend);
    const unit: IAutoMovieVector3 | undefined =
      Vector3.length(hint) < 1e-9 ? undefined : Vector3.normalize(hint);
    return (
      candidate: AutoMovieMotionHumanBendSearch.ICandidate,
    ): AutoMovieMotionHumanBendSearch.IScore => {
      const a: IAutoMovieVector3 = across(shoulder, axis, candidate.elbow);
      if (unit === undefined || Vector3.length(a) < 1e-9)
        return ranked(0, candidate);
      return ranked(1 - Vector3.dot(Vector3.normalize(a), unit), candidate);
    };
  }
}

/*
 * The existing actual candidate-to-score function type.
 */
type IRank = (
  candidate: AutoMovieMotionHumanBendSearch.ICandidate,
) => AutoMovieMotionHumanBendSearch.IScore;

/*
 * Original subtraction followed by removal of the component along the axis.
 */
function across(
  shoulder: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  const v: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
  return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
}

/*
 * Original side-band lexicographic score, allocating an independent wrapper.
 */
function ranked(
  side: number,
  candidate: AutoMovieMotionHumanBendSearch.ICandidate,
): AutoMovieMotionHumanBendSearch.IScore {
  return side <= SIDE
    ? { overshoot: candidate.overshoot, deviation: candidate.strain + side }
    : { overshoot: 1e9 * (1 + side), deviation: 0 };
}

/*
 * Original one-degree sweep band's one-minus-cosine discrepancy.
 */
const SIDE: number = 1 - Math.cos(Math.PI / 180);
