import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieChainBone } from "./IAutoMovieChainBone";
import { IAutoMovieHingedArticulation } from "./IAutoMovieHingedArticulation";
import { IAutoMovieSwivelNear } from "./IAutoMovieSwivelNear";
import { hingedArmSwivel } from "./hingedArmSwivel";

/** The sweep's swivel step, degrees (`hingedArmSwivel.STEP`). */
const SWIVEL_STEP: number = hingedArmSwivel.STEP;

/** The golden-section ratio (`hingedArmSwivel.GOLDEN`). */
const GOLDEN: number = hingedArmSwivel.GOLDEN;

/** Golden-section passes per refinement (`hingedArmSwivel.REFINEMENTS`). */
const REFINEMENTS: number = hingedArmSwivel.REFINEMENTS;

/**
 * Two positive overshoots closer than this, in degrees, are one overshoot.
 *
 * An overshoot is read off a clinical decomposition whose rounding is near
 * 1e-13 degree, and a part of it may not depend on the swivel at all: a
 * straight arm's swivel only turns the upper arm about its own length, so
 * its flexion and abduction, and their excess past a limit, are the same for
 * every candidate except in their last digits. Compared exactly, those
 * digits ranked the swivels ahead of the deviation, and a request mirrored
 * left to right, whose rounding is not mirrored, chose a twist 14 degrees
 * away. Zero stays exact, so a candidate past a limit by any amount never
 * ties a legal one.
 */
