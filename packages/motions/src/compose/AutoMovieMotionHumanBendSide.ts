import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/**
 * Rank actual elbow candidates on the original bend point's radial side.
 * Cold rankings continue reading all supplied points at every candidate;
 * prepare shares only one explicitly unchanged sweep's axis/hint geometry.
 *
 * @param shoulder World-metre shoulder point.
 * @param wrist World-metre wrist point defining the swivel axis.
 * @param bend World-metre point whose side of that axis the elbow takes.
 * @returns The original legality/strain-first key inside the one-degree side band and side-distance key outside it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines cold live inputs, prepared unchanged-point scope, world-metre coordinates, unitless radial discrepancy and original lexicographic ranking.
 * @evidence contracts/development/implementation.md#principled-implementation Projects elbow and hint across the normalized shoulder-to-wrist axis, then reads one minus their unit dot product. The original one-degree cosine band retains candidate overshoot/strain; outside it the original side key ranks behind the band.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection and rank assembly serve cold and lazy prepared paths; the prepared path separates fixed axis/hint geometry from each actual elbow without another search or score policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves original subtract/project/dot grouping, both 1e-9 line cases, normalization admission order, one-degree band, 1e9 side penalty and fresh score wrappers. Every actual candidate and original sweep/refinement remains.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cold ranks retain constant original vector work per candidate. An explicit K-candidate fixed sweep prepares axis/projection/hint length and unit at most once, while each actual elbow retains its projection/length/normalization/dot; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Search neutral and prepared strain callers keep exact shoulder/wrist/hint scalars unchanged for their synchronous ranked sweep. Public cold toward remains live. Prepared geometry initializes only at first actual candidate and stores no candidate, side value, score or fit answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous sweep owns three fixed borrowed points and at most one axis/projected-hint/unit record, released on return or throw. Scores are fresh, no FK reader, pose/time history or external handle is retained, and cold rankings retain only their three inputs.
 */
export function AutoMovieMotionHumanBendSide(shoulder: IAutoMovieVector3,
  wrist: IAutoMovieVector3, bend: IAutoMovieVector3): IRank {
  return (candidate: AutoMovieMotionHumanBendSearch.ICandidate): AutoMovieMotionHumanBendSearch.IScore => {
    const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(wrist, shoulder));
    const a: IAutoMovieVector3 = across(shoulder, axis, candidate.elbow);
    const b: IAutoMovieVector3 = across(shoulder, axis, bend);
    return ranked(Vector3.length(a) < 1e-9 || Vector3.length(b) < 1e-9 ? 0
      : 1 - Vector3.dot(Vector3.normalize(a), Vector3.normalize(b)), candidate);
  };
}

/**
 * Fixed radial geometry of one actual ranked elbow sweep.
 *
 * @evidence contracts/development/common.md#meaningful-documentation prepare requires unchanged world shoulder/wrist/hint until the synchronous sweep ends.
 * @evidence contracts/development/design.md#principled-representation Retains only the original normalized axis and projected hint, with the same unitless side discrepancy and candidate score type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing cold ranking and actual Search/Preparation consumers share one numerical projection/ranking owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No candidate subset, score, chosen elbow, solver result or tolerance is represented by preparation.
 */
export namespace AutoMovieMotionHumanBendSide {
  /**
   * Prepare lazily for one unchanged shoulder/wrist/hint sweep. The first
   * candidate retains axis admission then elbow projection then hint
   * projection; the hint's length and unit are read only when the original
   * short-circuit branches consume them. Each actual elbow and fresh score
   * remains current; the sweep releases this constant-size geometry reader.
   */
  export function prepare(shoulder: IAutoMovieVector3, wrist: IAutoMovieVector3,
    bend: IAutoMovieVector3): IRank {
    let fixed: { axis: IAutoMovieVector3; hint: IAutoMovieVector3;
      length?: number; unit?: IAutoMovieVector3 } | undefined;
    return (candidate: AutoMovieMotionHumanBendSearch.ICandidate): AutoMovieMotionHumanBendSearch.IScore => {
      const axis: IAutoMovieVector3 = fixed === undefined
        ? Vector3.normalize(Vector3.subtract(wrist, shoulder)) : fixed.axis;
      const a: IAutoMovieVector3 = across(shoulder, axis, candidate.elbow);
      fixed ??= { axis, hint: across(shoulder, axis, bend) };
      if (Vector3.length(a) < 1e-9) return ranked(0, candidate);
      fixed.length ??= Vector3.length(fixed.hint);
      if (fixed.length < 1e-9) return ranked(0, candidate);
      const unit: IAutoMovieVector3 = Vector3.normalize(a);
      fixed.unit ??= Vector3.normalize(fixed.hint);
      return ranked(1 - Vector3.dot(unit, fixed.unit), candidate);
    };
  }
}

/** The existing actual candidate-to-score function type. */
type IRank = (candidate: AutoMovieMotionHumanBendSearch.ICandidate) => AutoMovieMotionHumanBendSearch.IScore;

/** Original subtraction followed by removal of the component along the axis. */
function across(shoulder: IAutoMovieVector3, axis: IAutoMovieVector3,
  point: IAutoMovieVector3): IAutoMovieVector3 {
  const v: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
  return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
}

/** Original side-band lexicographic score, allocating an independent wrapper. */
function ranked(side: number, candidate: AutoMovieMotionHumanBendSearch.ICandidate): AutoMovieMotionHumanBendSearch.IScore {
  return side <= SIDE ? { overshoot: candidate.overshoot, deviation: candidate.strain + side }
    : { overshoot: 1e9 * (1 + side), deviation: 0 };
}

/** Original one-degree sweep band's one-minus-cosine discrepancy. */
const SIDE: number = 1 - Math.cos(Math.PI / 180);
