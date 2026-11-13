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

/** The golden-section ratio, `(sqrt(5) - 1) / 2`, by which each refinement pass shrinks the swivel bracket. */
const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

/**
 * Golden-section passes refining the swivel inside the two-step bracket
 * around each local minimum of the sweep: 40 passes shrink the 2 degree bracket by
 * `GOLDEN ** 40`, to under 1e-8 degree.
 */
const REFINEMENTS: number = 40;

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
 * shell along the line to the target. A root outside the mid joint's own
 * `range` stops at the nearer limit in the same way, the effector resting on
 * the legal shell along that line and the result reporting the `shortfall`;
 * of two branches the one stopping nearer the target is swept, because a
 * candidate past the hinge's limit would be clamped by the caller afterwards
 * and land somewhere no candidate was scored at.
 *
 * The root joint first aims `m(θ)` at the target, then any extra rotation
 * about `m(θ)` leaves the effector where it is. The function sweeps that swivel
 * in `SWIVEL_STEP` increments on each branch, ordering candidates by the least
 * `overshoot`, compared exactly, then the least `deviation`, both from
 * `score`. Every local minimum of a sweep is then refined between its
 * neighbouring steps by golden-section search under the same ordering, and
 * the best of the sweeps and the refinements is returned. A pass whose two
 * probes tie closes the bracket onto both, so a request mirrored left to
 * right, whose probes are the same two exchanged, refines to the mirrored
 * swivel. So the chosen pose
 * follows a moving target continuously rather than in swivel steps, a legal
 * interval narrower than one step is still found from the dip it leaves in
 * the sweep, and between two basins the truly better one wins rather than the
 * one a sample happened to fall nearer the bottom of. The caller owns the
 * decomposition and the rig's ROM, so the geometry here holds no rig policy.
 *
 * Returns `null` for a degenerate chain: a mid or end offset shorter than
 * `1e-6`, a target within `1e-6` of the chain root, a hinge shorter than
 * `1e-6`, or `R` below `1e-9`, a hinge parallel to the far segment that cannot
 * change the span ({@link armChainFault} reports that rig).
 *
 * @evidence contracts/development/implementation.md#principled-implementation The span is an exact sinusoid in the hinge angle because a rotation about `hinge` leaves the along-hinge part of the far segment fixed and turns the rest in a circle, so its two arccos roots are the only hinge angles reaching the target distance; the swivel about `m(θ)` is an exact null space of the effector position, which is why scoring candidates on ROM costs no accuracy; legality is compared exactly because a tolerance band once let a candidate 1e-12 degrees past a limit tie a legal one and win on deviation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pure chain geometry with the ROM policy injected through `score`, so `reachPose` owns the clinical decomposition and constraints while this function owns the branches and the sweep; the shared `aimRotation` aims the root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rig, side or target is special-cased; the degeneracy thresholds are the engine's shared length scale, and a chain that cannot reach legally returns its least overshoot instead of being clamped into range.
 * @evidence contracts/development/common.md#meaningful-documentation States the hinge-only elbow, the span formula and its branches, the out-of-span behavior, the swivel sweep and its ordering, who owns scoring, every `null` case with its threshold, and each input's frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two branches times 360 swivel steps plus 42 refinement probes per local minimum of a sweep (one more for each tied pass, at most 82), each one quaternion product plus one `score` call, so cost is bounded per solve and dominated by `score`; a level sweep refines nothing, and the step is a resolution choice among equally exact poses.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each hinge branch computes its mid direction and aim once for the whole swivel sweep; scores cannot be shared because the caller evaluates distinct shoulder rotations under its own constraints.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps one branch's 360 scored candidates during its sweep and retains nothing after the solve; the caller owns the returned rotations.
 */