const OVERSHOOT_ROUNDING: number = 1e-9;

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
 * `overshoot` (legal, zero, ahead of any other exactly; two positive ones
 * tied within the decomposition's rounding, `OVERSHOOT_ROUNDING`), then the
 * least `deviation`, both from
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
 * A caller that can certify swivels its score refuses (`excluded`) spares
 * their scoring, and the pose is still the full sweep's. A step is skipped
 * when every swivel within two steps of it is refused, and a step whose
 * bracket, a step either way, is refused is not refined; every other step is
 * scored and compared with its true neighbours, since a step that is not
 * skipped and could be refined has both neighbours scored. When the pruned
 * sweep finds a legal candidate, the full sweep's answer is that candidate:
 * a refused swivel, a step or a refinement inside a refused bracket, is
 * never legal, so it can never be ahead of a legal candidate (legality is
 * compared exactly); every legal candidate of the full sweep is a scored
 * step or the refinement of a step that is scored with the same neighbours,
 * so it is the same candidate in both; and the ordering among legal
 * candidates, met in the same order, is the same. When the pruned sweep
 * finds none, the full sweep decides, so a chain that cannot reach legally
 * still returns its least overshoot.
 *
 * A caller continuing a fit of a nearby target (`near`) skips the sweep: the
 * seed's branch, its swivel refined within one step either way by the same
 * golden-section search under the same ordering, to the seed's `tolerance`
 * (`IAutoMovieSwivelNear`). Every result names its branch and swivel, the
 * seed a nearby fit continues from.
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
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two branches times 360 swivel steps plus 42 refinement probes per local minimum of a sweep (one more for each tied pass, at most 82), each one quaternion product plus one `score` call, so cost is bounded per solve and dominated by `score`; a level sweep refines nothing, and the step is a resolution choice among equally exact poses. A continued fit scores only its refinement, two probes and log(tolerance / 2 STEP) / log(GOLDEN) passes, 25 at the 3.8e-5 degrees a velocity read for a 0.4 s inertialization needs (`samplePoseVelocity.tolerance`). Steps a caller certifies refused are not scored, which leaves the answer the full sweep's and, when no legal candidate remains, costs one more full sweep.
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
  ) => {
    overshoot: number;
    deviation: number;
    exact?: () => number;
    tiebreak?: () => number;
  };
  excluded?: (
    upper: (swivel: number) => IAutoMovieQuaternion,
  ) => (low: number, high: number) => boolean;
  near?: IAutoMovieSwivelNear;
  tie?: number;
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
   * cannot decide. With `tie`, `tiebreak` is a second key: two deviations
   * within `tie` of each other are one, and the lesser `tiebreak` decides
   * (task priority, Siciliano and Slotine 1991: the second objective only
   * among the first's optima).
   */
  score: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ) => {
    overshoot: number;
    deviation: number;
    exact?: () => number;
    tiebreak?: () => number;
  };

  /**
   * Given the root's bone-local rotation at a swivel on one bend branch,
   * degrees, a test of whether every swivel from `low` to `high` degrees is
   * certain to score a positive `overshoot` (`boxExcludedSwivels`); omitted,
   * every step is scored. Only a certainty may be returned: the returned pose
   * is then the one the full sweep gives.
   */
  excluded?: (
    upper: (swivel: number) => IAutoMovieQuaternion,
  ) => (low: number, high: number) => boolean;

  /**
   * The seed of a fit of a nearby target to continue (`IAutoMovieSwivelNear`):
   * its branch, or the last branch when the target has fewer (two branches
   * meet at the span's ends), and its swivel refined within one step either
   * way to its tolerance, with no sweep; omitted, every swivel is swept.
   */
  near?: IAutoMovieSwivelNear;

  /**
   * How far apart two deviations may lie and still be one, the unit of
   * `deviation`, for a score with a second key (`tiebreak`); omitted, deviations
   * are compared exactly and `tiebreak` is not read.
   */
  tie?: number;
}): IAutoMovieHingedArticulation | null => {
  // The bend branches toward the target, each stopped inside the mid joint's
  // own range (`hingedArmSwivel.branches`): a hinge angle outside the range
  // stops at the nearer limit, so the effector rests on the legal shell along
  // the line to the target, as it does on the geometric shell. Of two
  // branches the one stopping nearer the target is kept; branches inside the
  // range stop nowhere and tie.
  const found: hingedArmSwivel.IStop[] | null = hingedArmSwivel.branches(props);
  if (found === null) return null;
  const stops: IBranch[] = found
    .map(
      (stop: hingedArmSwivel.IStop, branch: number): IBranch => ({
        ...stop,
        branch,
      }),
    )
    .filter(
      (stop: IBranch, index: number, all: IBranch[]): boolean =>
        all.findIndex(
          (other: IBranch): boolean => other.theta === stop.theta,
        ) === index,
    );
  const shortfall: number = Math.min(
    ...stops.map((stop: IBranch): number => stop.shortfall),
  );
  // The candidates of one branch: the chain posed at its hinge angle and a
  // swivel (`hingedArmSwivel.pose`), scored, and named by both so the chosen
  // one can seed a nearby fit.
  const prober =
    (
      stop: IBranch,
      posed: ReturnType<typeof hingedArmSwivel.pose>,
    ): ((angle: number) => IScored) =>
    (angle: number): IScored => {
      const { upper, lower } = posed(angle);
      return {
        upper,
        lower,
        shortfall: stop.shortfall,
        swivel: angle,
        branch: stop.branch,
        ...props.score(upper, lower),
      };
    };
  // Legality is compared EXACTLY, with no tolerance band. A band let a
  // candidate sitting one part in 1e12 outside a limit count as tied with a
  // strictly legal one and then win on deviation, so the solve returned a
  // pose the gate refuses by 1.5e-12 of a degree. The deviation prior pulls
  // toward the ROM box's edges, which is precisely where that happens, so
  // the ordering has to put "inside the box" ahead of "closer to neutral"
  // without qualification.
  //
  // A tie on the overshoot is decided by the deviation; two positive
  // overshoots within `OVERSHOOT_ROUNDING` tie, since what parts them is the
  // decomposition's rounding. A candidate scored
  // with a lower bound of it first tries the bound: a bound already no less
  // than the other's exact deviation decides that it is not ahead, since the
  // exact one is no smaller, and only otherwise is the exact one computed.
  // The answer is the one the exact deviations give, every time.
  const better = (a: IScored, b: IScored): boolean => {
    const tied: boolean =
      a.overshoot === b.overshoot ||
      (a.overshoot > 0 &&
        b.overshoot > 0 &&
        Math.abs(a.overshoot - b.overshoot) <= OVERSHOOT_ROUNDING);
    if (!tied) return a.overshoot < b.overshoot;
    const theirs: number = exactOf(b);
    // With a second key, deviations within `tie` of each other are one
    // deviation, and the second key decides between them.
    if (props.tie === undefined) {
      if (a.exact !== undefined && a.deviation >= theirs) return false;
      return exactOf(a) < theirs;
    }
    if (a.exact !== undefined && a.deviation > theirs + props.tie) return false;
    const mine: number = exactOf(a);
    if (Math.abs(mine - theirs) > props.tie) return mine < theirs;
    return tiebreakOf(a) < tiebreakOf(b);
  };

  // The sweep, with or without the steps `excluded` refuses: a step is
  // skipped when the swivels within two steps of it are refused, and a step
  // whose bracket (a step either way) is refused is not refined.
  const sweep = (
    excluding: boolean,
  ): { chosen: IScored | null; skipped: boolean } => {
    let chosen: IScored | null = null;
    let skipped: boolean = false;
    for (const stop of stops.filter(
      (stop: IBranch): boolean => stop.shortfall === shortfall,
    )) {
      const posed = hingedArmSwivel.pose(props, stop.theta);
      const probe: (angle: number) => IScored = prober(stop, posed);
      const refused: ((low: number, high: number) => boolean) | null =
        excluding && props.excluded !== undefined
          ? props.excluded(
              (angle: number): IAutoMovieQuaternion => posed(angle).upper,
            )
          : null;
      const swept: (IScored | null)[] = [];
      for (let step: number = 0; step * SWIVEL_STEP < 360; ++step) {
        const angle: number = step * SWIVEL_STEP;
        const out: boolean =
          refused !== null &&
          refused(angle - 2 * SWIVEL_STEP, angle + 2 * SWIVEL_STEP);
        if (out) skipped = true;
        swept.push(out ? null : probe(angle));
      }
      for (let step: number = 0; step < swept.length; ++step) {
        const at: IScored | null = swept[step]!;
        if (at === null) continue;
        const before: IScored | null =
          swept[(step + swept.length - 1) % swept.length]!;
        const after: IScored | null = swept[(step + 1) % swept.length]!;
        if (chosen === null || better(at, chosen)) chosen = at;

        // Every local minimum of the sweep is refined, not only the sweep's
        // best step: a legal sliver narrower than one step shows in the sweep
        // only as a dip of the overshoot, and of two basins the one that is
        // truly better must win, not the one whose sample fell nearer its
        // bottom. A step level with both neighbours has nothing to refine.
        if (before === null || after === null) continue;
        if (
          refused !== null &&
          refused(
            step * SWIVEL_STEP - SWIVEL_STEP,
            step * SWIVEL_STEP + SWIVEL_STEP,
          )
        )
          continue;
        if (better(before, at) || better(after, at)) continue;
        if (!better(at, before) && !better(at, after)) continue;
        const refined: IScored = refine(
          probe,
          better,
          step * SWIVEL_STEP,
          REFINEMENTS,
        );
        if (better(refined, chosen)) chosen = refined;
      }
    }
    return { chosen, skipped };
  };
  // A continued fit refines its seed on the seed's branch alone.
  if (props.near !== undefined) {
    const near: IAutoMovieSwivelNear = props.near;
    if (!(near.tolerance > 0) || !Number.isFinite(near.tolerance))
      throw new Error("A continued fit needs a positive finite tolerance");
    const branch: number = Math.min(near.branch, found.length - 1);
    const stop: IBranch = { ...found[branch]!, branch };
    const seeded: IScored = refine(
      prober(stop, hingedArmSwivel.pose(props, stop.theta)),
      better,
      near.swivel,
      Math.max(
        0,
        Math.ceil(
          Math.log(near.tolerance / (2 * SWIVEL_STEP)) / Math.log(GOLDEN),
        ),
      ),
    );
    return {
      upper: seeded.upper,
      lower: seeded.lower,
      overshoot: seeded.overshoot,
      shortfall: seeded.shortfall,
      swivel: seeded.swivel,
      branch: seeded.branch,
      deviation: exactOf(seeded),
      ...(props.tie === undefined ? {} : { second: tiebreakOf(seeded) }),
    };
  }

  // Pruned, the sweep is the full one whenever it finds a legal candidate;
  // otherwise the full sweep decides.
  const pruned: { chosen: IScored | null; skipped: boolean } = sweep(
    props.excluded !== undefined,
  );
  const chosen: IScored | null =
    pruned.chosen !== null && (pruned.chosen.overshoot === 0 || !pruned.skipped)
      ? pruned.chosen
      : sweep(false).chosen;
  // `branches` is never empty and the full sweep scores 360 candidates, so
  // `chosen` is assigned by here.
  return {
    upper: chosen!.upper,
    lower: chosen!.lower,
    overshoot: chosen!.overshoot,
    shortfall,
    swivel: chosen!.swivel,
    branch: chosen!.branch,
    deviation: exactOf(chosen!),
    ...(props.tie === undefined ? {} : { second: tiebreakOf(chosen!) }),
  };
};

