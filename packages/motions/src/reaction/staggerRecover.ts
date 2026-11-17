import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanWalkStanceCourse, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "@automovie/engine";
import {
  AutoMovieMotionHumanTiming,
} from "../compose/AutoMovieMotionHumanTiming";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerClose } from "./staggerClose";
import { staggerKnots } from "./staggerKnots";
import { staggerStep } from "./staggerStep";

/**
 * A stagger's recovery from a push (`stagger`): the steps the capture-point
 * rule places over Hof's pendulum (`StaggerPendulum`, `staggerStep`), the
 * order of the feet searched for the fewest steps, then the closing step and
 * the settling (`staggerClose`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned, from what and by which owners.
 * @evidence contracts/development/design.md#principled-representation The recovery as data: its steps and the courses of the centre of mass, the centre of pressure and the extrapolated centre of mass as functions of the seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The step and recovery records and the search, read by `stagger`, `staggerLimit`, `staggerKnots` and the specs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the foot's placement and the stance course's record.
 */
export namespace staggerRecover {
  /**
   * One recovery step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The foot, its two placements and its swing's window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, read by the plan and the tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the foot's placement.
   */
  export interface IStep {
    /** The stepping foot. */
    side: "left" | "right";

    /** Where it stood before the step. */
    from: IAutoMovieMotionHumanFoot.IPlacement;

    /** Where it lands. */
    to: IAutoMovieMotionHumanFoot.IPlacement;

    /** The swing's start, seconds since the action's start. */
    start: number;

    /** The landing, seconds since the action's start. */
    land: number;
  }

  /**
   * A recovery from a push: its steps and the centre of mass's course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The steps, the courses of the centre of mass, the centre of pressure and the extrapolated centre of mass along the push and the instant it settles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, read by the plan and the tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The courses are functions of the seconds, not tables.
   */
  export interface IRecovery {
    /** The steps, in order. */
    steps: IStep[];

    /** The extrapolated centre of mass caught by the last step, from the entry's centre of mass over the floor, world metres. */
    caught: IAutoMovieVector3;

    /** The centre of mass's travel over the floor from the entry's at a second since the action's start, world metres. */
    course: (seconds: number) => IAutoMovieVector3;

    /** The centre of pressure the pendulum stands on at a second since the action's start, on the floor, world metres. */
    pressure: (seconds: number) => IAutoMovieVector3;

    /** The extrapolated centre of mass at a second since the action's start, on the floor, world metres. */
    extrapolated: (seconds: number) => IAutoMovieVector3;

    /** When the centre of mass has come to rest, seconds since the action's start. */
    settled: number;

    /** The stances' course over the whole recovery as its steps were judged (`walkStanceCourse`), each step's course continued from the last; absent for the pendulum alone. */
    stances?: IAutoMovieMotionHumanWalkStanceCourse.ICourse;
  }

  /** A span: its start, its held centre of pressure, and the travel and velocity it started from. */
  export interface IPhase {
    /** Its start, seconds since the push. */
    from: number;

    /** Its centre of pressure, from the entry's centre of mass. */
    p: IAutoMovieVector3;

    /** The travel it started from. */
    s: IAutoMovieVector3;

    /** The velocity it started from. */
    v: IAutoMovieVector3;
  }

  /** The state a `snapshot` keeps. */
  export interface IState {
    /** The feet. */
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;

    /** The spans. */
    phases: IPhase[];

    /** The steps. */
    steps: IStep[];

    /** The travel. */
    s: IAutoMovieVector3;

    /** The velocity. */
    v: IAutoMovieVector3;

    /** The second. */
    t: number;
  }

  /** The courses of the spans, read at a second since the push. */
  export interface ICourses {
    /** The centre of mass's travel from the entry's. */
    course: (seconds: number) => IAutoMovieVector3;

    /** The centre of pressure on the floor, world. */
    pressure: (seconds: number) => IAutoMovieVector3;

    /** The extrapolated centre of mass on the floor, world. */
    extrapolated: (seconds: number) => IAutoMovieVector3;
  }

