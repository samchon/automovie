import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieChainBone } from "./IAutoMovieChainBone";
import { IAutoMovieHingedArticulation } from "./IAutoMovieHingedArticulation";
import { IAutoMovieSwivelNear } from "./IAutoMovieSwivelNear";
import type { hingedArmCandidate } from "./hingedArmCandidate";
import { hingedArmSwivel } from "./hingedArmSwivel";
import { hingedSwivelAhead } from "./hingedSwivelAhead";
import { hingedSwivelBounded } from "./hingedSwivelBounded";
import { hingedSwivelPole } from "./hingedSwivelPole";
import { refineHingedSwivel } from "./refineHingedSwivel";

/** The sweep's swivel step, degrees (`hingedArmSwivel.STEP`). */
const SWIVEL_STEP: number = hingedArmSwivel.STEP;

/** The golden-section ratio (`hingedArmSwivel.GOLDEN`). */
const GOLDEN: number = hingedArmSwivel.GOLDEN;

/** Golden-section passes per refinement (`hingedArmSwivel.REFINEMENTS`). */
const REFINEMENTS: number = hingedArmSwivel.REFINEMENTS;

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
 * tied within the decomposition's rounding, 1e-9 degree), then the
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
 * A cold fit with `closed` candidates and no `tie` or `minimum` scores them
 * alone and returns the best when it is legal and `met` accepts it: where a
 * requested term is met only at isolated swivels, those are the whole
 * admissible set and no search can add to it.
 *
 * A cold fit with a `pole` and no `tie` or `minimum` searches locally from
 * it (`hingedSwivelPole`) and returns a legal result without the sweep, so
 * it follows the bend hint rather than jumping to a far, marginally better swivel.
 *
 * A caller continuing a fit of a nearby target (`near`) skips the sweep: the
 * seed's branch, its swivel refined within one step either way by the same
 * golden-section search under the same ordering, to the seed's `tolerance`
 * (`IAutoMovieSwivelNear`). Every result names its branch and swivel, the
 * seed a nearby fit continues from. If dividing a positive subnormal tolerance
 * by the initial bracket width underflows, the difference of logarithms keeps
 * the mathematically finite refinement count finite; ordinary ratios retain
 * their original expression.
 * With certified global score minima and no second key, the first scored
 * coarse candidate ends a cold search only if its actual two keys equal both
 * minima exactly. No later candidate can be strictly ahead, so the original
 * candidate and complete-tie seed are preserved; later coarse candidates
 * cannot use this shortcut because earlier refinements precede them.
 *
 * Returns `null` for a degenerate chain: a mid or end offset shorter than
 * `1e-6`, a target within `1e-6` of the chain root, a hinge shorter than
 * `1e-6`, or `R` below `1e-9`, a hinge parallel to the far segment that cannot
 * change the span ({@link armChainFault} reports that rig).
 *
 * @evidence contracts/development/implementation.md#principled-implementation The span is an exact sinusoid in the hinge angle because rotation about hinge leaves the along-hinge segment fixed and turns the rest in a circle. Its two arccos roots give the branches and swivel is a positional null space. Legality keeps exact zero. When the original first coarse candidate's actual legality and deviation equal certified global minima and no second key exists, every later candidate can only tie or lose, so returning it preserves the original winner and seed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pure chain geometry with the ROM policy injected through `score`, so `reachPose` owns the clinical decomposition and constraints while this function owns the branches and the sweep; the shared `aimRotation` aims the root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rig, side or target is special-cased; the degeneracy thresholds are the engine's shared length scale, and a chain that cannot reach legally returns its least overshoot instead of being clamped into range.
 * @evidence contracts/development/common.md#meaningful-documentation States the hinge-only elbow, the span formula and its branches, the out-of-span behavior, the swivel sweep and its ordering, who owns scoring, every `null` case with its threshold, and each input's frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms A cold fit with `closed` candidates scores those alone, at most two a branch, and returns a legal, met best with no search. Eligible cold fits (a `pole`, no `tie`, no `minimum`) first score per branch the pole start, each downhill step and one golden refinement, returning when legal; otherwise, at most two branches times 360 swivel steps plus bounded per-minimum golden refinement remain; with a certified `bound` under exact ties, branch and bound (`hingedSwivelBounded`) scores only the steps and refines only the minima the bound cannot place behind a legal candidate, with the full sweep's choice. Near mode retains its original tolerance-derived count. An exact first-candidate global-minimum certificate ends cold search after that one actual score. Failed pruned passes reuse identical completed steps/refinements. The shared comparator may read a required exact(a) before b and prove it ahead of b's lower bound without exact(b). Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each hinge branch computes its mid direction and aim once for the solve. Within that unchanged branch/target/score, a full fallback reuses each actual step and completed refinement of the same bracket; it still compares all original candidates in their original order. An optional matching prepared target also shares source span coefficients/inverse root and this point's lowered goal. No scored answer crosses targets or solves.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A solve retains at most two branches' 360 step candidates and one selected candidate per refined step, with their branch pose/probe closures. The bounded workspace releases at return or throw; only the selected rotations escape, with no history or external handle.
 */
