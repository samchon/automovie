import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmTrajectory,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryContactCircle } from "./HumanArmTrajectoryContactCircle";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPace as Pace } from "./HumanArmTrajectoryPace";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";
import { HumanArmTrajectoryStretch as Stretch } from "./HumanArmTrajectoryStretch";

/**
 * The work of `HumanArmTrajectory.solve`: site refinement, the optimisation on
 * the knots and the admit-split-continue loop on the frame grid, as that
 * function documents. A refused course's hold whose hand pose its law
 * prescribes is first tracked frame by frame on the swivel, the arm's one
 * freedom there (Tolani, Goswami and Badler 2000, section 3.2), and only what
 * that leaves failing is optimised. It records in `told` whether it reads the
 * mirror image, so `solve` can tell a refusal in the author's names.
 *
 * @param read The problem on given waypoints' seconds.
 * @param times The first knots' seconds, ascending, on the frame grid.
 * @param course A laid course the model refused, when one was read.
 * @param warm An earlier solution of this action on this span's seconds.
 * @param stretches Whether the span is its law's own, lengthened by a replan.
 * @param told Set when the problem is solved in its mirror image.
 * @returns Each arm's trajectory, in the problem's order, and the solution.
 * @throws {HumanRefusal} When no trajectory meets the constraints at its knots
 *   and on the frame grid.
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the mirror record and the refusal; HumanArmTrajectory.solve documents the method.
 * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's few knots with a continuous reading between them, refined where the frame-grid admission fails, as HumanArmTrajectory.solve states.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The site refinement, one optimisation, then the admit-split-continue loop; solve keeps only the mirror-name translation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A trajectory is returned only when its frame-grid reading admits it; otherwise the refusal stands. A prescribed hold's frame that no swivel clears at the exact asked attitude leaves the course as laid: the hold's task limits bound points within metres, so the optimiser trades the attitude within them, and the course's own reading refuses what they cannot hold.
 * @evidence contracts/development/implementation.md#efficient-algorithms The optimiser's variables and its rounds' readings are the knots'; refinement splits only failing intervals.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A warm solution and a laid course's reading are reused only for this action's span.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned readers retain only the setups, final times and solution state.
 */