  /**
   * The recovery from a push: the steps the capture-point rule places, the
   * closing step and the centre of mass's course over them.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   * @param righting How long the centre of pressure takes to carry the extrapolated centre of mass to rest, seconds.
   * @param kinematic Whether each landing is placed by the stance course under the legs' ranges; the pendulum alone, its landings where the region puts them, when false.
   * @returns The recovery with its judged course, or null when no order of `STEPS` steps catches it with a course that meets the legs' ranges through its closing step and settling.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the null.
   * @evidence contracts/development/implementation.md#principled-implementation Hof's pendulum with its centre of pressure as near the extrapolated centre of mass as the bearing feet reach; each step's time and place within the measured bounds and its reachable footstep region, the orders of the feet searched for the fewest steps (Koolen et al.'s N-step capture); caught once the extrapolated centre of mass is inside the two feet's base; then the closing step and the settling (`staggerClose`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pendulum per order of the feet, each step by `staggerStep`; the first order that catches and closes is kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push no order of `STEPS` steps catches is null, never a shortened bound; every bound is measured and cited.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 30 orders of up to `STEPS` steps, each sequence of feet stepped once and taken up by the orders that share it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The entry's centre of mass and the feet's width are read once per call, by the pendulum.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the shared sequences for the search only.
   */
  export function recover(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    righting: number,
    kinematic: boolean = true,
  ): IRecovery | null {
    const { REACTION, STEPS } = staggerBounds;
    const pendulum: StaggerPendulum = new StaggerPendulum(
      body,
      entry,
      push,
      speed,
    );
    const bend: Record<"pitch" | "roll", IAutoMovieVector3> =
      staggerKnots.bending(body, entry);
    const { entered, root, forward, across } = pendulum;

    // The order of the feet is chosen with the steps: every order of up to
    // `STEPS` steps is tried, the fewest steps first and, among as many, the
    // order that alternates from the preferred foot first, and the first that
    // catches the body is taken, so forward and backward recoveries alternate
    // their feet (Maki and McIlroy 1997). Pushed forward or backward, the
    // foot further along the push steps first, the rear foot for a push
    // backward. Pushed sideways (nearer the side than the heading), the leg
    // the push unloads steps first, crossing in front of or behind the
    // loaded one: 96% of stepping responses to lateral destabilisation swing
    // the unloaded leg, which lifts much sooner but swings a longer and more
    // complex path (Maki, McIlroy and Perry 1996, J Biomech 29:343); the
    // loaded leg's side-step is the other order of as many steps.
    const ankle = (side: "left" | "right"): number =>
      (entered[side].ankle.x - root.x) * push.x +
      (entered[side].ankle.z - root.z) * push.z;
    const along: "left" | "right" =
      ankle("left") > ankle("right") ? "left" : "right";
    const sideways: boolean =
      Math.abs(Vector3.dot(push, across)) > Math.abs(Vector3.dot(push, forward));
    const first: "left" | "right" = sideways
      ? along === "left"
        ? "right"
        : "left"
      : along;
    const other = (side: "left" | "right"): "left" | "right" =>
      side === "left" ? "right" : "left";
    const orders: ("left" | "right")[][] = [];
    for (let n: number = 1; n <= STEPS; n++)
      for (let code: number = 0; code < 1 << n; code++) {
        // Bit k set: step k repeats the foot before it rather than
        // alternating; step 0 set takes the other foot first.
        const order: ("left" | "right")[] = [];
        let foot: "left" | "right" = (code & 1) === 0 ? first : other(first);
        for (let k: number = 0; k < n; k++) {
          if (k > 0 && (code & (1 << k)) === 0) foot = other(foot);
          order.push(foot);
        }
        orders.push(order);
      }
    let caught: boolean = false;
    let judging: IAutoMovieMotionHumanWalkStanceCourse.ICourse | undefined;
    const taken: Map<
      string,
      {
        course: IAutoMovieMotionHumanWalkStanceCourse.ICourse | undefined;
        done: boolean | null;
        state: IState;
      }
    > = new Map();
    for (const order of orders) {
      pendulum.reset();
      for (let k: number = 0; k < order.length; k++) {
        // Orders that begin alike share their first steps: each sequence of
        // feet is stepped once, and an order that repeats it takes up its
        // state.
        const key: string = order.slice(0, k + 1).join(",");
        let known = taken.get(key);
        if (known === undefined) {
          // A step's course starts from the course of the steps before it in
          // this order, so a step's landing depends on its own steps alone.
          const result: staggerStep.IResult = staggerStep.take(
            pendulum,
            {
              bend,
              kinematic,
              checking:
                k === 0
                  ? undefined
                  : taken.get(order.slice(0, k).join(","))?.course,
            },
            order[k]!,
            k === 0 ? AutoMovieMotionHumanTiming.seconds(REACTION) : 0,
            k === 0 && sideways && order[0] === first,
          );
          known = {
            course: result.checking,
            done: result.done,
            state: pendulum.snapshot(),
          };
          taken.set(key, known);
        } else pendulum.restore(known.state);
        const done: boolean | null = known.done;
        if (done === null) break;
        if (done) {
          caught = k === order.length - 1;
          judging = known.course;
          break;
        }
      }
      if (caught) {
        const recovery: IRecovery | null = staggerClose.of(
          pendulum,
          bend,
          kinematic,
          order[order.length - 1]!,
          judging,
          righting,
        );
        if (recovery !== null) return recovery;
        caught = false;
      }
    }
    return null;
  }
}
