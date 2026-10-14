import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieChainBone } from "./IAutoMovieChainBone";
import { IAutoMovieHingedArticulation } from "./IAutoMovieHingedArticulation";
import { aimRotation } from "./aimRotation";

const RAD2DEG: number = 180 / Math.PI;

/**
 * Swivel resolution of the candidate sweep, in degrees.
 *
 * Every candidate lands the effector on the same point, so the step decides
 * only which of the equally exact poses is chosen, never how close the hand
 * gets. One degree gives 360 candidates per bend branch, and the solve runs
 * once per authored action rather than per frame.
 */
const SWIVEL_STEP: number = 1;

/** Below this the mid joint cannot change the chain's span at all. */
const SPAN_EPSILON: number = 1e-9;

/**
 * Two-bone arm IK whose mid joint bends only about its own flexion hinge, with
 * the chain root's free swivel spent on the rig's range of motion.
 *
 * The elbow rotates by `θ` about `hinge` alone, so its abduction and twist
 * decompose to zero, which is what an elbow's immobile axes require, and the
 * bend plane is the hinge's own plane. Splitting the far segment into the part
 * along the hinge and the part it swings gives the root-to-effector span
 *
 *     |m(θ)|² = k + α·cos θ + β·sin θ
 *
 * so the span equals the target distance where `R·cos(θ − φ) = distance² − k`,
 * with `R = hypot(α, β)` and `φ = atan2(β, α)`: an arccos whose two roots are
 * the chain's two bend branches. A target outside the reachable span takes the
 * fully extended or fully folded root, so the effector stops on the reachable
 * shell along the line to the target.
 *
 * The root joint first aims `m(θ)` at the target, then any extra rotation
 * about `m(θ)` leaves the effector where it is. The function sweeps that swivel
 * in `SWIVEL_STEP` increments on each branch and keeps the candidate with the
 * least `overshoot`, compared exactly, then the least `deviation`, both from
 * `score`. The caller owns the decomposition and the rig's ROM, so the
 * geometry here holds no rig policy.
 *
 * Returns `null` for a degenerate chain: a mid or end offset shorter than
 * `1e-6`, a target within `1e-6` of the chain root, a hinge shorter than
 * `1e-6`, or `R` below `1e-9`, a hinge parallel to the far segment that cannot
 * change the span ({@link armChainFault} reports that rig).
 *
 * @evidence contracts/common.md#principled-implementation The span is an exact sinusoid in the hinge angle because a rotation about `hinge` leaves the along-hinge part of the far segment fixed and turns the rest in a circle, so its two arccos roots are the only hinge angles reaching the target distance; the swivel about `m(θ)` is an exact null space of the effector position, which is why scoring candidates on ROM costs no accuracy; legality is compared exactly because a tolerance band once let a candidate 1e-12 degrees past a limit tie a legal one and win on deviation.
 * @evidence contracts/common.md#clear-and-simple-design Pure chain geometry with the ROM policy injected through `score`, so `reachPose` owns the clinical decomposition and constraints while this function owns the branches and the sweep; the shared `aimRotation` aims the root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rig, side or target is special-cased; the degeneracy thresholds are the engine's shared length scale, and a chain that cannot reach legally returns its least overshoot instead of being clamped into range.
 * @evidence contracts/common.md#meaningful-documentation States the hinge-only elbow, the span formula and its branches, the out-of-span behavior, the swivel sweep and its ordering, who owns scoring, every `null` case with its threshold, and each input's frame.
 * @evidence contracts/performance.md#efficient-algorithms At most two branches times 360 swivel steps, each one quaternion product plus one `score` call, so cost is constant per solve and dominated by `score`; the step is a resolution choice among equally exact poses, and the solve runs once per authored arm action.
 * @evidence contracts/performance.md#reuse-equivalent-work Each hinge branch computes its mid direction and aim once for the whole swivel sweep; scores cannot be shared because the caller evaluates distinct shoulder rotations under its own constraints.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps only the current best candidate during the sweep and retains nothing after it; the caller owns the returned rotations.
 * @author Samchon
 */
