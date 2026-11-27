import type { IAutoMovieHingedArmSwivel, IAutoMovieHingedArticulation, IAutoMovieQuaternion, IAutoMovieSwivelNear, IAutoMovieSwivelSeed } from "@automovie/interface";

import type { hingedArmCandidate } from "./hingedArmCandidate";
import type { AutoMovieEngineKinematicsTypes } from "../AutoMovieEngineKinematicsTypes";
import { hingedArmSwivel } from "../hingedArmSwivel";
import { hingedSwivelAhead } from "./hingedSwivelAhead";
import { hingedSwivelBounded } from "./hingedSwivelBounded";
import { hingedSwivelNear } from "./hingedSwivelNear";
import { hingedSwivelPole } from "./hingedSwivelPole";
import { hingedSwivelSwept } from "./hingedSwivelSwept";
import { refineHingedSwivel } from "./refineHingedSwivel";

/** The sweep's swivel step, degrees (`hingedArmSwivel.STEP`). */
const SWIVEL_STEP: number = hingedArmSwivel.STEP;

/** Golden-section passes per refinement (`hingedArmSwivel.REFINEMENTS`). */
const REFINEMENTS: number = hingedArmSwivel.REFINEMENTS;

/**
 * Bisections of a legality edge on a placed pole's walk (`IProps.placed`): a 3
 * degree step halved twenty times, a swivel within three millionths of a degree
 * of the edge.
 */