export const hingedArmArticulation: (props: {
  upper: IAutoMovieChainBone;
  midOffset: IAutoMovieVector3;
  midRest: IAutoMovieQuaternion;
  endOffset: IAutoMovieVector3;
  hinge: IAutoMovieVector3;
  target: IAutoMovieVector3;
  range?: { min: number; max: number };
  score: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ) => { overshoot: number; deviation: number; exact?: () => number };
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
   * The mid joint's legal rotation about `hinge`, radians, `min <= max` and
   * no wider than a full turn; omitted, every hinge angle is legal. A branch
   * outside it stops at the nearer limit, read around the circle from the
   * range's centre.
   */
  range?: { min: number; max: number };

  /**
   * Score one candidate's bone-local root and mid rotations: `overshoot` is
   * the total ROM overshoot in degrees, compared first, and `deviation` the
   * effort tie-break, compared second. The caller owns the decomposition
   * convention and the rig's constraints. With `exact`, `deviation` is a
   * lower bound of the tie-break and `exact` gives it exactly: a caller
   * whose tie-break ends in a costly non-negative term passes the rest as
   * the bound, and the term is computed only for a comparison the bound
   * cannot decide.
   */
  score: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ) => { overshoot: number; deviation: number; exact?: () => number };
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

  // A hinge angle outside the joint's own range stops at the nearer limit, so
  // the effector rests on the legal shell along the line to the target, as it
  // does on the geometric shell above. Of two branches the one stopping
  // nearer the target is kept; branches inside the range stop nowhere and tie.
  const range: { min: number; max: number } | undefined = props.range;
  const outside: boolean = ratio >= 1 || ratio <= -1;
  const short = (theta: number): number =>
    Math.abs(
      Math.sqrt(
        Math.max(0, k + alpha * Math.cos(theta) + beta * Math.sin(theta)),
      ) - distance,
    );
  const stops: IStop[] = branches
    .map((theta: number): IStop => {
      if (range === undefined)
        return { theta, shortfall: outside ? short(theta) : 0 };
      const centre: number = (range.min + range.max) / 2;
      const wrapped: number =
        theta - 2 * Math.PI * Math.round((theta - centre) / (2 * Math.PI));
      const legal: number = Math.min(range.max, Math.max(range.min, wrapped));
      return {
        theta: legal,
        shortfall: legal === wrapped && !outside ? 0 : short(legal),
      };
    })
    .filter(
      (stop: IStop, index: number, all: IStop[]): boolean =>
        all.findIndex((other: IStop): boolean => other.theta === stop.theta) ===
        index,
    );
  const shortfall: number = Math.min(
    ...stops.map((stop: IStop): number => stop.shortfall),
  );

  const goal: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(props.upper.worldRotation),
    reach,
  );

  // Legality is compared EXACTLY, with no tolerance band. A band let a
  // candidate sitting one part in 1e12 outside a limit count as tied with a
  // strictly legal one and then win on deviation, so the solve returned a
  // pose the gate refuses by 1.5e-12 of a degree. The deviation prior pulls
  // toward the ROM box's edges, which is precisely where that happens, so
  // the ordering has to put "inside the box" ahead of "closer to neutral"
  // without qualification.
  //
  // A tie on the overshoot is decided by the deviation. A candidate scored
  // with a lower bound of it first tries the bound: a bound already no less
  // than the other's exact deviation decides that it is not ahead, since the
  // exact one is no smaller, and only otherwise is the exact one computed.
  // The answer is the one the exact deviations give, every time.
  const better = (a: IScored, b: IScored): boolean => {
    if (a.overshoot !== b.overshoot) return a.overshoot < b.overshoot;
    const theirs: number = exactOf(b);
    if (a.exact !== undefined && a.deviation >= theirs) return false;
    return exactOf(a) < theirs;
  };

  let chosen: IScored | null = null;
  for (const { theta } of stops.filter(
    (stop: IStop): boolean => stop.shortfall === shortfall,
  )) {
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
    const probe = (angle: number): IScored => {
      const upper: IAutoMovieQuaternion = Quaternion.multiply(
        aim,
        Quaternion.fromAxisAngle(swivelAxis, angle),
      );
      return { upper, lower, shortfall, ...props.score(upper, lower) };
    };
    const swept: IScored[] = [];
    for (let step: number = 0; step * SWIVEL_STEP < 360; ++step)
      swept.push(probe(step * SWIVEL_STEP));
    for (let step: number = 0; step < swept.length; ++step) {
      const at: IScored = swept[step]!;
      const before: IScored = swept[(step + swept.length - 1) % swept.length]!;
      const after: IScored = swept[(step + 1) % swept.length]!;
      if (chosen === null || better(at, chosen)) chosen = at;

      // Every local minimum of the sweep is refined, not only the sweep's
      // best step: a legal sliver narrower than one step shows in the sweep
      // only as a dip of the overshoot, and of two basins the one that is
      // truly better must win, not the one whose sample fell nearer its
      // bottom. A step level with both neighbours has nothing to refine.
      if (better(before, at) || better(after, at)) continue;
      if (!better(at, before) && !better(at, after)) continue;
      const refined: IScored = refine(probe, better, step * SWIVEL_STEP);
      if (better(refined, chosen)) chosen = refined;
    }
  }
  // `branches` is never empty and each sweep scores 360 candidates, so
  // `chosen` is assigned by here.
  return {
    upper: chosen!.upper,
    lower: chosen!.lower,
    overshoot: chosen!.overshoot,
    shortfall,
  };
};

