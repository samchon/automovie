import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerAdmission } from "./staggerAdmission";
import { staggerBounds } from "./staggerBounds";
import { staggerCapture } from "./staggerCapture";
import { staggerClose } from "./staggerClose";
import { staggerPendulumEntry } from "./staggerPendulumEntry";
import { staggerStep } from "./staggerStep";

/**
 * A stagger's recovery from a push (`stagger`): the steps the capture-point
 * rule places over Hof's pendulum (`StaggerPendulum`, `staggerStep`), the order
 * of the feet searched for the fewest steps, then the closing step and the
 * settling (`staggerClose`), each admitted by the legs (`staggerAdmission`).
 */
export namespace staggerRecover {
  /** One recovery step. */
  export interface IStep {
    /** The stepping foot. */
    side: AutoMovieHumanSide;

    /** Where it stood before the step. */
    from: IAutoMovieMotionHumanFoot.IPlacement;

    /** Where it lands. */
    to: IAutoMovieMotionHumanFoot.IPlacement;

    /** The swing's start, seconds since the action's start. */
    start: number;

    /** The landing, seconds since the action's start. */
    land: number;
  }

  /** A recovery from a push: its steps and the centre of mass's course. */
  export interface IRecovery extends ICourses {
    /** The steps, in order, the closing step last. */
    steps: IStep[];

    /**
     * The extrapolated centre of mass caught by the last catching step, from
     * the entry's centre of mass over the floor, world metres.
     */
    caught: IAutoMovieVector3;

    /**
     * When the centre of mass has come to rest, seconds since the action's
     * start.
     */
    settled: number;

    /**
     * The entry's centre of mass, world metres, the origin of `course`'s
     * travel.
     */
    centre: IAutoMovieVector3;
  }

  /** A span's start, held centre of pressure and initial travel/velocity. */
  export interface IPhase {
    /** Its start, seconds since the push. */
    from: number;

    /** Its centre of pressure, from the entry's centre of mass. */
    p: IAutoMovieVector3;

    /** The travel it started from. */
    s: IAutoMovieVector3;

    /** The velocity it started from. */
    v: IAutoMovieVector3;

    /**
     * Where a weight shift's centre of pressure runs to on its minimum-jerk
     * course from `p` (`staggerTransfer`); held at `p` when absent.
     */
    to?: IAutoMovieVector3;

    /** The weight shift's seconds, with `to`; held at `to` after them. */
    span?: number;
  }

  /** The original prefix state snapshot/restore transfers between foot orders. */
  export interface IState {
    /** The feet. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

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

  /** The courses of the spans, read at seconds since the push. */
  export interface ICourses {
    /** The centre of mass's travel from the entry's. */
    course: (seconds: number) => IAutoMovieVector3;

    /** The centre of pressure on the floor, world metres. */
    pressure: (seconds: number) => IAutoMovieVector3;

    /** The extrapolated centre of mass on the floor, world metres. */
    extrapolated: (seconds: number) => IAutoMovieVector3;
  }

