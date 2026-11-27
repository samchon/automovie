import type {
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import type { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import { prepareHumanAdaptiveKnots } from "../../posture/internal/prepareHumanAdaptiveKnots";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";
import type { motionHumanArmPlannedReads } from "./motionHumanArmPlannedReads";
import { AutoMovieMotionHumanArmRide } from "./AutoMovieMotionHumanArmRide";

/*
 * The trajectory problem of an arms' plan
 * (`AutoMovieMotionHumanArmPlanned.planned`): the optimiser's first waypoints,
 * the reach and the return spaced by the arc their blend covers and the hold at
 * the least spacing, each knot and each arm's own hold a waypoint of its own;
 * and the problem over any waypoints, each arm's site read once per instant, a
 * site on a segment of another arm of the group riding that arm. Read from the
 * plan's body, span, arms, readings, borrowed reader and spacing.
 * Parameter scope: What the plan builds its problem from.
 * Returns: The waypoints, their cut, the problem and the guesses' setter.
 */
export function motionHumanArmPlannedProblem(
  scope: motionHumanArmPlannedProblem.IScope,
): motionHumanArmPlannedProblem.IReaders {
  const {
    body,
    span,
    carries,
    at,
    aimed,
    base,
    holding,
    travel,
    resolution,
    least,
    spacing,
  }: motionHumanArmPlannedProblem.IScope = scope;
  // Each phrase is an interval cut into pieces, its own end left to the
  // next one; an empty interval (a hold that lasts to the end, a reach
  // that starts on its site) has no piece, and the last phrase closes on
  // its end itself.
  const times: number[] = [];
  const cut = (a: number, b: number, pieces: number, last: boolean): void => {
    for (let i: number = 0; i < pieces; ++i)
      times.push(a + ((b - a) * i) / pieces);
    if (last) times.push(b);
  };

  const spaced = (seconds: number, arc: number): number =>
    Math.min(
      Math.ceil(seconds / STEP),
      Math.max(
        Math.ceil(seconds * least),
        Math.min(Math.ceil(arc / spacing), TRANSPORT),
        1,
      ),
    );
  // The instants strictly inside a hold where its holding arms' sites need a
  // knot: AutoKnots on every holding arm's goal point, millimetres, to the
  // narrowest of their sites' discs, the allowance each hand has about its
  // site (AutoMovieMotionHumanArmObservation).
  const disc: number =
    1000 *
    Math.min(
      ...carries.map(
        (c: IAutoMovieMotionHumanArmPlanned.IPlanned): number =>
          c.disc ?? AutoMovieMotionHumanAuditTangle.BUILT,
      ),
    );
  const moving = (from: number, to: number): number[] =>
    prepareHumanAdaptiveKnots({
      from,
      to,
      evaluate: (t: number): number[] =>
        carries.flatMap(
          (
            c: IAutoMovieMotionHumanArmPlanned.IPlanned,
            a: number,
          ): number[] => {
            if (!holding(c, t)) return [0, 0, 0];
            const point: IAutoMovieVector3 = aimed(a, t).point;
            return [1000 * point.x, 1000 * point.y, 1000 * point.z];
          },
        ),
      tolerance: {
        kind: "absolute",
        absolute: disc,
      },
      maxKnots: Math.max(6, Math.ceil((to - from) / STEP) + 1),
    }).times.filter((t: number): boolean => t > from && t < to);
  // The optimiser's first waypoints, cut only when the laid course is not
  // admitted.
  const waypoints: () => void = (): void => {
    cut(
      span.start,
      span.ready,
      spaced(span.ready - span.start, travel(span.ready, 1)),
      false,
    );
    cut(
      span.ready,
      span.relax,
      span.relax > span.ready
        ? Math.max(1, Math.ceil((span.relax - span.ready) * least))
        : 0,
      false,
    );
    cut(
      span.relax,
      span.end,
      spaced(span.end - span.relax, travel(span.relax, -1)),
      true,
    );
    // A hold's sites can move faster than the least density assumes (a
    // punch's fist, a push's palms): the hold also takes the knots AutoKnots
    // places on the sites' own path (Vitenti et al. 2024, arXiv:2412.13423;
    // `prepareHumanAdaptiveKnots`) to the solver's own millimetre
    // (`HumanArmTrajectoryTerms.TOLERANCE`), no finer than the frame grid, so
    // the course meets a fast site on waypoints of its own instead of the
    // optimiser fighting an interpolant too coarse for it.
    if (span.relax > span.ready)
      for (const t of moving(span.ready, span.relax))
        if (!times.some((u: number): boolean => Math.abs(u - t) < 1e-9))
          times.push(t);
    // An arm's own hold begins and ends on waypoints of its own, and every
    // instant that carries a pose constraint (`ISpan.knots`) is a waypoint,
    // as trajopt imposes a pose term at a timestep (github.com/joschu/
    // trajopt, `src/trajopt/problem_description.cpp`; Schulman et al. 2014,
    // section VII-B).
    const own: number[] = [...(span.knots ?? [])];
    for (const c of carries)
      if (c.span !== undefined) own.push(c.span.ready, c.span.relax);
    for (const t of own)
      if (
        t > span.start &&
        t < span.end &&
        !times.some((u: number): boolean => Math.abs(u - t) < 1e-9)
      )
        times.push(t);
    times.sort((a: number, b: number): number => a - b);
  };

  // Each arm's own fit at the hold's start, the optimiser's seed's first
  // start: fitted only once the laid course is refused, since an admitted
  // course reads no guess.
  let guesses: IAutoMovieMotionHumanArmAngles.IAngles[] | undefined;

  // Each arm's site at an instant, read once however often the refinement
  // reads the problem again: a refinement adds instants, and the site at
  // an instant already read does not change. The same record each time
  // also lets the solve keep what it built on it (`HumanArmTrajectoryContext.of`).
  const sited: Map<number, HumanArmTrajectory.ISite | undefined>[] =
    carries.map(
      (): Map<number, HumanArmTrajectory.ISite | undefined> => new Map(),
    );
  const problem = (
    waypoints: readonly number[],
  ): HumanArmTrajectory.IProblem => ({
    body,
    times: waypoints,
    ...(carries.some((arm) => arm.on !== undefined)
      ? {
          material: { at: base, bones: carries.map((arm) => arm.on) },
        }
      : {}),
    share: carries[0]!.weight,
    arms: carries.map(
      (
        c: IAutoMovieMotionHumanArmPlanned.IPlanned,
        a: number,
      ): HumanArmTrajectory.IArm => {
        const rider: number =
          c.on === undefined
            ? -1
            : carries.findIndex(
                (o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
                  o !== c && c.on!.startsWith(o.side),
              );
        // The site where the arm's goal puts it at an instant, on the hold.
        const located = (t: number): HumanArmTrajectory.ISite | undefined => {
          if (!holding(c, t)) return undefined;
          const pose: IAutoMoviePose = at(t).pose;
          const own: HumanArmTrajectory.ISite =
            AutoMovieMotionHumanArmObservation.site(
              body,
              pose,
              c,
              aimed(a, t),
              resolution,
            );
          if (rider < 0) return own;
          const lead: IAutoMovieMotionHumanArmPlanned.IPlanned =
            carries[rider]!;

          // A grip on an object both hands hold rides the lead hand's own
          // site, the hand as the plan puts it there: a closed chain
          // through the plan, not the hand as posed when it is read.
          if (c.grasp !== undefined && c.on!.endsWith("Hand")) {
            const held: HumanArmTrajectory.ISite =
              AutoMovieMotionHumanArmObservation.site(
                body,
                pose,
                lead,
                aimed(rider, t),
                resolution,
              );
            if (held.rotation !== undefined)
              return {
                ...own,
                on: {
                  ...AutoMovieMotionHumanArmRide.gripped(held, own),
                  arm: rider,
                },
              };
          }
          return {
            ...own,
            on: {
              ...AutoMovieMotionHumanArmRide.riding(
                body,
                pose,
                lead.side,
                c.on!,
                own.point,
                own.rotation,
              ),
              arm: rider,
            },
          };
        };
        const read = (t: number): HumanArmTrajectory.ISite | undefined => {
          if (!sited[a]!.has(t)) sited[a]!.set(t, located(t));
          return sited[a]!.get(t);
        };
        return {
          side: c.side,
          rest: c.rest,
          ...(c.back === undefined ? {} : { back: c.back }),
          ...(c.rests === undefined ? {} : { rests: c.rests }),
          ...(c.grasp === undefined ? {} : { grasp: c.grasp }),
          sites: waypoints.map(read),
          ...(guesses === undefined ? {} : { guess: guesses[a]! }),
        };
      },
    ),
    bases: waypoints.map(
      (t: number): HumanArmTrajectory.IProblem["bases"][number] => base(t),
    ),
  });
  return {
    times,
    waypoints,
    problem,
    guess: (values: IAutoMovieMotionHumanArmAngles.IAngles[]): void => {
      guesses = values;
    },
  };
}

/*
 * What the trajectory problem of an arms' plan reads and what it is.
 */
export namespace motionHumanArmPlannedProblem {
  /*
   * What an arms' plan builds its problem from.
   */
  export interface IScope {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The span's instants.
     */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;

    /*
     * The arms.
     */
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[];

    /*
     * An instant's posture and pose (`motionHumanArmPlannedReads`).
     */
    at: motionHumanArmPlannedReads.IReads["at"];

    /*
     * An arm's goal (`motionHumanArmPlannedReads`).
     */
    aimed: motionHumanArmPlannedReads.IReads["aimed"];

    /*
     * An instant's base (`motionHumanArmPlannedReads`).
     */
    base: motionHumanArmPlannedReads.IReads["base"];

    /*
     * Whether an arm holds (`motionHumanArmPlannedReads`).
     */
    holding: motionHumanArmPlannedReads.IReads["holding"];

    /*
     * A blend's longest arc (`motionHumanArmPlannedReads`).
     */
    travel: motionHumanArmPlannedReads.IReads["travel"];

    /*
     * The plan's exact forward-kinematics preparation.
     */
    resolution: ReturnType<typeof prepareHumanPoseResolution>;

    /*
     * The least waypoints a second (`AutoMovieMotionHumanArmPlanned.LEAST`).
     */
    least: number;

    /*
     * The farthest probe's travel between two waypoints of a first cut, metres.
     */
    spacing: number;
  }

  /*
   * The waypoints, their cut and the problem.
   */
  export interface IReaders {
    /*
     * The optimiser's waypoints, seconds, cut by `waypoints`.
     */
    times: number[];

    /*
     * Cut the optimiser's first waypoints into `times`.
     */
    waypoints: () => void;

    /*
     * The problem over waypoints.
     * Parameter waypoints: The waypoints' seconds.
     * Returns: The problem.
     */
    problem: (waypoints: readonly number[]) => HumanArmTrajectory.IProblem;

    /*
     * Set each arm's own fit at the hold's start, the optimiser's seed's first
     * start, once the laid course is refused.
     * Parameter values: Each arm's angles.
     */
    guess: (values: IAutoMovieMotionHumanArmAngles.IAngles[]) => void;
  }
}

/*
 * The spacing of the trajectory's waypoints, seconds at most: the frame grid
 * (`AutoMovieMotionHumanArmCourse.STEP`).
 */
const STEP: number = AutoMovieMotionHumanArmCourse.STEP;
/*
 * The intervals a reach or a return is first cut into at most, by its arc:
 * TrajOpt plans an arm's whole path on eleven timesteps, ten intervals
 * (Schulman et al. 2013, section VI); the solve adds knots where the played
 * trajectory's frame-grid reading asks (`HumanArmTrajectoryAdmission`).
 */
const TRANSPORT: number = 10;
