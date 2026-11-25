import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmTrajectory,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryContactCircle } from "./HumanArmTrajectoryContactCircle";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPace as Pace } from "./HumanArmTrajectoryPace";
import { HumanArmTrajectoryPaced } from "./HumanArmTrajectoryPaced";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";
import { HumanArmTrajectoryRetime as Retime } from "./HumanArmTrajectoryRetime";
import { HumanArmTrajectoryStretch as Stretch } from "./HumanArmTrajectoryStretch";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { nameArmTrajectoryPair } from "./nameArmTrajectoryPair";

/**
 * The work of `HumanArmTrajectory.solve`: one solve per span. A refused
 * course's hold whose hand pose its law prescribes is first tracked frame by
 * frame on the swivel, the arm's one freedom there (Tolani, Goswami and Badler
 * 2000, section 3.2). An earlier solution admitted as it stands is the plan.
 * Otherwise solve the hold poses before optimising the trajectory between
 * them. It records in `told` whether it reads
 * the mirror image, so `solve` can tell a refusal in the author's names.
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
 * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's few knots with a continuous reading between them through every frame (Schulman et al. 2014), the whole span solved once from the sampling planner's path, as MoveIt's optimiser adapter seeds every optimisation (`OptimizerAdapter::adaptAndPlan`, moveit/moveit moveit_planners/chomp/chomp_optimizer_adapter/src/chomp_optimizer_adapter.cpp lines 177-209 at commit 811328b1ba700f5d2dff69afc9737ac6cab66c9b, BSD-3-Clause), or from an earlier solution of the same action on refined waypoints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The tracked hold, the memoised solution, then one solve per span; solve keeps only the mirror-name translation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A trajectory is returned only when its frame-grid reading admits it; otherwise the refusal stands. A rest inside a body, the span's fixed first instant no solve moves, is refused at that instant before any solve. A prescribed hold's frame that no swivel clears at the exact asked attitude leaves the course as laid: the hold's task limits bound points within metres, so the optimiser trades the attitude within them, and the course's own reading refuses what they cannot hold.
 * @evidence contracts/development/implementation.md#efficient-algorithms One solve per span, no restart and no nested solve, its knots split only in the intervals whose course between knots fails; the optimiser's variables are the knots' and its clearance reads the knots and their intervals.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A warm solution and a laid course's reading (its knot times, its tracked hold and its pace) are reused only for this action's span.
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
        (arm: HumanArmTrajectory.IArm): AutoMovieHumanSide => arm.side,
      ),
    );
  const fine: M.IContext = course?.read.context ?? contextOf(reading(grid));
  const whole: Stretch.IGrid = { reading, contextOf, grid, fine };
  const initial: Stretch.IKnots = {
    knots: snapped,
    problem,
    context: contextOf(problem, fine),
  };
  // The span's first instant is fixed: the arm the course leaves from, as
  // the action is entered, which no solve moves. A rest inside a body is
  // refused at once, naming the instant: no path leaves it clear.
  const inside: HumanRefusal | undefined = restInside(fine, problem);
  if (inside !== undefined) throw inside;

  // A laid course whose worst term is its speed is retimed along its own path
  // (TOPP-RA, `HumanArmTrajectoryRetime`): its least duration within every
  // joint's velocity limit and the law's own pace, its time map slowed to the
  // span where the span holds it, and the retimed course read again in full,
  // which admits it or hands it on. Where the least exceeds a span the law's
  // own tempo sets (`stretches`), the caller is handed that least at once; a
  // span an end of which a meeting fixes goes to the optimiser.
  if (
    course !== undefined &&
    warm === undefined &&
    course.refused === "speed"
  ) {
    const span: number = fine.times[fine.n - 1]! - fine.times[0]!;
    const timing: Retime.ITiming = Retime.timing(fine, course.read.x);
    const least: number = timing.timed.times[timing.timed.times.length - 1]!;
    if (timing.status === "ok" && least <= span) {
      const x: number[][][] = Retime.retimed(
        fine,
        course.read.x,
        timing.timed,
        span,
      );
      const evaluation: M.IEvaluation = M.evaluate(fine, x);
      if (evaluation.worst.value <= M.TOLERANCE)
        return {
          trajectories: problem.arms.map(
            (
              _: HumanArmTrajectory.IArm,
              a: number,
            ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
              HumanArmTrajectoryPlayback(fine.setups, fine.times, x, a),
          ),
          state: { times: [...fine.times], x, penalty: 0 },
        };
    } else if (stretches)
      throw new HumanRefusal({
        kind: "reach",
        axis: "duration",
        value: span,
        feasible: {
          kind: "range",
          minimum: Pace.duration(timing.status === "ok" ? least : Infinity),
          maximum: null,
          unit: "s",
        },
        reason: `the laid course of the ${problem.arms.map((a: HumanArmTrajectory.IArm): string => a.side).join(" and ")} arm over the action moves faster than the law's own pace`,
        fix: "give the action more time",
      });
  } // A hold whose law prescribes the hand's pose at every instant (its site
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

  // A hold whose hand pose its law prescribes is tracked frame by frame
  // before anything is optimised (`tracked`): it needs no solve.
  if (course?.read.evaluation !== undefined) {
    course = tracked(course, course.read.evaluation);
    if (course.admitted)
      return {
        trajectories: course.trajectories,
        state: { times: [...fine.times], x: course.read.x, penalty: 0 },
      };
  }

  // An earlier plan's solution of this action, read on its own knots as it
  // stands, is the plan where the model admits it there and on the frame
  // grid.
  let earlier: Stretch.ISolved | undefined;
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
    const played: Admission.IReading = Admission.read(c, fine, seed);
    earlier = {
      ...knotted,
      x: seed,
      evaluation: played.evaluation,
      penalty: warm.penalty,
      played,
    };
    if (Stretch.met(earlier)) return Stretch.played(earlier);
  }

  // Establish feasible hold positions before planning a route. The earlier
  // iterate or the laid course supplies seeds for the hold's IK; RRT-Connect
  // supplies the initial route when there is no earlier iterate.
  const from: Stretch.IKnots = earlier ?? initial;
  const pinned: HumanArmSeed.IHolds = HumanArmSeed.holds(
    from.problem,
    from.context,
    earlier?.x ??
      (course === undefined
        ? undefined
        : Pace.coursed(from.context, course.trajectories)),
  );
  const seed: number[][][] =
    earlier?.x ?? HumanArmSeed.seed(from.context, pinned, fine);
  const solved: Stretch.ISolved = Stretch.optimise(
    whole,
    from,
    seed,
    earlier?.penalty,
    pinned,
  );
  if (!Stretch.met(solved)) {
    const paced: HumanRefusal | undefined = stretches
      ? HumanArmTrajectoryPaced(whole, solved, told)
      : undefined;
    if (paced !== undefined) throw paced;
    throw Stretch.refused(whole, solved, told);
  }
  return Stretch.played(solved);
}
/**
 * The refusal of a span whose fixed first instant, each arm's rest, lies inside
 * a body past what the admission allows: the reading the solve makes at every
 * inner waypoint (`HumanArmTrajectoryPairs`: each part's deepest probe, the
 * body's corners in the arm, the two arms in each other), made once at the
 * instant it never reads, since no solve moves it. A declared rest touches by
 * design and is not read. None where every rest is clear.
 */
