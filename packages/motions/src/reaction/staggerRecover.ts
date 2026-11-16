import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { walkStanceCourse } from "../actions/walkStanceCourse";
import {
  AutoMovieMotionHumanTiming,
} from "../compose/AutoMovieMotionHumanTiming";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanFoot } from "../posture/HumanFoot";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerClose } from "./staggerClose";
import { staggerKnots } from "./staggerKnots";
import { staggerStep } from "./staggerStep";
import type { prepareStaggerPendulumEntry } from "./prepareStaggerPendulumEntry";

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
    from: HumanFoot.IPlacement;

    /** Where it lands. */
    to: HumanFoot.IPlacement;

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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Inherits the single shared ICourses callable contract and adds steps, caught point, settled time and optional judged stances; planning, knot construction and displayed feet read these existing values.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The courses are functions of the seconds, not tables.
   */
  export interface IRecovery extends ICourses {
    /** The steps, in order. */
    steps: IStep[];

    /** The extrapolated centre of mass caught by the last step, from the entry's centre of mass over the floor, world metres. */
    caught: IAutoMovieVector3;

    /** When the centre of mass has come to rest, seconds since the action's start. */
    settled: number;

    /** The stances' course over the whole recovery as its steps were judged (`walkStanceCourse`), each step's course continued from the last; absent for the pendulum alone. */
    stances?: walkStanceCourse.ICourse;
  }

  /** A span's start, held centre of pressure and initial travel/velocity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States action-local start seconds, entry-relative world-metre pressure/travel and world-metre-per-second velocity.
   * @evidence contracts/development/design.md#principled-representation A held-pressure inverted-pendulum interval is fully specified by these four initial conditions, with frequency owned by its pendulum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Actual integration writes each field and individual/paired course readers consume every one.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores the actual integrated interval's initial state, without a sampled pose, inferred pressure or quantized time key.
   */
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

  /** The original prefix state snapshot/restore transfers between foot orders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members identify placed feet, actual phase/step records, entry-relative travel/velocity and action-local seconds.
   * @evidence contracts/development/design.md#principled-representation These six fields are the complete changing pendulum state; fixed body/entry/push/speed remain with the owning search.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Snapshot and restore share these same fields, and recovery retains only prefixes consumed by later foot orders.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds actual dynamic records rather than fitted playback data; callers preserve the original immutable nested records while collection wrappers are copied.
   */
  export interface IState {
    /** The feet. */
    feet: Record<"left" | "right", HumanFoot.IPlacement>;

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

  /**
   * The course values needed together for one synchronous stance-knot read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field names its frame; all values use metres.
   * @evidence contracts/development/design.md#principled-representation Travel, pressure and optionally extrapolated centre share one phase selection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The pendulum and closing course produce the values consumed by staggerKnots.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This is a fresh result per call, with no time- or phase-identity memo.
   */
  export interface IReading {
    /** Centre travel from the entry's centre, horizontal world metres. */
    course: IAutoMovieVector3;
    /** Centre of pressure on the floor, world metres. */
    pressure: IAutoMovieVector3;
    /** Extrapolated centre on the floor, world metres; included only when requested. */
    extrapolated?: IAutoMovieVector3;
  }

  /**
   * The courses of the spans, read at seconds since the push.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each reading states its frame and the common action-local clock.
   * @evidence contracts/development/design.md#principled-representation The three original scalar-time readers and an optional paired reading describe the same integrated phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Individual readers remain available; stance-knot construction consumes the optional sample to share phase selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing paired reader falls back to the existing readers; no phase is approximated or cached by time.
   */
  export interface ICourses {
    /** The centre of mass's travel from the entry's.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads seconds since the push and returns the current horizontal entry-relative centre travel in world metres.
     * @evidence contracts/development/implementation.md#principled-implementation Producers use the original held-pressure closed-form pendulum before the settling tail and the original adjacent-sample linear interpolation during settling.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The pendulum and settling owners retain their existing formulas behind this one shared course contract.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps original phase selection, duplicate-start behavior, clamped endpoints and tail interpolation without resampling or changing trajectories.
     * @evidence contracts/development/implementation.md#efficient-algorithms A pendulum read scans P retained phases once; a settling read indexes two original tail points in constant time.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work A paired sample may share this exact time's phase/interval selection; independent calls read the original retained phase/tail data afresh.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader borrows actual phase/tail arrays for the owning recovery lifetime and returns a fresh vector without retaining queried times.
     */
    course: (seconds: number) => IAutoMovieVector3;

    /** The centre of pressure on the floor, world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads action-local seconds and returns the current supported pressure in world-floor coordinates.
     * @evidence contracts/development/implementation.md#principled-implementation Uses the original selected phase's held pressure before settling and original held millisecond pressure sample during the settling tail, translated by entry centre and flattened.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Phase selection and tail indexing remain with their respective existing course producers.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps exact phase/tail selection, floor projection and all original support pressure samples without a changed bound.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(P) phase lookup before settling or O(1) tail lookup afterward, with one fixed-size output.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Paired reads share the same current-time selection; no pressure result is reused at a different time or phase.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only original recovery-owned phase/tail data and returns a fresh vector with no query history or external handle.
     */
    pressure: (seconds: number) => IAutoMovieVector3;

    /** The extrapolated centre of mass on the floor, world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads action-local seconds and returns the original capture point in world-floor coordinates.
     * @evidence contracts/development/implementation.md#principled-implementation Uses xi-p growing as exp(omega*t) on the selected held-pressure phase, or the original settling tail's adjacent xi interpolation, then applies entry-centre translation and floor projection.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The same original pendulum/tail owners compute capture points independently of merit or posture fitting.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps actual initial travel/velocity, frequency, all tail samples and endpoint clamps without a fitted capture path.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(P) phase lookup or constant two-point tail interpolation, with constant vector result size.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work An explicit paired sample can share phase/interval selection at this exact time; the current extrapolated value is still computed from original physical data.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Original phase/tail arrays live with the recovery; each output is fresh and no sampled-time cache is retained.
     */
    extrapolated: (seconds: number) => IAutoMovieVector3;

    /** Read travel/pressure and requested extrapolation at the same second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation All values use the same action-local second and world/entry-relative frames of the individual readers; extrapolated=true requests the capture point too.
     * @evidence contracts/development/implementation.md#principled-implementation Shares one original phase selection for the exact same-time physical formulas and otherwise delegates to the unchanged individual settling readers.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure This optional producer groups values already needed together by stance-knot construction, while the three original readers remain the common owners.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not skip requested values, approximate a phase, alter duplicate-start behavior or compute unrequested extrapolation.
     * @evidence contracts/development/implementation.md#efficient-algorithms Replaces two or three identical phase scans with one before settling; the tail retains the original constant-time indexing/formulas.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Only this synchronous query's identical phase and clock are shared; distinct times and recovery instances have no shared result cache.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh constant-size reading under original recovery-array ownership and retains no queried time or result.
     */
    sample?: (seconds: number, extrapolated: boolean) => IReading;
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
   * @param bending Optional operation-owned reader of this exact body's unchanged entry bending; evaluated once only when a stance course needs it.
   * @param geometry Optional fixed entry geometry from this exact body and complete entry, owned by the current speed search.
   * @returns The recovery with its judged course, or null when no order of `STEPS` steps catches it with a course that meets the legs' ranges through its closing step and settling.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the null.
   * @evidence contracts/development/implementation.md#principled-implementation Hof's pendulum with its centre of pressure as near the extrapolated centre of mass as the bearing feet reach; each step's time and place within the measured bounds and its reachable footstep region, the orders of the feet searched for the fewest steps (Koolen et al.'s N-step capture); caught once the extrapolated centre of mass is inside the two feet's base; then the closing step and the settling (`staggerClose`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pendulum per order of the feet, each step by `staggerStep`; the first order that catches and closes is kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push no order of `STEPS` steps catches is null, never a shortened bound; every bound is measured and cited.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 30 orders of up to `STEPS` steps, each sequence of feet stepped once and taken up by the orders that share it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The pendulum reads entry mass/width once. Bending is demanded once only by a kinematic course, and an explicit same-body/same-entry supplier can share that invariant with a parent plan or speed search.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the shared sequences for the search only.
   */
  export function recover(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    righting: number,
    kinematic: boolean = true,
    bending: () => Record<"pitch" | "roll", IAutoMovieVector3> =
      (): Record<"pitch" | "roll", IAutoMovieVector3> => staggerKnots.bending(body, entry),
    geometry?: ReturnType<typeof prepareStaggerPendulumEntry>,
  ): IRecovery | null {
    const { REACTION, STEPS }: typeof staggerBounds = staggerBounds;
    const pendulum: StaggerPendulum = new StaggerPendulum(
      body,
      entry,
      push,
      speed,
      geometry,
    );
    let bend: Record<"pitch" | "roll", IAutoMovieVector3> | undefined;
    const readBend: () => Record<"pitch" | "roll", IAutoMovieVector3> =
      (): Record<"pitch" | "roll", IAutoMovieVector3> => (bend ??= bending());
    const { entered, root, forward, across }: StaggerPendulum = pendulum;

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
    const ankle: (side: "left" | "right") => number = (side: "left" | "right"): number =>
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
    const other: (side: "left" | "right") => "left" | "right" = (side: "left" | "right"): "left" | "right" =>
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
    let judging: walkStanceCourse.ICourse | undefined;
    /** One exactly shared foot-order prefix and its original dynamic state. */
    type IPrefix = {
      course: walkStanceCourse.ICourse | undefined;
      done: boolean | null;
      state: IState;
    };
    const taken: Map<string, IPrefix> = new Map();
    for (const order of orders) {
      pendulum.reset();
      for (let k: number = 0; k < order.length; k++) {
        // Orders that begin alike share their first steps: each sequence of
        // feet is stepped once, and an order that repeats it takes up its
        // state.
        const key: string = order.slice(0, k + 1).join(",");
        let known: IPrefix | undefined = taken.get(key);
        if (known === undefined) {
          // A step's course starts from the course of the steps before it in
          // this order, so a step's landing depends on its own steps alone.
          const result: staggerStep.IResult = staggerStep.take(
            pendulum,
            {
              bend: readBend,
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
          readBend,
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
