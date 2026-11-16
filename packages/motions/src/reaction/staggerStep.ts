import { Vector3, convexHull2D, pointInHull } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { walkStanceCourse } from "../actions/walkStanceCourse";
import {
  AutoMovieMotionHumanTiming,
} from "../compose/AutoMovieMotionHumanTiming";
import { HumanFoot } from "../posture/HumanFoot";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import type { staggerRecover } from "./staggerRecover";
import { staggerSequential } from "./staggerSequential";

/**
 * One recovery step of a stagger (`staggerRecover`): the weight shifts onto
 * the stance foot over both feet, then the foot swings in its direction's
 * measured step time and lands the sole point it lands on as near the
 * extrapolated centre of mass as its reachable footstep region allows.
 *
 * The region is the stance foot's: within its direction's longest measured
 * recovery step of where the foot stood beside the stance foot at the entry,
 * the stance the measured steps were taken from, so a foot that steps again
 * cannot split the legs further than one step does; the legs' clearance of
 * each other is the stance course's, so a foot may cross the other. A foot
 * stepping forward strikes with its heel and one stepping backward lands on
 * its forefoot (Grasso, Bianchi and Lacquaniti 1998, J Neurophysiol 80:1868),
 * so the point runs from the heel to the ball with the step's share along
 * the foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the step's phases, its region, its landing point and its source.
 * @evidence contracts/development/design.md#principled-representation One step over a shared pendulum, its course passed in and out, so the orders of the feet search reuses the steps they share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `staggerRecover`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every bound is a measured one from `staggerBounds`; the region scales with the body's stature.
 */
export namespace staggerStep {
  /** What a step reads besides its pendulum.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines lazy same-entry bending, whether the landing is kinematically judged and the exact preceding course.
   * @evidence contracts/development/design.md#principled-representation A fixed-entry geometric supplier is separate from the kinematic-mode switch and optional prior course; the pendulum-only path never demands bending.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery supplies these three original planning inputs and take reads them at their existing phase of work.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no substitute bending result or success override; the actual supplier and original stance solver remain authoritative.
   */
  export interface IProps {
    /** The same entry's trunk shift per sine of its tilt, demanded only by a stance course.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Returns the exact body's unchanged-entry pitch/roll centre shifts in metres per sine, only when kinematic landing work requests them.
     * @evidence contracts/development/implementation.md#principled-implementation The producer runs the original standing and two lowered reference-tilt mass readings and returns their original sine-normalized shifts.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Recovery owns one explicit lazy invariant supplier; this step asks for it only when constructing the actual stance knots.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual same-body/complete-entry measurement, without a dummy zero shift, approximate key or skipped required bending read.
     * @evidence contracts/development/implementation.md#efficient-algorithms Costs the original three centre readings once per owning unchanged-entry operation, and no work for pendulum-only landings.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Only an explicit supplier within the same body/entry operation shares its actual completed reference measurement; changed operations prepare afresh.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation retains at most two shift vectors and releases its supplier with the search/plan, with no global result or time history.
     */
    bend: () => Record<"pitch" | "roll", IAutoMovieVector3>;

    /** Whether the landing is placed by the stance course under the legs' ranges; the pendulum alone when false. */
    kinematic: boolean;

    /** The course of the steps before this one, its start. */
    checking: walkStanceCourse.ICourse | undefined;
  }

  /** A step's outcome.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines captured/not-captured/null infeasibility and the actual continued course.
   * @evidence contracts/development/design.md#principled-representation The original three-valued outcome distinguishes a held landing from one the legs cannot place, while a course is absent only before kinematic judgement exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Recovery prefix search reads both fields to continue or stop each foot order.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reports actual capture and course data without a fixture result or omitted infeasibility state.
   */
  export interface IResult {
    /** Whether the body is caught after it; null when the legs hold no landing in its region. */
    done: boolean | null;

    /** The course the next step starts from. */
    checking: walkStanceCourse.ICourse | undefined;
  }