export function planHumanArmTrajectory(
  read: (times: readonly number[]) => HumanArmTrajectory.IProblem,
  times: readonly number[],
  course: HumanArmTrajectory.IAdmitted | undefined,
  warm: HumanArmTrajectory.IState | undefined,
  stretches: boolean,
  told: HumanArmTrajectory.IMirrorTold,
): HumanArmTrajectory.ISolved {
  // The frame grid over the span, the instants the played trajectory is
  // admitted at: the course's own where one was read. The knots are
  // instants of that grid, the nearest to the caller's, so a stretch
  // refined to the end is bounded at exactly the instants it is read at.
  const grid: readonly number[] =
    course?.read.context.times ??
    Pace.uniform(times[0]!, times[times.length - 1]!);
  const snapped: number[] = Stretch.snap(grid, times);
  const first: HumanArmTrajectory.IProblem = read(
    snapped.map((g: number): number => grid[g]!),
  );
  const flip: boolean = Mirror.leftFirst(first);
  told.flip = flip;
  const reading: Stretch.Reading = flip
    ? (t: readonly number[]): HumanArmTrajectory.IProblem =>
        Mirror.mirrored(read(t))
    : read;
  const problem: HumanArmTrajectory.IProblem = flip
    ? Mirror.mirrored(first)
    : first;
  const contextOf: Stretch.ContextOf =
    course?.read.of ??
    HumanArmTrajectoryContext.prepare(
      problem.body,
      problem.arms.map(
        (arm: HumanArmTrajectory.IArm): "left" | "right" => arm.side,
      ),
    );
  const fine: M.IContext = course?.read.context ?? contextOf(reading(grid));
  const whole: Stretch.IGrid = { reading, contextOf, grid, fine };
  const initial: Stretch.IKnots = {
    knots: snapped,
    problem,
    context: contextOf(problem, fine),
  };
  // A laid course whose worst term is its speed is met by the same course
  // over a longer span: scaling time by a factor divides every speed by it
  // (Hollerbach 1984), so the span the course needs is its own times its
  // fastest probe's speed over the bound. Where the span is the law's own,
  // which a replan at a slower tempo lengthens (`stretches`), no
  // trajectory is optimised at this span for it: the caller is handed that
  // span at once, as the optimiser's refusal hands it below. A span an end
  // of which a meeting fixes is not lengthened by the tempo, so its course
  // goes to the optimiser, which may find a shorter path within it.
  if (
    stretches &&
    course !== undefined &&
    warm === undefined &&
    course.refused === "speed"
  ) {
    const span: number = fine.times[fine.n - 1]! - fine.times[0]!;
    const factor: number = Pace.slower(
      fine,
      course.read.x,
      course.read.evaluation?.placed,
    );
    if (factor > 1)
      throw new HumanRefusal({
        kind: "reach",
        axis: "duration",
        value: span,
        feasible: {
          kind: "range",
          minimum: Pace.duration(span * factor),
          maximum: null,
          unit: "s",
        },
        reason: `the laid course of the ${problem.arms.map((a: HumanArmTrajectory.IArm): string => a.side).join(" and ")} arm over the action moves faster than the law's own pace`,
        fix: "give the action more time",
      });
  }
  // A hold whose law prescribes the hand's pose at every instant (its site
  // and its asked attitude) leaves the arm one freedom an instant, the
  // elbow's swivel about the shoulder-wrist axis (Tolani, Goswami and
  // Badler 2000, section 3.2), so it is tracked, not optimised: the
  // analytic fit at each frame, its swivel the clear one nearest the frame
  // before (`HumanArmTrajectoryContactCircle`), as an animation system
  // tracks a prescribed effector path. The course's hold is that fit
  // already; from the first frame of a prescribed hold the course fails at,
  // the rest of that hold is tracked again. A frame where no swivel clears
  // the exact attitude, or none within a step of the frame before, leaves
  // the course as it was laid: the hold's task limits bound points within
  // metres of the asked frame, never the attitude exactly, so the optimiser
  // may trade it within them, and the course's own reading refuses what
  // they cannot hold.
  const tracked = (
    laid: HumanArmTrajectory.IAdmitted,
    verdict: M.IEvaluation,
  ): HumanArmTrajectory.IAdmitted => {
    if (fine.still) return laid;
    const x: number[][][] = laid.read.x.map((arm: number[][]): number[][] => [
      ...arm,
    ]);
    const changed: boolean[] = new Array<boolean>(fine.n).fill(false);
    for (let g: number = 1; g < fine.n; ++g) {
      if (!verdict.failing[g] || !prescribed(fine, g)) continue;
      // The tracking leaves the hold's frame before; at the hold's first
      // frame, the clear swivel nearest the course's own.
      let k: number = g;
      if (!prescribed(fine, g - 1)) {
        for (let a: number = 0; a < x.length; ++a) {
          const clear: number[] | undefined = entered(fine, a, k, x);
          // No swivel clears the exact asked pose: the course stays as laid.
          if (clear === undefined) return laid;
          x[a]![k] = clear;
        }
        changed[k++] = true;
      }
      for (; k < fine.n && prescribed(fine, k); ++k) {
        for (let a: number = 0; a < x.length; ++a) {
          const next: number[] | undefined = HumanArmTrajectoryContactCircle(
            fine,
            a,
            k,
            x[a]![k - 1]!,
            k - 1,
          )[0];
          // None clears the exact asked pose, or none within a step of the
          // frame before: the course stays as laid.
          if (next === undefined) return laid;
          x[a]![k] = next;
        }
        changed[k] = true;
      }
      g = k;
    }
    if (!changed.some((c: boolean): boolean => c)) return laid;
    const evaluation: M.IEvaluation = M.evaluate(fine, x, {
      reading: verdict,
      laid: changed,
    });
    return {
      trajectories: problem.arms.map(
        (
          _: HumanArmTrajectory.IArm,
          a: number,
        ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(fine.setups, fine.times, x, a),
      ),
      admitted: evaluation.worst.value <= M.TOLERANCE,
      refused:
        evaluation.worst.value <= M.TOLERANCE ? "" : evaluation.worst.term,
      read: { ...laid.read, x, evaluation },
    };
  };

  // The closed form first: a laid course is kept wherever the model admits
  // it, and only the stretches it fails on are optimised, each between two
  // instants of the course held fixed, the rest of the course played as it
  // was laid. A stretch is the failing instants widened to the knot before
  // and after them and one knot interval more on either side, the room
  // the optimiser's cubic needs to leave the course and rejoin it; touching
  // stretches are one. The course with its stretches solved is admitted by
  // the model's reading of the whole frame grid, the test any solved
  // trajectory is admitted by; a stretch that is refused, a course that
  // fails over its whole span, or a splice the reading refuses leaves the
  // whole span to the optimiser below.
  const repair = (
    laid: HumanArmTrajectory.IAdmitted,
    verdict: M.IEvaluation,
  ): HumanArmTrajectory.ISolved | undefined => {
    if (fine.still) return undefined;
    const stretches: [number, number][] = [];
    verdict.failing.forEach((failing: boolean, g: number): void => {
      if (!failing) return;
      let before: number = 0;
      while (before + 1 < snapped.length && snapped[before + 1]! < g) ++before;
      let after: number = snapped.length - 1;
      while (after > 0 && snapped[after - 1]! > g) --after;
      const from: number = snapped[Math.max(0, before - 1)]!;
      const to: number = snapped[Math.min(snapped.length - 1, after + 1)]!;
      const last: [number, number] | undefined =
        stretches[stretches.length - 1];
      if (last !== undefined && from <= last[1])
        last[1] = Math.max(last[1], to);
      else stretches.push([from, to]);
    });
    if (
      stretches.length === 0 ||
      (stretches.length === 1 &&
        stretches[0]![0] === 0 &&
        stretches[0]![1] === grid.length - 1)
    )
      return undefined;
    const x: number[][][] = laid.read.x.map((arm: number[][]): number[][] => [
      ...arm,
    ]);
    const changed: boolean[] = new Array<boolean>(grid.length).fill(false);
    let penalty: number = 0;
    for (const [from, to] of stretches) {
      // The stretch's problem: the course's arms at its two instants as
      // its rest and its return, its last instant fixed where the span goes
      // on past it.
      const start: IAutoMovieMotionHumanArmClearance.IArm[] =
        laid.trajectories.map(
          (
            t: IAutoMovieMotionHumanArmTrajectory.Trajectory,
          ): IAutoMovieMotionHumanArmClearance.IArm => t(grid[from]!),
        );
      const end: IAutoMovieMotionHumanArmClearance.IArm[] =
        laid.trajectories.map(
          (
            t: IAutoMovieMotionHumanArmTrajectory.Trajectory,
          ): IAutoMovieMotionHumanArmClearance.IArm => t(grid[to]!),
        );
      const cut = (
        p: HumanArmTrajectory.IProblem,
      ): HumanArmTrajectory.IProblem => ({
        ...p,
        arms: p.arms.map(
          (
            arm: HumanArmTrajectory.IArm,
            a: number,
          ): HumanArmTrajectory.IArm => ({
            ...arm,
            ...(from > 0
              ? { rest: start[a]!, back: arm.back ?? arm.rest }
              : {}),
            ...(to < grid.length - 1
              ? {
                  back: end[a]!,
                  sites: arm.sites.map(
                    (
                      s: HumanArmTrajectory.ISite | undefined,
                      k: number,
                    ): HumanArmTrajectory.ISite | undefined =>
                      k === arm.sites.length - 1 ? undefined : s,
                  ),
                }
              : {}),
          }),
        ),
      });
      const within = (t: number): boolean =>
        t > grid[from]! + 1e-9 && t < grid[to]! - 1e-9;
      const own: number[] = grid.slice(from, to + 1);
      const local: M.IContext = contextOf(cut(reading(own)), fine);
      // The course goes on beyond the stretch, so its ends' accelerations
      // read the course's next instants, not an arm at rest.
      local.beyond = {
        ...(from > 0
          ? { before: x.map((arm: number[][]): number[] => arm[from - 1]!) }
          : {}),
        ...(to < grid.length - 1
          ? { after: x.map((arm: number[][]): number[] => arm[to + 1]!) }
          : {}),
      };
      // The stretch is solved by the optimisation alone, from the course
      // read at its knots: no warm start, repair, laid course or planner
      // seed is tried after it, so a refused stretch leaves the whole span
      // to the optimiser below rather than recursing into a full plan.
      const stretch: Stretch.IGrid = {
        reading: (t: readonly number[]): HumanArmTrajectory.IProblem =>
          cut(reading(t)),
        contextOf,
        grid: own,
        fine: local,
      };
      const knotted: Stretch.IKnots = Stretch.on(
        stretch,
        Stretch.snap(own, [grid[from]!, ...times.filter(within), grid[to]!]),
      );
      const solved: Stretch.ISolved = Stretch.optimise(
        stretch,
        knotted,
        Pace.coursed(knotted.context, laid.trajectories),
      );
      if (!Stretch.met(solved)) return undefined;
      const played: number[][][] = Knots.splice(
        solved.context.times,
        solved.x,
        grid,
        laid.read.x,
        from,
        to,
      );
      // Interior joins hold their last pose. An open end of the full
      // action is a solved contact and must keep the repaired last frame.
      const after: number = to === grid.length - 1 && fine.open ? to + 1 : to;
      for (let g: number = from + 1; g < after; ++g) {
        changed[g] = true;
        for (let a: number = 0; a < x.length; ++a)
          x[a]![g] = played[a]![g - from]!;
      }
      penalty = Math.max(penalty, solved.penalty);
    }
    if (
      M.evaluate(fine, x, { reading: verdict, laid: changed }).worst.value >
      M.TOLERANCE
    )
      return undefined;
    return {
      trajectories: problem.arms.map(
        (
          _: HumanArmTrajectory.IArm,
          a: number,
        ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(fine.setups, fine.times, x, a),
      ),
      state: { times: [...fine.times], x, penalty },
    };
  };

  // A hold whose hand pose its law prescribes is tracked frame by frame
  // before anything is optimised (`tracked`), a warm start included: it
  // needs no solve. Only what it leaves failing, the reach and the return
  // about it, goes on to the warm start, the repair and the optimiser.
  if (course?.read.evaluation !== undefined) {
    course = tracked(course, course.read.evaluation);
    if (course.admitted)
      return {
        trajectories: course.trajectories,
        state: { times: [...fine.times], x: course.read.x, penalty: 0 },
      };
  }

  // An earlier plan's solution of this action is tried next: on its own
  // knots as it stands, returned where the model admits it at them and on
  // the frame grid, and continued from at its penalty where not.
  let solved: Stretch.ISolved | undefined;
  if (warm !== undefined && warm.x.length === problem.arms.length) {
    const knotted: Stretch.IKnots = Stretch.on(
      whole,
      Stretch.snap(grid, warm.times),
    );
    const c: M.IContext = knotted.context;
    const seed: number[][][] = warm.x.map(
      (arm: readonly (readonly number[])[], a: number): number[][] =>
        knotted.knots.map((g: number, k: number): number[] =>
          k === 0
            ? [...c.rest[a]!]
            : k === c.n - 1 && !c.open
              ? [...c.back[a]!]
              : M.ranged(
                  c,
                  a,
                  HumanArmRefine.hermite(warm.times, arm, grid[g]!),
                ),
        ),
    );
    const kept: Stretch.ISolved = {
      ...knotted,
      x: seed,
      evaluation: M.evaluate(c, seed),
      penalty: warm.penalty,
      played: Admission.read(c, fine, seed),
    };
    solved = Stretch.met(kept)
      ? kept
      : Stretch.optimise(whole, knotted, seed, warm.penalty);
    if (!Stretch.met(solved)) solved = undefined;
  }
  if (solved === undefined && course?.read.evaluation !== undefined) {
    const repaired: HumanArmTrajectory.ISolved | undefined = repair(
      course,
      course.read.evaluation,
    );
    if (repaired !== undefined) return repaired;
  }
  // A laid course seeds the optimiser in place of the sampling planner;
  // a course that leads it to no admitted trajectory is followed by the
  // planner's seed on the first knots, TrajOpt's multiple
  // initialisations (Schulman et al. 2013, section VI).
  if (solved === undefined) {
    const laid: number[][][] | undefined =
      course === undefined
        ? undefined
        : Pace.coursed(initial.context, course.trajectories);

    // A hold no configuration meets has no trajectory: it is refused by
    // its own still problem before the whole trajectory's penalties are
    // spent on it (`HumanArmSeed.held`), and the configuration found is
    // the planner seed's hold where that seed follows.
    const hold: number[][] | undefined =
      laid === undefined
        ? undefined
        : HumanArmSeed.held(problem, initial.context, laid);
    solved = Stretch.optimise(
      whole,
      initial,
      laid ?? HumanArmSeed.seed(problem, initial.context),
    );
    if (course?.read.evaluation !== undefined && !Stretch.met(solved))
      solved = Stretch.optimise(
        whole,
        initial,
        HumanArmSeed.seed(problem, initial.context, hold),
      );
  }
  // The path a refusal for time was reached at is the replan's start
  // (`Stretch.refused` tells it): over the span the refusal names, the same
  // path moves within the bound (Hollerbach 1984).
  if (!Stretch.met(solved)) throw Stretch.refused(whole, solved, told);
  return Stretch.played(solved);
}
/**
 * Whether every arm's site at a frame prescribes the hand's pose: a site with
 * its asked attitude, on nothing that moves with another arm.
 */
function prescribed(c: M.IContext, g: number): boolean {
  return (
    g >= 0 &&
    c.sites.every((sites: readonly (M.ISite | undefined)[]): boolean => {
      const site: M.ISite | undefined = sites[g];
      return (
        site !== undefined &&
        site.rotation !== undefined &&
        site.on === undefined
      );
    })
  );
}

/**
 * An arm's configuration at a prescribed hold's first frame: of the clear
 * swivels there, the one nearest the course's own; none where no swivel is
 * clear.
 */
function entered(
  c: M.IContext,
  a: number,
  k: number,
  x: readonly (readonly number[][])[],
): number[] | undefined {
  const own: readonly number[] = x[a]![k]!;
  let best: number[] | undefined;
  let least: number = Infinity;
  for (const q of HumanArmTrajectoryContactCircle(c, a, k, own)) {
    let d: number = 0;
    for (let i: number = 0; i < q.length; ++i) d += (q[i]! - own[i]!) ** 2;
    if (d < least) {
      least = d;
      best = q;
    }
  }
  return best;
}