function restInside(
  c: M.IContext,
  problem: HumanArmTrajectory.IProblem,
): HumanRefusal | undefined {
  const at: string = c.times[0]!.toFixed(3);
  const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[] = c.rest.map(
    (rest: number[], a: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
      G.placed(c.setups[a]!, c.frames[a]![0]!, rest, true),
  );
  const refuse = (a: number, short: number, what: string): HumanRefusal =>
    new HumanRefusal({
      kind: "reach",
      axis: "region",
      value: short,
      feasible: null,
      reason: `the ${problem.arms[a]!.side} arm leaves the action from inside a body: ${what} at ${at} s, the instant the action is entered`,
      fix: "enter the action with the arm clear of the body, or plan it from where the arm is shown",
    });
  for (let a: number = 0; a < placed.length; ++a) {
    for (const pair of P.deepest(c, a, 0, placed[a]!, 0).values())
      if (!pair.rested && pair.short - T.SKIN > M.TOLERANCE)
        return refuse(
          a,
          pair.short,
          `${nameArmTrajectoryPair(c, a, 0, pair.probe, pair.shape)} ${pair.short.toFixed(1)} mm deep`,
        );
    for (const pair of P.embedded(c, a, 0, placed[a]!, 0).values())
      if (!pair.rested && pair.short - T.SKIN > M.TOLERANCE)
        return refuse(
          a,
          pair.short,
          `the body's ${pair.bone} ${pair.short.toFixed(1)} mm inside the arm's ${pair.shape.bone}`,
        );
  }
  if (placed.length === 2)
    for (const pair of P.crossing(c, 0, placed[0]!, placed[1]!, 0).values())
      if (!pair.rested && pair.short - T.SKIN > M.TOLERANCE)
        return refuse(
          pair.a,
          pair.short,
          `probe ${pair.probe} ${pair.short.toFixed(1)} mm inside the other arm's ${pair.bone}`,
        );
  return undefined;
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