  /**
   * Take one step on the pendulum.
   *
   * @param pendulum The pendulum, advanced through the step.
   * @param props The trunk's shift, whether the legs' ranges place the landing, and the course so far.
   * @param side The stepping foot.
   * @param reaction Seconds both feet bear before the weight shifts.
   * @param unloaded Whether this is a sideways push's first step with the leg it unloads (`staggerBounds.LATERAL`).
   * @returns Whether it catches the body, and the course the next step starts from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the outcome.
   * @evidence contracts/development/implementation.md#principled-implementation Step adaptation (Khadiv et al. 2016; Griffin et al. 2017): the stance course up to the landing and through the weight's shift onto both feet after it places the landing itself, pulled toward the ankle that puts its landing point on the extrapolated centre of mass and held inside the region, the legs' ranges and their clearance of each other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shift, the swing, the aim, the region, then the course from each start, the better kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A landing the legs cannot hold in the region is null, never a shortened bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms One course per start, at most three, each solved only from the last step's landing on.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Continues the course of the steps before it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the chosen course in its result only.
   */
  export function take(
    pendulum: StaggerPendulum,
    props: IProps,
    side: "left" | "right",
    reaction: number,
    unloaded: boolean,
  ): IResult {
    const body: StaggerPendulum["body"] = pendulum.body;
    const flat: typeof StaggerPendulum.flat = StaggerPendulum.flat;
    const {
      REACTION,
      TRANSFER,
      LATERAL,
      STEP_TIME,
      STEP_LENGTH,
      KNOTS,
    } = staggerBounds;
    const { centre, forward, across, entered, width, length } = pendulum;
    const stance: "left" | "right" = side === "left" ? "right" : "left";
    if (reaction > 0) pendulum.bear(["left", "right"], reaction);
    // The leg a sideways push unloads leaves the floor sooner and swings
    // longer than a forward or backward step's (`LATERAL`).
    const forth: number =
      AutoMovieMotionHumanTiming.seconds(REACTION) +
      AutoMovieMotionHumanTiming.seconds(TRANSFER);
    pendulum.transfer(
      stance,
      unloaded
        ? LATERAL.footOff * forth - AutoMovieMotionHumanTiming.seconds(REACTION)
        : AutoMovieMotionHumanTiming.seconds(TRANSFER),
    );
    const from: HumanFoot.IPlacement = pendulum.feet[side];
    const swing: number = unloaded
      ? (LATERAL.swing * (STEP_TIME.forward + STEP_TIME.backward)) / 2
      : pendulum.bound(
          flat(Vector3.subtract(Vector3.add(centre, pendulum.xi()), from.ankle)),
          STEP_TIME,
        );
    const start: number = pendulum.t;
    pendulum.bear([stance], swing);
    const goal: IAutoMovieVector3 = Vector3.add(centre, pendulum.xi());
    const toes: IAutoMovieVector3 = flat(
      Vector3.subtract(
        HumanFoot.point(body, side, "ball", from),
        HumanFoot.point(body, side, "heel", from),
      ),
    );
    const aim: IAutoMovieVector3 = flat(
      Vector3.subtract(goal, HumanFoot.point(body, side, "sole", from)),
    );
    const aimed: number = Vector3.length(aim);
    const toeLength: number = Vector3.length(toes);
    const share: number =
      aimed > 0 && toeLength > 0
        ? Vector3.dot(aim, toes) / (aimed * toeLength)
        : 0;
    const lands: IAutoMovieVector3 = Vector3.lerp(
      HumanFoot.point(body, side, "sole", from),
      HumanFoot.point(body, side, share >= 0 ? "heel" : "ball", from),
      Math.abs(share),
    );
    const wanted: IAutoMovieVector3 = Vector3.add(
      from.ankle,
      flat(Vector3.subtract(goal, lands)),
    );
    // The region: the step's length from where the foot stood beside the
    // stance foot.
    const beside: IAutoMovieVector3 = Vector3.add(
      pendulum.feet[stance].ankle,
      flat(Vector3.subtract(entered[side].ankle, entered[stance].ankle)),
    );
    const reached: (ankle: IAutoMovieVector3) => IAutoMovieVector3 = (ankle: IAutoMovieVector3): IAutoMovieVector3 => {
      const travel: IAutoMovieVector3 = flat(Vector3.subtract(ankle, beside));
      const longest: number =
        pendulum.bound(travel, STEP_LENGTH) * body.measure.stature;
      const distance: number = Vector3.length(travel);
      return distance > longest
        ? Vector3.add(
            beside,
            Vector3.scale(travel, longest / distance),
          )
        : ankle;
    };
    const ankle0: IAutoMovieVector3 = reached(wanted);
    // Then the legs' own reachable set, in one solve: the stance course up
    // to the landing and through the weight's shift onto both feet after
    // it (`staggerKnots.of`, `walkStanceCourse`) places the landing itself,
    // pulled toward the ankle that puts its landing point on the
    // extrapolated centre of mass and held inside the region, the legs'
    // ranges and their clearance of each other, as step adaptation places a
    // step (Khadiv et al. 2016; Griffin et al. 2017). Where the legs can hold
    // no landing in the region, this order of the feet does not catch the
    // body.
    const region: (ankle: IAutoMovieVector3) => number[] = (ankle: IAutoMovieVector3): number[] => {
      const travel: IAutoMovieVector3 = flat(Vector3.subtract(ankle, beside));
      return [
        Vector3.length(travel) -
          pendulum.bound(travel, STEP_LENGTH) * body.measure.stature,
      ];
    };
    const placed: HumanFoot.IPlacement = {
      ankle: { ...ankle0, y: from.ankle.y },
      rotation: from.rotation,
    };
    // A landing on the stance foot's far side, or nearer it than the feet
    // stand side by side, crosses it: it lands in front of it or behind
    // it, each start at least a sole's length ahead of or behind the
    // stance foot.
    const sign: number = side === "left" ? 1 : -1;
    const crossing: boolean =
      sign *
        Vector3.dot(
          Vector3.subtract(ankle0, pendulum.feet[stance].ankle),
          across,
        ) <
      width;
    const crossed: (way: number) => HumanFoot.IPlacement = (way: number): HumanFoot.IPlacement => {
      const ahead: number = Vector3.dot(
        Vector3.subtract(ankle0, pendulum.feet[stance].ankle),
        forward,
      );
      const shift: number =
        way > 0 ? Math.max(0, length - ahead) : Math.min(0, -length - ahead);
      return {
        ankle: {
          ...reached(Vector3.add(ankle0, Vector3.scale(forward, shift))),
          y: from.ankle.y,
        },
        rotation: from.rotation,
      };
    };
    const both: IAutoMovieVector3[] = convexHull2D(
      [
        ...HumanFoot.sole(body, stance, pendulum.feet[stance]),
        ...HumanFoot.sole(body, side, placed),
      ].map(
        (q: IAutoMovieVector3): IAutoMovieVector3 =>
          flat(Vector3.subtract(q, centre)),
      ),
    );
    // The pendulum alone (`staggerLimit`'s bound) lands where the region puts it.
    if (!props.kinematic) {
      pendulum.steps.push({ side, from, to: placed, start, land: pendulum.t });
      pendulum.feet[side] = placed;
      return { done: pendulum.captured(), checking: props.checking };
    }
    const pressure: IAutoMovieVector3 = StaggerPendulum.nearest(both, pendulum.xi());
    pendulum.phases.push({
      from: pendulum.t,
      p: pressure,
      s: pendulum.s,
      v: pendulum.v,
    });
    const swung: staggerRecover.ICourses = pendulum.courses();
    // Each start's course: the landing placed from a start on the floor,
    // the course run on through the weight's shift onto both feet that
    // follows it.
    const t: number = pendulum.t;
    const steps: StaggerPendulum["steps"] = pendulum.steps;

    /** One actual stance-course solve and the landing it placed. */
    type ILanding = { course: walkStanceCourse.ICourse; to: HumanFoot.IPlacement };
    const solveFrom: (origin: HumanFoot.IPlacement, warm: walkStanceCourse.ICourse | undefined) => ILanding = (
      origin: HumanFoot.IPlacement,
      warm: walkStanceCourse.ICourse | undefined,
    ): ILanding => {
      const knots: staggerKnots.IKnot[] = staggerKnots.of(
        body,
        pendulum.entry,
        props.bend(),
        {
          ...swung,
          steps: [...steps, { side, from, to: origin, start, land: t }],
          caught:
            both.length >= 3 && pointInHull(pendulum.xi(), both) ? t : Infinity,
          landing: {
            placement: origin,
            goal: { ...wanted, y: from.ankle.y },
            region,
          },
        },
        t + AutoMovieMotionHumanTiming.seconds(TRANSFER),
      );
      // The steps before this one are settled up to the last one's landing:
      // only the course from there on is solved again.
      const settled: number =
        warm === undefined || steps.length === 0
          ? 0
          : Math.min(
              warm.knots.length,
              Math.floor(steps.at(-1)!.land * KNOTS + 1e-9),
            );
      const course: walkStanceCourse.ICourse = staggerSequential.solve(
        body,
        knots,
        warm,
        settled,
      );
      const at: number = Math.min(
        course.knots.length - 1,
        Math.ceil(t * KNOTS - 1e-9),
      );
      return {
        course,
        to: {
          ankle: {
            x: origin.ankle.x + course.slide[side].x[at]!,
            y: from.ankle.y,
            z: origin.ankle.z + course.slide[side].z[at]!,
          },
          rotation: from.rotation,
        },
      };
    };
    // The starts: the aim the region allows, from the course of the steps
    // before it, or for a crossing landing a start in front of the stance
    // foot and one behind it; and, where those end short of the ranges,
    // the place beside the stance foot: a local solve from one start can
    // stop at the edge of what the legs hold, and the one that meets the
    // ranges, or comes nearer, decides. Of two crossings that both meet
    // them, the one that lands nearer its aim does.
    pendulum.phases.push({
      from: pendulum.t,
      p: { ...pressure },
      s: pendulum.s,
      v: pendulum.v,
    });
    const off: (l: ILanding) => number = (l: ILanding): number =>
      Vector3.length(flat(Vector3.subtract(l.to.ankle, wanted)));
    const better: (a: ILanding, b: ILanding) => ILanding = (
      a: ILanding,
      b: ILanding,
    ): ILanding => {
      const met: (l: ILanding) => boolean = (l: ILanding): boolean =>
        l.course.unmet <= walkStanceCourse.MET;
      if (met(a) !== met(b)) return met(a) ? a : b;
      if (!met(a)) return a.course.unmet <= b.course.unmet ? a : b;
      return off(a) <= off(b) ? a : b;
    };
    let landed: ILanding = crossing
      ? better(
          solveFrom(crossed(1), props.checking),
          solveFrom(crossed(-1), props.checking),
        )
      : solveFrom(placed, props.checking);
    if (landed.course.unmet > walkStanceCourse.MET) {
      const near: ILanding = solveFrom(
        { ankle: { ...beside, y: from.ankle.y }, rotation: from.rotation },
        undefined,
      );
      if (near.course.unmet < landed.course.unmet) landed = near;
    }
    pendulum.phases.pop();
    // The next step's course starts from this one.
    const checking: walkStanceCourse.ICourse = landed.course;
    if (landed.course.unmet > walkStanceCourse.MET)
      return { done: null, checking };
    const to: HumanFoot.IPlacement = landed.to;
    pendulum.steps.push({ side, from, to, start, land: pendulum.t });
    pendulum.feet[side] = to;
    // Caught once the extrapolated centre of mass lies inside the base the
    // two feet now make, the zero-step capture region (Koolen et al. 2012).
    return { done: pendulum.captured(), checking };
  }
}