const EDGE_BISECTIONS: number = 20;

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
 * So the span equals the target distance where `R·cos(θ − φ) = distance² − k`,
 * with `R = hypot(α, β)` and `φ = atan2(β, α)`: an arccos whose two roots are
 * the chain's two bend branches. A target outside the reachable span takes the
 * fully extended or fully folded root, so the effector stops on the reachable
 * shell along the line to the target. A root outside the mid joint's own
 * `range` stops at the nearer limit in the same way, the effector resting on
 * the legal shell along that line and the result reporting the `shortfall`; of
 * two branches the one stopping nearer the target is swept, because a candidate
 * past the hinge's limit would be clamped by the caller afterwards and land
 * somewhere no candidate was scored at.
 *
 * The root joint first aims `m(θ)` at the target, then any extra rotation about
 * `m(θ)` leaves the effector where it is. The function sweeps that swivel in
 * `SWIVEL_STEP` increments on each branch, ordering candidates by the least
 * `overshoot` (legal, zero, ahead of any other exactly; two positive ones tied
 * within the decomposition's rounding, 1e-9 degree), then the least
 * `deviation`, both from `score`. Every local minimum of a sweep is then
 * refined between its neighbouring steps by golden-section search under the
 * same ordering, and the best of the sweeps and the refinements is returned. A
 * pass whose two probes tie closes the bracket onto both, so a request mirrored
 * left to right, whose probes are the same two exchanged, refines to the
 * mirrored swivel. So the chosen pose follows a moving target continuously
 * rather than in swivel steps, a legal interval narrower than one step is still
 * found from the dip it leaves in the sweep, and between two basins the truly
 * better one wins rather than the one a sample happened to fall nearer the
 * bottom of. The caller owns the decomposition and the rig's ROM, so the
 * geometry here holds no rig policy.
 *
 * A caller that can certify swivels its score refuses (`excluded`) spares their
 * scoring, and the pose is still the full sweep's. A step is skipped when every
 * swivel within two steps of it is refused, and a step whose bracket, a step
 * either way, is refused is not refined; every other step is scored and
 * compared with its true neighbours, since a step that is not skipped and could
 * be refined has both neighbours scored. When the pruned sweep finds a legal
 * candidate, the full sweep's answer is that candidate: a refused swivel, a
 * step or a refinement inside a refused bracket, is never legal, so it can
 * never be ahead of a legal candidate (legality is compared exactly); every
 * legal candidate of the full sweep is a scored step or the refinement of a
 * step that is scored with the same neighbours, so it is the same candidate in
 * both; and the ordering among legal candidates, met in the same order, is the
 * same. When the pruned sweep finds none, the full sweep decides, so a chain
 * that cannot reach legally still returns its least overshoot.
 *
 * A cold fit with `closed` candidates and no `tie` or `minimum` scores them
 * alone and returns the best when it is legal and `met` accepts it: where a
 * requested term is met only at isolated swivels, those are the whole
 * admissible set and no search can add to it.
 *
 * A cold fit with a `pole` and no `tie` or `minimum` searches locally from it
 * (`hingedSwivelPole`) and returns a legal result without the sweep, so it
 * follows the bend hint rather than jumping to a far, marginally better
 * swivel.
 *
 * A cold fit whose caller certifies that no candidate can pass `met` (`unmet`)
 * skips the pole start, whose result `met` would refuse.
 *
 * Each limit of the root joint is a sinusoid of the swivel, so its feasible
 * swivels are intervals in closed form, and the caller's refusal (`excluded`)
 * is their complement (Tolani, Goswami and Badler 2000, section 3.2.3). A cold
 * fit whose refusal covers every swivel of every swept branch has no legal
 * candidate, and its answer is the least overshoot: on each branch the best of
 * the swivels at which a limit is least violated (`least`, in closed form)
 * starts the local search of the full score (`hingedSwivelPole`), and the
 * better branch result answers, with no sweep. Without `least` the sweep
 * decides as before.
 *
 * A caller continuing a fit of a nearby target (`near`) skips the sweep: a
 * `closed` candidate less than a step from the seed answers when legal and met
 * (`hingedSwivelNear`), and otherwise the seed's branch, its swivel refined
 * within one step either way by the same golden-section search under the same
 * ordering, to the seed's `tolerance` (`IAutoMovieSwivelNear`). Every result
 * names its branch and swivel, the seed a nearby fit continues from. If
 * dividing a positive subnormal tolerance by the initial bracket width
 * underflows, the difference of logarithms keeps the mathematically finite
 * refinement count finite; ordinary ratios retain their original expression. A
 * placed pole (`IProps.placed`, a place the law's own elbow search chose)
 * answers at the pole where it is legal. Otherwise a continued fit walks from
 * its seed toward the pole and stops at the edge of the legal interval the seed
 * lies in, and a cold fit takes the legal swivel nearest the pole on any
 * branch, walking out from it both ways; each edge is found by swivel steps and
 * bisection on the candidate's legality. Only where no swivel is legal does the
 * sweep decide. A continued fit never leaves its seed's branch: where the
 * branch holds no legal closed-form candidate, the seed is refined as any
 * other, and its caller's course decides whether that continuation stands. With
 * certified global score minima and no second key, the first scored coarse
 * candidate ends a cold search only if its actual two keys equal both minima
 * exactly. No later candidate can be strictly ahead, so the original candidate
 * and complete-tie seed are preserved; later coarse candidates cannot use this
 * shortcut because earlier refinements precede them.
 *
 * Returns `null` for a degenerate chain: a mid or end offset shorter than
 * `1e-6`, a target within `1e-6` of the chain root, a hinge shorter than
 * `1e-6`, or `R` below `1e-9`, a hinge parallel to the far segment that cannot
 * change the span ({@link armChainFault} reports that rig).
 */
export function hingedArmArticulation(
  props: AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsHingedArmArticulationProps,
): IAutoMovieHingedArticulation | null {
  // The bend branches toward the target, each stopped inside the mid joint's
  // own range (`hingedArmSwivel.branches`): a hinge angle outside the range
  // stops at the nearer limit, so the effector rests on the legal shell along
  // the line to the target, as it does on the geometric shell. Of two
  // branches the one stopping nearer the target is kept; branches inside the
  // range stop nowhere and tie.
  const found: IAutoMovieHingedArmSwivel.IStop[] | null =
    props.prepared === undefined
      ? hingedArmSwivel.branches(props)
      : props.prepared.branches();
  if (found === null) return null;
  const pose: (theta: number) => ReturnType<typeof hingedArmSwivel.pose> =
    props.prepared === undefined
      ? (theta: number): ReturnType<typeof hingedArmSwivel.pose> =>
          hingedArmSwivel.pose(props, theta)
      : (theta: number): ReturnType<typeof hingedArmSwivel.pose> =>
          props.prepared!.pose(theta);
  const stops: IBranch[] = found
    .map(
      (stop: IAutoMovieHingedArmSwivel.IStop, branch: number): IBranch => ({
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
      posed: IAutoMovieHingedArmSwivel.IPoseResult,
    ): ((angle: number) => IScored) =>
    (angle: number): IScored => {
      const { upper, lower } = posed(angle);
      const scored: ReturnType<typeof props.score> = props.score(
        upper,
        lower,
        angle,
        posed,
      );

      // Every candidate has the same members, its lazy readings absent until
      // read (`hingedSwivelAhead` reads an absent one as undefined), rather
      // than a copy of the score's own record.
      return {
        upper,
        lower,
        shortfall: stop.shortfall,
        swivel: angle,
        branch: stop.branch,
        overshoot: scored.overshoot,
        deviation: scored.deviation,
        exact: scored.exact,
        known: undefined,
        tiebreak: scored.tiebreak,
        second: undefined,
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

  // The caller's certified refusal on a branch, built once for the solve:
  // the closed, pole and sweep stages all read the same unchanged arcs.
  const refusal = (
    branch: ISweep,
  ): ((low: number, high: number) => boolean) | null =>
    props.excluded === undefined
      ? null
      : (branch.refused ??= props.excluded(
          (angle: number): IAutoMovieQuaternion => branch.posed(angle).upper,
        ));

  // The sweep, with or without the steps `excluded` refuses
  // (`hingedSwivelSwept`). With a certified bound, branch and bound gives the
  // same choice from fewer scored steps (`hingedSwivelBounded`); the
  // first-candidate certificate is the full sweep's own, so it is tested on
  // that same candidate first, and the bounded sweep decides every other
  // case, where the full sweep makes no use of the certificate either.
  const certified: ((candidate: IScored) => boolean) | undefined =
    props.tie === undefined && props.minimum !== undefined
      ? (candidate: IScored): boolean =>
          candidate.overshoot === props.minimum!.overshoot &&
          candidate.deviation === props.minimum!.deviation &&
          hingedSwivelAhead.exact(candidate) === props.minimum!.deviation
      : undefined;
  const refine = (probe: (angle: number) => IScored, angle: number): IScored =>
    refineHingedSwivel(probe, better, angle, REFINEMENTS);
  const sweep = (
    excluding: boolean,
  ): { chosen: IScored | null; skipped: boolean } => {
    const branches: IPass[] = stops
      .filter((stop: IBranch): boolean => stop.shortfall === shortfall)
      .map((stop: IBranch): IPass => {
        const branch: ISweep = record(stop);
        return {
          probe: branch.probe,
          steps: branch.steps,
          refined: branch.refined,
          refused: excluding ? refusal(branch) : null,
          posed: branch.posed,
          record: branch,
        };
      });
    if (props.bound === undefined)
      return hingedSwivelSwept.sweep<IScored>({
        branches,
        better,
        refine,
        ...(certified === undefined ? {} : { certified }),
      });
    if (certified !== undefined) {
      const opening: { candidate: IScored | null; skipped: boolean } =
        hingedSwivelSwept.first<IScored>(branches);
      if (opening.candidate !== null && certified(opening.candidate))
        return { chosen: opening.candidate, skipped: opening.skipped };
    }
    // A seed the caller holds (`incumbent`), scored on its own swept branch:
    // where it is legal, its exact deviation starts the bounded visit's stop.
    let incumbent: number | undefined;
    const seed: IAutoMovieSwivelSeed | undefined = props.incumbent;
    if (seed !== undefined) {
      const stop: IBranch | undefined = stops.find(
        (s: IBranch): boolean =>
          s.branch === seed.branch && s.shortfall === shortfall,
      );
      const on: IPass | undefined =
        stop === undefined
          ? undefined
          : branches.find(
              (branch: IPass): boolean => branch.record === record(stop),
            );
      if (on !== undefined) {
        const candidate: IScored = on.probe(seed.swivel);
        if (candidate.overshoot === 0)
          incumbent = hingedSwivelAhead.exact(candidate);
      }
    }
    return hingedSwivelBounded.sweep<IScored>({
      ...(incumbent === undefined ? {} : { incumbent }),
      branches: branches.map(
        (branch: IPass): hingedSwivelBounded.IBranch<IScored> => ({
          probe: branch.probe,
          steps: branch.steps,
          refined: branch.refined,
          refused: branch.refused,
          bound: (branch.record.bound ??= props.bound!(
            (angle: number): IAutoMovieQuaternion => branch.posed(angle).upper,
            branch.posed,
          )),
        }),
      ),
      better,
      refine,
      ...(props.tie === undefined ? {} : { tie: props.tie }),
    });
  };
  // A chosen candidate's result, with its own branch's shortfall when continued.
  // The caller reads the answer's branch at its swivel once (`IProps.chosen`).
  const answer = (
    chosen: IScored,
    at: number = shortfall,
  ): IAutoMovieHingedArticulation => {
    props.chosen?.(pose(found[chosen.branch]!.theta), chosen.swivel);
    return {
      upper: chosen.upper,
      lower: chosen.lower,
      overshoot: chosen.overshoot,
      shortfall: at,
      swivel: chosen.swivel,
      branch: chosen.branch,
      deviation: hingedSwivelAhead.exact(chosen),
      ...(props.tie === undefined
        ? {}
        : { second: hingedSwivelAhead.second(chosen) }),
    };
  };

  // A placed pole (`IProps.placed`) is the answer where it is legal, and
  // otherwise the legal swivel nearest it: the mid joint keeps as close to
  // the place the law's own search chose as the ranges and obstructions
  // allow (Tolani, Goswami and Badler 2000, section 3.2.4), instead of the
  // sweep's best swivel anywhere, which leaves the place for the far side
  // and snaps back when the place turns legal again.
  const legal = (candidate: IScored): boolean =>
    candidate.overshoot === 0 &&
    (props.met === undefined || props.met(candidate.upper, candidate.lower));
  // The legal swivel nearest `to` walking from `from` along the shorter
  // turn: `to` itself where every step is legal, the legality edge, found by
  // bisection, where a step is not; null where `from` itself is not legal.
  const walkToward = (
    probe: (angle: number) => IScored,
    from: number,
    to: number,
  ): IPlacedEdge | null => {
    if (!legal(probe(from))) return null;
    const turn: number = to - from - 360 * Math.round((to - from) / 360);
    const sign: number = turn < 0 ? -1 : 1;
    const length: number = Math.abs(turn);
    let inside: number = 0;
    for (let d: number = SWIVEL_STEP; inside < length; d += SWIVEL_STEP) {
      const reach: number = Math.min(d, length);
      if (legal(probe(from + sign * reach))) {
        inside = reach;
        continue;
      }
      let outside: number = reach;
      for (let i: number = 0; i < EDGE_BISECTIONS; ++i) {
        const mid: number = (inside + outside) / 2;
        if (legal(probe(from + sign * mid))) inside = mid;
        else outside = mid;
      }
      break;
    }
    return {
      candidate: probe(from + sign * inside),
      distance: length - inside,
    };
  };

  // The least overshoot of a cold fit no swivel can make legal, or null
  // where the caller's analysis does not certify that or give the starts:
  // on each swept branch, the best of the swivels at which a limit is least
  // violated (`least`) starts a local search of the full score
  // (`hingedSwivelPole`, with nothing refused, since everything is), and the
  // better branch result is the answer.
  const leastOvershoot = (): IScored | null => {
    const least: typeof props.least = props.least;
    if (least === undefined || props.excluded === undefined) return null;
    const swept: IBranch[] = stops.filter(
      (stop: IBranch): boolean => stop.shortfall === shortfall,
    );
    if (
      !swept.every((stop: IBranch): boolean => refusal(record(stop))!(0, 360))
    )
      return null;
    const starts: Map<ISweep["posed"], number> = new Map();
    for (const stop of swept) {
      const branch: ISweep = record(stop);
      const swivels: readonly number[] | null = least(
        (angle: number): IAutoMovieQuaternion => branch.posed(angle).upper,
      );
      if (swivels === null || swivels.length === 0) return null;
      let best: IScored | null = null;
      for (const angle of swivels) {
        const candidate: IScored = branch.probe(angle);
        if (best === null || better(candidate, best)) best = candidate;
      }
      starts.set(branch.posed, best!.swivel);
    }
    return hingedSwivelPole.search<IScored>({
      branches: swept.map(
        (stop: IBranch): hingedSwivelPole.IBranch<IScored> => {
          const branch: ISweep = record(stop);
          return { probe: branch.probe, posed: branch.posed, refused: null };
        },
      ),
      pole: (posed: ISweep["posed"]): number | null =>
        starts.get(posed) ?? null,
      better,
      refine,
      step: SWIVEL_STEP,
    });
  };

  // A continued fit refines its seed on the seed's branch alone.
  if (props.near !== undefined) {
    const near: IAutoMovieSwivelNear = props.near;
    const branch: number = Math.min(near.branch, found.length - 1);
    const stop: IBranch = { ...found[branch]!, branch };
    const posed: ReturnType<typeof hingedArmSwivel.pose> = pose(stop.theta);

    // A continued placed fit answers at its pole where the pole is legal,
    // and otherwise follows it from the seed within the legal interval the
    // seed lies in, stopping at that interval's edge: the elbow holds the
    // edge it reached while the pole crosses a refused arc, rather than
    // leaving for the far side (Tolani, Goswami and Badler 2000, section
    // 3.2.4, the feasible swivel nearest the desired one). A seed no longer
    // legal is refined as any other.
    if (props.placed === true && props.pole !== undefined) {
      const target: number | null = props.pole(posed);
      const probe: (angle: number) => IScored = prober(stop, posed);
      if (target !== null) {
        const at: IScored = probe(target);
        if (legal(at)) return answer(at, at.shortfall);
      }
      const followed: IPlacedEdge | null =
        target === null ? null : walkToward(probe, near.swivel, target);
      if (followed !== null)
        return answer(followed.candidate, followed.candidate.shortfall);
    }

    // The search is centred on the admissible swivel nearest the seed where
    // the caller knows it (`nearest`), taken in the seed's own turn: the
    // seed itself while it stays admissible. A closed-form candidate inside
    // that bracket answers when legal and met (`hingedSwivelNear`); the
    // start is refined otherwise.
    const nearestSwivel: number | null =
      props.nearest === undefined ? null : props.nearest(posed, near.swivel);
    const turn: number =
      nearestSwivel === null ? 0 : nearestSwivel - near.swivel;
    const delta: number = turn - 360 * Math.round(turn / 360);
    const met: typeof props.met = props.met;
    const seeded: IScored = hingedSwivelNear<IScored>({
      probe: prober(stop, posed),
      better,
      near,
      ...(delta === 0 ? {} : { start: near.swivel + delta }),
      ...(props.closed !== undefined &&
      props.tie === undefined &&
      props.minimum === undefined
        ? { closed: props.closed(posed) }
        : {}),
      ...(met === undefined
        ? {}
        : {
            met: (candidate: IScored): boolean =>
              met(candidate.upper, candidate.lower),
          }),
    });
    return answer(seeded, seeded.shortfall);
  }

  // The feasible swivels of the root joint are the intervals its limits
  // leave (Tolani, Goswami and Badler 2000, section 3.2.3), and the caller's
  // certified refusal (`excluded`) is their complement in closed form. Where
  // it refuses every swivel of every swept branch, no candidate is legal and
  // the answer is the least overshoot: searched for locally from the best of
  // the swivels at which each limit is least violated (`least`), instead of
  // by the sweep, which would score every step to find the same basin.
  const infeasible: IScored | null = leastOvershoot();
  if (infeasible !== null) return answer(infeasible);

  // The closed-form candidates (`closed`): where a requested term is met only
  // at isolated swivels, those swivels are the whole admissible set, so the
  // best of them, legal and met, is the answer with no search (the analytic
  // swivel of Tolani, Goswami and Badler 2000). A continued fit refines its
  // seed first: where a term is met over an interval of swivels (an arm's
  // rotation under its forearm's twist), the candidate nearest the hint is
  // not the one nearest the fit being continued. Anything less falls through.
  if (
    props.closed !== undefined &&
    props.tie === undefined &&
    props.minimum === undefined
  ) {
    let best: IScored | null = null;
    for (const stop of stops) {
      if (stop.shortfall !== shortfall) continue;
      const branch: ISweep = record(stop);
      for (const angle of props.closed(branch.posed) ?? []) {
        const candidate: IScored = branch.probe(angle);
        if (best === null || better(candidate, best)) best = candidate;
      }
    }
    if (
      best !== null &&
      best.overshoot === 0 &&
      (props.met === undefined || props.met(best.upper, best.lower))
    )
      return answer(best);
  }

  // The pole start (`hingedSwivelPole`): a legal result is the answer; an
  // overshoot left (range or obstruction) or no side falls to the sweep.
  const unmet: typeof props.unmet = props.unmet;
  if (
    props.pole !== undefined &&
    props.tie === undefined &&
    props.minimum === undefined &&
    !(
      props.met !== undefined &&
      unmet !== undefined &&
      stops.every(
        (s: IBranch): boolean =>
          s.shortfall !== shortfall || unmet(record(s).posed),
      )
    )
  ) {
    const poled: IScored | null = hingedSwivelPole.search<IScored>({
      branches: stops
        .filter((s: IBranch): boolean => s.shortfall === shortfall)
        .map((stop: IBranch): hingedSwivelPole.IBranch<IScored> => {
          const branch: ISweep = record(stop);
          return {
            probe: branch.probe,
            posed: branch.posed,
            refused: refusal(branch),
          };
        }),
      pole: props.pole,
      better,
      refine,
      step: SWIVEL_STEP,
      ...(props.direct === true ? { direct: true } : {}),
    });
    if (
      poled !== null &&
      poled.overshoot === 0 &&
      (props.met === undefined || props.met(poled.upper, poled.lower))
    )
      return answer(poled);

    // A placed pole not legal where it lies is answered at the legal swivel
    // nearest it on any branch: each branch walked out from its pole both
    // ways, the nearest edge kept, the better candidate on a tie.
    if (props.placed === true) {
      let nearest: IPlacedEdge | null = null;
      for (const stop of stops) {
        if (stop.shortfall !== shortfall) continue;
        const branch: ISweep = record(stop);
        const target: number | null = props.pole(branch.posed);
        if (target === null) continue;
        for (const sign of [1, -1]) {
          // The walk starts at the far side of the pole and comes back to
          // it: the first legal step from the far side is the start, and
          // the edge toward the pole the candidate.
          for (let d: number = SWIVEL_STEP; d <= 180; d += SWIVEL_STEP) {
            if (nearest !== null && d - SWIVEL_STEP > nearest.distance) break;
            const from: number = target + sign * d;
            const edge: IPlacedEdge | null = walkToward(
              branch.probe,
              from,
              target,
            );
            if (edge === null) continue;
            if (
              nearest === null ||
              edge.distance < nearest.distance - 1e-9 ||
              (Math.abs(edge.distance - nearest.distance) <= 1e-9 &&
                better(edge.candidate, nearest.candidate))
            )
              nearest = edge;
            break;
          }
        }
      }
      if (nearest !== null) return answer(nearest.candidate);
    }
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
}

/**
 * A legal candidate a placed pole's walk reached and its distance from the
 * pole, degrees (`AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsHingedArmArticulationProps.placed`).
 */
interface IPlacedEdge {
  /** The candidate at the pole or at the legality edge nearest it. */
  candidate: IScored;

  /** Degrees from the pole's swivel, 0 at the pole. */
  distance: number;
}

/** One bend branch with its index (`hingedArmCandidate.IBranch`). */
type IBranch = hingedArmCandidate.IBranch;

/** Completed work on one branch (`hingedArmCandidate.ISweep`). */
type ISweep = hingedArmCandidate.ISweep;

/** One scored candidate (`hingedArmCandidate.IScored`). */
type IScored = hingedArmCandidate.IScored;

/**
 * One branch as a sweep pass reads it, with its poser and its completed-work
 * record.
 */
type IPass = hingedSwivelSwept.IBranch<IScored> & {
  posed: ISweep["posed"];
  record: ISweep;
};