export const hingedArmArticulation: (props: {
  upper: IAutoMovieChainBone;
  midOffset: IAutoMovieVector3;
  midRest: IAutoMovieQuaternion;
  endOffset: IAutoMovieVector3;
  hinge: IAutoMovieVector3;
  target: IAutoMovieVector3;
  range?: { min: number; max: number };
  score: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) =>
    { overshoot: number; deviation: number; exact?: () => number; tiebreak?: () => number };
  excluded?: (upper: (swivel: number) => IAutoMovieQuaternion) => (low: number, high: number) => boolean;
  bound?: (upper: (swivel: number) => IAutoMovieQuaternion) => (low: number, high: number) => number;
  pole?: (posed: ReturnType<typeof hingedArmSwivel.pose>) => number | null;
  closed?: (posed: ReturnType<typeof hingedArmSwivel.pose>) => readonly number[] | null;
  met?: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => boolean;
  direct?: boolean;
  near?: IAutoMovieSwivelNear;
  tie?: number;
  minimum?: { overshoot: number; deviation: number };
  prepared?: hingedArmSwivel.IPreparedTarget;
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
   * among the first's optima). The score and its lazy readers describe the
   * same unchanged objective throughout this synchronous solve.
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
   * Given the root's bone-local rotation at a swivel on one bend branch,
   * degrees, a certified lower bound of the exact `deviation` of every
   * candidate at a swivel from `low` to `high` degrees; omitted, every step
   * is scored. Read only by a cold sweep with no `tie` and no `minimum`,
   * which then scores only the steps the bound cannot place behind a legal
   * candidate (`hingedSwivelBounded`), with the full sweep's choice.
   */
  bound?: (
    upper: (swivel: number) => IAutoMovieQuaternion,
  ) => (low: number, high: number) => number;

  /**
   * Given a branch's poser, the closed-form start swivel, degrees: the pole
   * (mid joint toward the hint) or a term's own minimiser; null when none.
   * A cold fit with no `tie` or `minimum` searches from it (`hingedSwivelPole`)
   * and returns a legal result that `met` accepts; otherwise the sweep decides.
   */
  pole?: (posed: ReturnType<typeof hingedArmSwivel.pose>) => number | null;

  /**
   * Given a branch's poser, every swivel on it, degrees, at which a requested
   * term that only isolated swivels can meet is met (`immobileAxisSwivels`),
   * in closed form; null or none when the analysis does not apply. A cold fit
   * with no `tie` or `minimum` scores those candidates alone and returns the
   * best when it is legal and `met` accepts it; otherwise the pole start and
   * the sweep decide as without it.
   */
  closed?: (posed: ReturnType<typeof hingedArmSwivel.pose>) => readonly number[] | null;

  /** Whether a pole-started result meets every requested term; absent, legality alone decides. */
  met?: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => boolean;

  /** Whether the score is the start's own term alone, so an unrefused start is the answer. */
  direct?: boolean;

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

  /**
   * Certified global lower bounds of every actual score in this solve;
   * omission keeps the complete search. With no second key, only the original
   * first coarse candidate may stop early after both keys equal these bounds
   * exactly. The score and all raw inputs must already be admitted; this is
   * a mathematical certificate, not a reach or convergence tolerance.
   */
  minimum?: { overshoot: number; deviation: number };

  /** Exact source/target geometry of this same unchanged chain, point and hinge range. */
  prepared?: hingedArmSwivel.IPreparedTarget;
}): IAutoMovieHingedArticulation | null => {
  // The bend branches toward the target, each stopped inside the mid joint's
  // own range (`hingedArmSwivel.branches`): a hinge angle outside the range
  // stops at the nearer limit, so the effector rests on the legal shell along
  // the line to the target, as it does on the geometric shell. Of two
  // branches the one stopping nearer the target is kept; branches inside the
  // range stop nowhere and tie.
  const found: hingedArmSwivel.IStop[] | null = props.prepared === undefined
    ? hingedArmSwivel.branches(props) : props.prepared.branches();
  if (found === null) return null;
  const pose: (theta: number) => ReturnType<typeof hingedArmSwivel.pose> =
    props.prepared === undefined
      ? (theta: number): ReturnType<typeof hingedArmSwivel.pose> => hingedArmSwivel.pose(props, theta)
      : (theta: number): ReturnType<typeof hingedArmSwivel.pose> => props.prepared!.pose(theta);
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
  const better = (a: IScored, b: IScored): boolean =>
    hingedSwivelAhead(a, b, props.tie);

  // A failed refusal pass must still run the whole sweep. Its unchanged
  // branch, step and refinement bracket have already produced the same pure
  // candidates, so retain that completed work for this solve's fallback.
  const completed: Map<IBranch, ISweep> = new Map<IBranch, ISweep>();
  const record = (stop: IBranch): ISweep => {
    let branch: ISweep | undefined = completed.get(stop);
    if (branch === undefined) {
      const posed: ReturnType<typeof hingedArmSwivel.pose> = pose(stop.theta);
      branch = {
        posed,
        probe: prober(stop, posed),
        steps: [],
        refined: new Map<number, IScored>(),
      };
      completed.set(stop, branch);
    }
    return branch;
  };

  // The sweep, with or without the steps `excluded` refuses: a step is
  // skipped when the swivels within two steps of it are refused, and a step
  // whose bracket (a step either way) is refused is not refined. With a
  // certified bound under exact ties, branch and bound gives the same choice
  // from fewer scored steps (`hingedSwivelBounded`).
  const sweep = (
    excluding: boolean,
  ): { chosen: IScored | null; skipped: boolean } => {
    const shortest: IBranch[] = stops.filter(
      (stop: IBranch): boolean => stop.shortfall === shortfall,
    );
    if (
      props.bound !== undefined &&
      props.tie === undefined &&
      props.minimum === undefined
    )
      return hingedSwivelBounded.sweep<IScored>({
        branches: shortest.map(
          (stop: IBranch): hingedSwivelBounded.IBranch<IScored> => {
            const branch: ISweep = record(stop);
            const upper: (angle: number) => IAutoMovieQuaternion = (
              angle: number,
            ): IAutoMovieQuaternion => branch.posed(angle).upper;
            return {
              probe: branch.probe,
              steps: branch.steps,
              refined: branch.refined,
              refused:
                excluding && props.excluded !== undefined
                  ? props.excluded(upper)
                  : null,
              bound: props.bound!(upper),
            };
          },
        ),
        better,
        refine: (probe: (angle: number) => IScored, angle: number): IScored =>
          refineHingedSwivel(probe, better, angle, REFINEMENTS),
      });
    let chosen: IScored | null = null;
    let skipped: boolean = false;
    let first: boolean = true;
    for (const stop of shortest) {
      const branch: ISweep = record(stop);
      const posed: ReturnType<typeof hingedArmSwivel.pose> = branch.posed;
      const probe: (angle: number) => IScored = branch.probe;
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
        if (out) swept.push(null);
        else {
          let candidate: IScored | undefined = branch.steps[step];
          if (candidate === undefined) {
            candidate = probe(angle);
            branch.steps[step] = candidate;
          }
          if (first && props.tie === undefined && props.minimum !== undefined &&
            candidate.overshoot === props.minimum.overshoot &&
            candidate.deviation === props.minimum.deviation &&
            hingedSwivelAhead.exact(candidate) === props.minimum.deviation)
            return { chosen: candidate, skipped };
          first = false;
          swept.push(candidate);
        }
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
        let refined: IScored | undefined = branch.refined.get(step);
        if (refined === undefined) {
          refined = refineHingedSwivel(
            probe, better, step * SWIVEL_STEP, REFINEMENTS,
          );
          branch.refined.set(step, refined);
        }
        if (better(refined, chosen)) chosen = refined;
      }
    }
    return { chosen, skipped };
  };
  // A chosen candidate's result, with its own branch's shortfall when continued.
  const answer = (chosen: IScored, at: number = shortfall): IAutoMovieHingedArticulation => ({
    upper: chosen.upper,
    lower: chosen.lower,
    overshoot: chosen.overshoot,
    shortfall: at,
    swivel: chosen.swivel,
    branch: chosen.branch,
    deviation: hingedSwivelAhead.exact(chosen),
    ...(props.tie === undefined ? {} : { second: hingedSwivelAhead.second(chosen) }),
  });

  // A continued fit refines its seed on the seed's branch alone.
  if (props.near !== undefined) {
    const near: IAutoMovieSwivelNear = props.near;
    if (!(near.tolerance > 0) || !Number.isFinite(near.tolerance))
      throw new Error("A continued fit needs a positive finite tolerance");
    const ratio: number = near.tolerance / (2 * SWIVEL_STEP);
    const contraction: number = ratio === 0
      ? Math.log(near.tolerance) - Math.log(2 * SWIVEL_STEP)
      : Math.log(ratio);
    const branch: number = Math.min(near.branch, found.length - 1);
    const stop: IBranch = { ...found[branch]!, branch };
    const seeded: IScored = refineHingedSwivel(prober(stop, pose(stop.theta)), better, near.swivel,
      Math.max(0, Math.ceil(contraction / Math.log(GOLDEN))));
    return answer(seeded, seeded.shortfall);
  }

  // The closed-form candidates (`closed`): where a requested term is met only
  // at isolated swivels, those swivels are the whole admissible set, so the
  // best of them, legal and met, is the answer with no search (the analytic
  // swivel of Tolani, Goswami and Badler 2000). A continued fit refines its
  // seed first: where a term is met over an interval of swivels (an arm's
  // rotation under its forearm's twist), the candidate nearest the hint is
  // not the one nearest the fit being continued. Anything less falls through.
  if (props.closed !== undefined && props.tie === undefined && props.minimum === undefined) {
    let best: IScored | null = null;
    for (const stop of stops) {
      if (stop.shortfall !== shortfall) continue;
      const branch: ISweep = record(stop);
      for (const angle of props.closed(branch.posed) ?? []) {
        const candidate: IScored = branch.probe(angle);
        if (best === null || better(candidate, best)) best = candidate;
      }
    }
    if (best !== null && best.overshoot === 0 &&
      (props.met === undefined || props.met(best.upper, best.lower))) return answer(best);
  }

  // The pole start (`hingedSwivelPole`): a legal result is the answer; an
  // overshoot left (range or obstruction) or no side falls to the sweep.
  if (props.pole !== undefined && props.tie === undefined && props.minimum === undefined) {
    const poled: IScored | null = hingedSwivelPole.search<IScored>({
      branches: stops.filter((s: IBranch): boolean => s.shortfall === shortfall).map(
        (stop: IBranch): hingedSwivelPole.IBranch<IScored> => {
          const branch: ISweep = record(stop);
          const upper: (angle: number) => IAutoMovieQuaternion = (angle: number): IAutoMovieQuaternion =>
            branch.posed(angle).upper;
          return { probe: branch.probe, posed: branch.posed,
            refused: props.excluded === undefined ? null : props.excluded(upper) };
        }),
      pole: props.pole,
      better,
      refine: (probe: (angle: number) => IScored, angle: number): IScored =>
        refineHingedSwivel(probe, better, angle, REFINEMENTS),
      step: SWIVEL_STEP,
      ...(props.direct === true ? { direct: true } : {}),
    });
    if (poled !== null && poled.overshoot === 0 &&
      (props.met === undefined || props.met(poled.upper, poled.lower))) return answer(poled);
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
  return answer(chosen!);
};

/** One bend branch with its index (`hingedArmCandidate.IBranch`). */
type IBranch = hingedArmCandidate.IBranch;

/** Completed work on one branch (`hingedArmCandidate.ISweep`). */
type ISweep = hingedArmCandidate.ISweep;

/** One scored candidate (`hingedArmCandidate.IScored`). */
type IScored = hingedArmCandidate.IScored;
