import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieMotionHumanTiming,
} from "../compose/AutoMovieMotionHumanTiming";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanFoot } from "../posture/HumanFoot";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerAdmission } from "./staggerAdmission";
import { staggerBounds } from "./staggerBounds";
import { staggerClose } from "./staggerClose";
import { staggerStep } from "./staggerStep";

/**
 * A stagger's recovery from a push (`stagger`): the steps the capture-point
 * rule places over Hof's pendulum (`StaggerPendulum`, `staggerStep`), the
 * order of the feet searched for the fewest steps, then the closing step and
 * the settling (`staggerClose`), each admitted by the legs
 * (`staggerAdmission`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned, from what and by which owners.
 * @evidence contracts/development/design.md#principled-representation The recovery as data: its steps and the courses of the centre of mass, the centre of pressure and the extrapolated centre of mass as functions of the seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The step and recovery records and the search, read by `stagger`, `staggerLimit`, `StaggerFeet`, `staggerAdmission` and the specs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the foot's placement and the pendulum's own state.
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Inherits the single shared ICourses callable contract and adds steps, caught point and settled time; planning, admission and displayed feet read these values.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The courses are functions of the seconds, not tables.
   */
  export interface IRecovery extends ICourses {
    /** The steps, in order, the closing step last. */
    steps: IStep[];

    /** The extrapolated centre of mass caught by the last catching step, from the entry's centre of mass over the floor, world metres. */
    caught: IAutoMovieVector3;

    /** When the centre of mass has come to rest, seconds since the action's start. */
    settled: number;

    /** The entry's centre of mass, world metres, the origin of `course`'s travel. */
    centre: IAutoMovieVector3;
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
   * The courses of the spans, read at seconds since the push.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each reading states its frame and the common action-local clock.
   * @evidence contracts/development/design.md#principled-representation Three scalar-time readers of the same integrated phases and settling tail.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The admission and the displayed feet read the travel, the trunk the extrapolated centre; the pressure is the plan's record of where the feet bear.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No phase is approximated or cached by time.
   */
  export interface ICourses {
    /** The centre of mass's travel from the entry's.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads seconds since the push and returns the current horizontal entry-relative centre travel in world metres.
     * @evidence contracts/development/implementation.md#principled-implementation Producers use the original held-pressure closed-form pendulum before the settling tail and the original adjacent-sample linear interpolation during settling.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The pendulum and settling owners retain their existing formulas behind this one shared course contract.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps original phase selection, duplicate-start behavior, clamped endpoints and tail interpolation without resampling or changing trajectories.
     * @evidence contracts/development/implementation.md#efficient-algorithms A pendulum read binary-searches P retained phases, O(log P); a settling read indexes two tail points in constant time.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call reads the retained phase/tail data afresh.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader borrows actual phase/tail arrays for the owning recovery lifetime and returns a fresh vector without retaining queried times.
     */
    course: (seconds: number) => IAutoMovieVector3;

    /** The centre of pressure on the floor, world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads action-local seconds and returns the current supported pressure in world-floor coordinates.
     * @evidence contracts/development/implementation.md#principled-implementation Uses the original selected phase's held pressure before settling and original held millisecond pressure sample during the settling tail, translated by entry centre and flattened.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Phase selection and tail indexing remain with their respective existing course producers.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps exact phase/tail selection, floor projection and all original support pressure samples without a changed bound.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(log P) phase lookup before settling or O(1) tail lookup afterward, with one fixed-size output.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work No pressure result is reused at a different time or phase.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only original recovery-owned phase/tail data and returns a fresh vector with no query history or external handle.
     */
    pressure: (seconds: number) => IAutoMovieVector3;

    /** The extrapolated centre of mass on the floor, world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads action-local seconds and returns the original capture point in world-floor coordinates.
     * @evidence contracts/development/implementation.md#principled-implementation Uses xi-p growing as exp(omega*t) on the selected held-pressure phase, or the original settling tail's adjacent xi interpolation, then applies entry-centre translation and floor projection.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The same original pendulum/tail owners compute capture points independently of merit or posture fitting.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps actual initial travel/velocity, frequency, all tail samples and endpoint clamps without a fitted capture path.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(log P) phase lookup or constant two-point tail interpolation, with constant vector result size.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The current extrapolated value is computed from the retained physical data.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Original phase/tail arrays live with the recovery; each output is fresh and no sampled-time cache is retained.
     */
    extrapolated: (seconds: number) => IAutoMovieVector3;
  }

  /**
   * The recovery from a push: the steps the capture-point rule places, the
   * closing step and the centre of mass's course over them.
   *
   * Admitted, each landing is the aimed one where the legs hold it, else the
   * other side of a crossing, else shortened toward the stance foot to the
   * farthest point they hold (`staggerStep`), so the admitted model lands no
   * nearer the extrapolated centre of mass than the pendulum alone. Its
   * capture is taken as implied by the pendulum's, the premise `staggerLimit`
   * states: the search first runs the pendulum alone, and a push it refuses
   * is refused without a single admission.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   * @param righting How long the centre of pressure takes to carry the extrapolated centre of mass to rest, seconds.
   * @param admitted Whether the legs admit each step, the close and the rest; the pendulum alone when false, the upper bound `staggerLimit` reads.
   * @param fixed The entry's geometry (`StaggerPendulum.prepare`) of this same body and entry, shared by a search over speeds; read here when absent.
   * @returns The recovery, or null when no order of `STEPS` steps catches, closes and settles it with every step admitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the pruning's premise and the null.
   * @evidence contracts/development/implementation.md#principled-implementation Hof's pendulum with its centre of pressure as near the extrapolated centre of mass as the bearing feet reach; each step's time and place within the measured bounds and its reachable footstep region, the orders of the feet searched for the fewest steps (Koolen et al.'s N-step capture); caught once the extrapolated centre of mass is inside the two feet's base; then the closing step and the settling (`staggerClose`), and the legs' two-bone admission of every step at its mid-swing and landing, of the close and of the rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pendulum per order of the feet, each step by `staggerStep`; the first order that catches, closes and is admitted is kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push no order of `STEPS` steps catches is null, never a shortened bound; every bound is measured and cited, and a landing the legs do not hold is shortened inside the region or refused. The pendulum prune rests on the stated premise that a shortened landing never catches what the aimed one misses.
   * @evidence contracts/development/implementation.md#efficient-algorithms A refused push: at most 30 closed-form pendulum prefixes and no admission. A caught one adds the admitted search: at most 30 prefixes, each one mid-swing admission and at most 3 + log2(1 / ADAPTED) landing admissions (one ground settling each, two leg fits where the feet cross); no stance course or quadratic program is solved.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exactly shared foot-order prefixes reuse their state, admitted landings included, within this recovery: a prefix's steps and its course up to its last landing are the same in every order that begins with it. The entry's fixed geometry is shared across a search's speeds through `fixed`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the shared prefixes for the search only.
   */
  export function recover(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    righting: number,
    admitted: boolean = true,
    fixed: ReturnType<typeof StaggerPendulum.prepare> = StaggerPendulum.prepare(body, entry),
  ): IRecovery | null {
    const { REACTION, STEPS }: typeof staggerBounds = staggerBounds;

    // The prune: a push the pendulum alone refuses is refused unadmitted.
    if (admitted && recover(body, entry, push, speed, righting, false, fixed) === null)
      return null;
    const pendulum: StaggerPendulum = new StaggerPendulum(
      body,
      entry,
      push,
      speed,
      fixed,
    );
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
    /** One exactly shared foot-order prefix: its pendulum state and, once read, its admission. */
    type IPrefix = {
      done: boolean | null;
      state: IState;
    };
    // Admitted, each candidate step is read on the pendulum's course so far.
    const admit: Parameters<typeof staggerStep.take>[4] = admitted
      ? (step: IStep, instants: readonly number[], crossing: boolean): boolean =>
          staggerAdmission(
            body,
            entry,
            { ...pendulum.courses(), centre: fixed.centre, steps: [...pendulum.steps, step] },
            fixed.bend,
            instants,
            crossing,
          )
      : undefined;
    const taken: Map<string, IPrefix> = new Map();
    for (const order of orders) {
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
        if (known.done) {
          caught = k === order.length - 1;
          break;
        }
      }
      if (!caught) continue;
      const recovery: IRecovery | null = staggerClose.of(
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
          [(close.start + close.land) / 2, close.land, recovery.settled],
          false,
        )
      )
        return recovery;
    }
    return null;
  }
}