/** One bend branch with its index among `hingedArmSwivel.branches`. */
interface IBranch extends hingedArmSwivel.IStop {
  /** Its index among the branches. */
  branch: number;
}

/** One scored candidate: its rotations, its ROM overshoot and its effort tie-break. */
interface IScored extends IAutoMovieHingedArticulation {
  /** The effort tie-break, compared after the overshoot; a lower bound of it when `exact` is given. */
  deviation: number;

  /** The exact tie-break, when `deviation` is only its lower bound; its value is kept in `known` once read. */
  exact?: () => number;

  /** The exact tie-break once read. */
  known?: number;

  /** The second key, compared between deviations within the sweep's `tie` of each other. */
  tiebreak?: () => number;

  /** The second key once read. */
  second?: number;
}

/** A candidate's exact tie-break, read once. */
const exactOf = (scored: IScored): number => {
  if (scored.exact === undefined) return scored.deviation;
  if (scored.known === undefined) scored.known = scored.exact();
  return scored.known;
};

/** A candidate's second key, read once; 0 without one. */
const tiebreakOf = (scored: IScored): number => {
  if (scored.tiebreak === undefined) return 0;
  if (scored.second === undefined) scored.second = scored.tiebreak();
  return scored.second;
};

/**
 * Refine the swivel between a sweep step's neighbours by golden-section
 * search (Kiefer 1953) under the sweep's own ordering, so the swivel varies
 * continuously with the target instead of in `SWIVEL_STEP` jumps.
 *
 * @param probe Scores the candidate at a swivel angle, degrees.
 * @param better Whether the first candidate is strictly ahead of the second.
 * @param angle The swivel the bracket, one step either way, is centred on, degrees.
 * @param passes The passes, each shrinking the bracket by `GOLDEN`.
 * @returns The better of the search's last two probes.
 */
const refine = (
  probe: (angle: number) => IScored,
  better: (a: IScored, b: IScored) => boolean,
  angle: number,
  passes: number,
): IScored => {
  let low: number = angle - SWIVEL_STEP;
  let high: number = angle + SWIVEL_STEP;
  let inner: number = high - GOLDEN * (high - low);
  let outer: number = low + GOLDEN * (high - low);
  let atInner: IScored = probe(inner);
  let atOuter: IScored = probe(outer);
  for (let pass: number = 0; pass < passes; ++pass) {
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