/** One bend branch after the hinge's range: its hinge angle and how far short of the target distance it stops. */
interface IStop {
  /** The hinge angle, radians, inside the range when one is given. */
  theta: number;

  /** Metres between the chain's span at `theta` and the target distance; `0` for a branch that reaches the distance inside the range. */
  shortfall: number;
}

/** One scored candidate: its rotations, its ROM overshoot and its effort tie-break. */
interface IScored extends IAutoMovieHingedArticulation {
  /** The effort tie-break, compared after the overshoot; a lower bound of it when `exact` is given. */
  deviation: number;

  /** The exact tie-break, when `deviation` is only its lower bound; its value is kept in `known` once read. */
  exact?: () => number;

  /** The exact tie-break once read. */
  known?: number;
}

/** A candidate's exact tie-break, read once. */
const exactOf = (scored: IScored): number => {
  if (scored.exact === undefined) return scored.deviation;
  if (scored.known === undefined) scored.known = scored.exact();
  return scored.known;
};

/**
 * Refine the swivel between a sweep step's neighbours by golden-section
 * search (Kiefer 1953) under the sweep's own ordering, so the swivel varies
 * continuously with the target instead of in `SWIVEL_STEP` jumps.
 *
 * @param probe Scores the candidate at a swivel angle, degrees.
 * @param better Whether the first candidate is strictly ahead of the second.
 * @param angle The sweep step's swivel angle, degrees.
 * @returns The better of the search's last two probes.
 */
const refine = (
  probe: (angle: number) => IScored,
  better: (a: IScored, b: IScored) => boolean,
  angle: number,
): IScored => {
  let low: number = angle - SWIVEL_STEP;
  let high: number = angle + SWIVEL_STEP;
  let inner: number = high - GOLDEN * (high - low);
  let outer: number = low + GOLDEN * (high - low);
  let atInner: IScored = probe(inner);
  let atOuter: IScored = probe(outer);
  for (let pass: number = 0; pass < REFINEMENTS; ++pass) {
    if (better(atInner, atOuter)) {
      high = outer;
      outer = inner;
      atOuter = atInner;
      inner = high - GOLDEN * (high - low);
      atInner = probe(inner);
    } else if (better(atOuter, atInner)) {
      low = inner;
      inner = outer;
      atInner = atOuter;
      outer = low + GOLDEN * (high - low);
      atOuter = probe(outer);
    } else {
      // A tie: the minimum of a unimodal score lies between the two probes,
      // so both ends close in. Keeping either side instead would send a
      // mirrored request, whose probes are these two exchanged, to the
      // opposite end of a level stretch.
      low = inner;
      high = outer;
      inner = high - GOLDEN * (high - low);
      outer = low + GOLDEN * (high - low);
      atInner = probe(inner);
      atOuter = probe(outer);
    }
  }
  return better(atOuter, atInner) ? atOuter : atInner;
};