  /**
   * The recovery from a push: the steps the capture-point rule places, the
   * closing step and the centre of mass's course over them.
   *
   * Admitted, each landing is the aimed one where the legs hold it, else the
   * other side of a crossing, else shortened toward the stance foot to the
   * farthest point they hold (`staggerStep`), so the admitted model lands no
   * nearer the extrapolated centre of mass than the pendulum alone. Its capture
   * is taken as implied by the pendulum's, the premise `staggerLimit` states:
   * the search first runs the pendulum alone, and a push it refuses is refused
   * without a single admission.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   * @param righting How long the centre of pressure takes to carry the
   *   extrapolated centre of mass to rest, seconds.
   * @param admitted Whether the legs admit each step, the close and the rest;
   *   the pendulum alone when false, the upper bound `staggerLimit` reads.
   * @param fixed The entry's geometry (`staggerPendulumEntry.prepare`) of this
   *   same body and entry, shared by a search over speeds; read here when
   *   absent.
   * @returns The recovery, or null when no order of `STEPS` steps catches,
   *   closes and settles it with every step admitted.
   */
  export function recover(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    righting: number,
    admitted: boolean = true,
    fixed: ReturnType<
      typeof staggerPendulumEntry.prepare
    > = staggerPendulumEntry.prepare(body, entry),
  ): IRecovery | null {
    const { REACTION, STEPS }: typeof staggerBounds = staggerBounds;

    // The prune: a push the pendulum alone refuses is refused unadmitted.
    if (
      admitted &&
      recover(body, entry, push, speed, righting, false, fixed) === null
    )
      return null;
    const pendulum: StaggerPendulum = new StaggerPendulum(
      body,
      entry,
      push,
      speed,
      fixed,
    );
    const { entered, root, forward, across }: StaggerPendulum = pendulum;

    // Koolen's N-step capture distance screens the push: one farther than
    // `STEPS` steps reach is a fall, and no order shorter than the fewest
    // steps that reach it is tried (`staggerCapture`).
    const fewest: number = staggerCapture(pendulum).fewest;
    if (fewest > STEPS) return null;

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
    const ankle: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number =>
      (entered[side].ankle.x - root.x) * push.x +
      (entered[side].ankle.z - root.z) * push.z;
    const along: AutoMovieHumanSide =
      ankle("left") > ankle("right") ? "left" : "right";
    const sideways: boolean =
      Math.abs(Vector3.dot(push, across)) >
      Math.abs(Vector3.dot(push, forward));
    const first: AutoMovieHumanSide = sideways
      ? along === "left"
        ? "right"
        : "left"
      : along;
    const other: (side: AutoMovieHumanSide) => AutoMovieHumanSide = (
      side: AutoMovieHumanSide,
    ): AutoMovieHumanSide => (side === "left" ? "right" : "left");
    const orders: AutoMovieHumanSide[][] = [];
    for (let n: number = 1; n <= STEPS; n++)
      for (let code: number = 0; code < 1 << n; code++) {
        // Bit k set: step k repeats the foot before it rather than
        // alternating; step 0 set takes the other foot first.
        const order: AutoMovieHumanSide[] = [];
        let foot: AutoMovieHumanSide = (code & 1) === 0 ? first : other(first);
        for (let k: number = 0; k < n; k++) {
          if (k > 0 && (code & (1 << k)) === 0) foot = other(foot);
          order.push(foot);
        }
        orders.push(order);
      }
    /**
     * One exactly shared foot-order prefix: its pendulum state and, once read,
     * its admission.
     */
    type IPrefix = {
      done: boolean | null;
      state: IState;
    };
    // Admitted, each candidate step is read on the pendulum's course so far.
    const admit: Parameters<typeof staggerStep.take>[4] = admitted
      ? (
          step: IStep,
          instants: readonly number[],
          crossing: boolean,
        ): boolean =>
          staggerAdmission(
            body,
            entry,
            {
              ...pendulum.courses(),
              centre: fixed.centre,
              steps: [...pendulum.steps, step],
            },
            fixed.bend,
            instants,
            crossing,
          )
      : undefined;
    const taken: Map<string, IPrefix> = new Map();
    for (const order of orders) {
      if (order.length < fewest) continue;
      pendulum.reset();
      let caught: boolean = false;
      for (let k: number = 0; k < order.length; k++) {
        // Orders that begin alike share their first steps: each sequence of
        // feet is stepped once, and an order that repeats it takes up its
        // state.
        const key: string = order.slice(0, k + 1).join(",");
        let known: IPrefix | undefined = taken.get(key);
        if (known === undefined) {
          const result: staggerStep.IResult = staggerStep.take(
            pendulum,
            order[k]!,
            k === 0 ? AutoMovieMotionHumanTiming.seconds(REACTION) : 0,
            k === 0 && sideways && order[0] === first,
            admit,
          );
          known = { done: result.done, state: pendulum.snapshot() };
          taken.set(key, known);
        } else pendulum.restore(known.state);
        if (known.done === null) break;

        // A step that catches the body may end the order, or another may
        // follow it: the weight still has to reach the landed foot, and a
        // catch the close cannot hold is held by a further step.
        if (known.done && k === order.length - 1) caught = true;
      }
      if (!caught) continue;
      const recovery: IRecovery | null = staggerClose(
        pendulum,
        order[order.length - 1]!,
        righting,
      );
      if (recovery === null) continue;
      if (!admitted) return recovery;

      // The catching steps were admitted as they were taken; then the close
      // at its mid-swing and landing, and the body at rest.
      const close: IStep = recovery.steps.at(-1)!;
      if (
        staggerAdmission(
          body,
          entry,
          recovery,
          fixed.bend,
          [
            close.start,
            (close.start + close.land) / 2,
            close.land,
            recovery.settled,
          ],
          false,
        )
      )
        return recovery;
    }
    return null;
  }
}