export const hingedArmArticulation: (props: {
  upper: IAutoMovieChainBone;
  midOffset: IAutoMovieVector3;
  midRest: IAutoMovieQuaternion;
  endOffset: IAutoMovieVector3;
  hinge: IAutoMovieVector3;
  target: IAutoMovieVector3;
  score: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ) => { overshoot: number; deviation: number };
}) => IAutoMovieHingedArticulation | null = (props: {
  /** Chain-root bone (the shoulder) resolved under the rig's rest FK. */
  upper: IAutoMovieChainBone;

  /** Mid bone's rest offset from the chain root, in the root's bone frame. */
  midOffset: IAutoMovieVector3;

  /** Mid bone's rest rotation relative to the chain root. */
  midRest: IAutoMovieQuaternion;

  /** Effector's rest offset from the mid joint, in the mid bone's frame. */
  endOffset: IAutoMovieVector3;

  /** The mid joint's flexion axis in the mid bone's frame; any length. */
  hinge: IAutoMovieVector3;

  /** World target the effector should land on. */
  target: IAutoMovieVector3;

  /**
   * Score one candidate's bone-local root and mid rotations: `overshoot` is
   * the total ROM overshoot in degrees, compared first, and `deviation` the
   * effort tie-break, compared second. The caller owns the decomposition
   * convention and the rig's constraints.
   */
  score: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ) => { overshoot: number; deviation: number };
}): IAutoMovieHingedArticulation | null => {
  const root: IAutoMovieVector3 = props.upper.worldPosition;
  const midOffset: IAutoMovieVector3 = props.midOffset;
  const endOffset: IAutoMovieVector3 = props.endOffset;
  if (Vector3.length(midOffset) < 1e-6 || Vector3.length(endOffset) < 1e-6)
    return null;

  const reach: IAutoMovieVector3 = Vector3.subtract(props.target, root);
  const distance: number = Vector3.length(reach);
  if (distance < 1e-6) return null;

  const hingeLength: number = Vector3.length(props.hinge);
  if (hingeLength < 1e-6) return null;
  const hinge: IAutoMovieVector3 = Vector3.normalize(props.hinge);

  // |m(θ)|² = k + α cos θ + β sin θ, with the far segment split into the part
  // the hinge cannot move (along the hinge) and the part it swings.
  const along: number = Vector3.dot(hinge, endOffset);
  const swung: IAutoMovieVector3 = Vector3.subtract(
    endOffset,
    Vector3.scale(hinge, along),
  );
  const radius: number = Vector3.length(swung);
  const rotated: (vector: IAutoMovieVector3) => IAutoMovieVector3 = (
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 => Quaternion.rotateVector(props.midRest, vector);
  const k: number =
    Vector3.dot(midOffset, midOffset) +
    Vector3.dot(endOffset, endOffset) +
    2 * along * Vector3.dot(midOffset, rotated(hinge));
  let alpha: number = 0;
  let beta: number = 0;
  if (radius >= SPAN_EPSILON) {
    const unit: IAutoMovieVector3 = Vector3.scale(swung, 1 / radius);
    alpha = 2 * radius * Vector3.dot(midOffset, rotated(unit));
    beta =
      2 * radius * Vector3.dot(midOffset, rotated(Vector3.cross(hinge, unit)));
  }
  const span: number = Math.hypot(alpha, beta);
  if (span < SPAN_EPSILON) return null;

  const phase: number = Math.atan2(beta, alpha);
  const ratio: number = (distance * distance - k) / span;
  // Outside the span the chain clamps to its extreme, so the effector stops on
  // the reachable shell pointing at the target rather than failing.
  const branches: number[] =
    ratio >= 1
      ? [phase]
      : ratio <= -1
        ? [phase + Math.PI]
        : [phase + Math.acos(ratio), phase - Math.acos(ratio)];

  const goal: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(props.upper.worldRotation),
    reach,
  );

  let best: (IAutoMovieHingedArticulation & { deviation: number }) | null =
    null;
  for (const theta of branches) {
    const lower: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      hinge,
      theta * RAD2DEG,
    );
    const mid: IAutoMovieVector3 = Vector3.add(
      midOffset,
      rotated(Quaternion.rotateVector(lower, endOffset)),
    );
    const aim: IAutoMovieQuaternion = aimRotation(mid, goal);
    const swivelAxis: IAutoMovieVector3 = Vector3.normalize(mid);
    for (let step: number = 0; step * SWIVEL_STEP < 360; ++step) {
      const upper: IAutoMovieQuaternion = Quaternion.multiply(
        aim,
        Quaternion.fromAxisAngle(swivelAxis, step * SWIVEL_STEP),
      );
      const { overshoot, deviation }: { overshoot: number; deviation: number } =
        props.score(upper, lower);
      // Legality is compared EXACTLY, with no tolerance band. A band let a
      // candidate sitting one part in 1e12 outside a limit count as tied with a
      // strictly legal one and then win on deviation, so the solve returned a
      // pose the gate refuses by 1.5e-12 of a degree. The deviation prior pulls
      // toward the ROM box's edges, which is precisely where that happens, so
      // the ordering has to put "inside the box" ahead of "closer to neutral"
      // without qualification.
      if (
        best === null ||
        overshoot < best.overshoot ||
        (overshoot === best.overshoot && deviation < best.deviation)
      )
        best = { upper, lower, overshoot, deviation };
    }
  }
  // `branches` is never empty and the sweep always scores at least one
  // candidate, so `best` is assigned by here.
  const chosen: IAutoMovieHingedArticulation & { deviation: number } = best!;
  return {
    upper: chosen.upper,
    lower: chosen.lower,
    overshoot: chosen.overshoot,
  };
};
