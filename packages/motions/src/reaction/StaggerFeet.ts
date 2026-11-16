import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { walkFoot } from "../actions/walkFoot";
import { walkReach } from "../actions/walkReach";
import { walkReachHeld } from "../actions/walkReachHeld";
import { walkStanceCourse } from "../actions/walkStanceCourse";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import type { staggerRecover } from "./staggerRecover";
import { staggerSwingBow } from "./staggerSwingBow";

/**
 * A stagger's feet and pelvis at every second of its plan (`stagger`): the
 * stances as the recovery's judged course holds them, and each step's swing
 * as a walking foot swings, risen first by the least toe clearance of
 * walking and bowed around the standing leg where it would pass into it.
 *
 * The course the recovery judged (`staggerRecover`, `walkStanceCourse`)
 * holds, at every knot, the pelvis's drop, each planted foot's pitch about
 * its ball and its turn on the floor, and the trunk's tilt about the hips,
 * each step's course continued from the last over the closing step and the
 * settling, so what is shown is what was judged. The pelvis carries the
 * centre of mass on its course less the shift the trunk's tilt makes of it
 * (`staggerKnots.frame`), so the trunk bends against a fall wherever the
 * legs need the hips over a foot (Horak and Nashner 1986's hip strategy,
 * which the ranges ask for rather than a rule); the heels rise only where
 * the feet still bear the recovery's centre of pressure and its caught
 * extrapolated centre of mass; a foot that has landed may turn out. A foot
 * in the air is read at the place it left, for the pelvis's turn alone, from
 * its lift-off as `scheduled` reads it.
 *
 * The instance prepares body-only swing reach once. Declared step endpoints,
 * swing readers and completed clearance bows are lazy and bounded by the
 * fixed recovery's steps; no arbitrary-time posed result is retained.
 * Foot transforms, reach and bow clearance remain with their existing owners.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read at a second, from which course, and how a swing is shaped.
 * @evidence contracts/development/design.md#principled-representation One plan's feet with the memoised stance ends and swing bows they share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The readings the plan's leg row writes from.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The clearance, the lift and the knot rate are `staggerBounds`'; the bow is bisected against the tangle audit's own bound.
 */
export class StaggerFeet {
  /** The feet as the entry stands them. */
  private readonly entered: Record<"left" | "right", HumanFoot.IPlacement>;

  /** The share of a swing a foot rises in (`staggerKnots.risingOf`). */
  private readonly rising: number;

  /** Each foot's stance at a step's start or landing, by side and second. */
  private readonly ends: Map<string, walkFoot.IEnd> = new Map();

  /** Each step's bow around the standing leg. */
  private readonly bows: Map<staggerRecover.IStep, number> = new Map();

  /** One fixed swing reader and lateral direction per immutable recovery step. */
  private readonly swings: Map<staggerRecover.IStep, {
    from: walkFoot.IEnd;
    normal: IAutoMovieVector3;
    at: (share: number) => walkFoot.IFoot;
  }> = new Map();

  /** The entry's posture. */
  private readonly posture: IHumanPosture;

  /** The body. */
  private readonly body: IHumanActionContext["body"];

  /** The judged recovery. */
  private readonly recovery: staggerRecover.IRecovery;

  /** The trunk's shift of the centre of mass per sine of its tilt. */
  private readonly bend: Record<"pitch" | "roll", IAutoMovieVector3>;

  /** Each side's body-only swing range and floor-clearance prerequisites. */
  private readonly swingReaches: Record<"left" | "right", ReturnType<typeof walkReach.prepareSwing>>;

  /**
   * Keep one plan's immutable body, entry, judged course and recovery steps.
   * Body-only reach readers are prepared now; endpoint, swing and bow work
   * remains lazy and bounded by the plan's declared steps.
   *
   * @param body The body.
   * @param entry The context's entry.
   * @param recovery The judged recovery.
   * @param bend The trunk's shift of the centre of mass per sine of its tilt.
   */
  public constructor(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    recovery: staggerRecover.IRecovery,
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
  ) {
    this.body = body;
    this.recovery = recovery;
    this.bend = bend;
    this.posture = entry.posture;
    this.entered = StrikingTarget.feet(entry);
    this.rising = staggerKnots.risingOf(body);
    this.swingReaches = {
      left: walkReach.prepareSwing(body, "left"),
      right: walkReach.prepareSwing(body, "right"),
    };
  }

  /** The judged course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns this recovery's already judged stance course; the constructor receives a kinematic recovery with stances present.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the original recovery's actual stance solution directly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One accessor preserves the single course owner for settlement and writing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not synthesize a course or conceal a missing kinematic producer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant access without copying or solving.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every reader consumes the exact course judged by recovery planning.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Borrows the plan-owned course and adds no retained state.
   */
  public course(): walkStanceCourse.ICourse {
    return this.recovery.stances!;
  }

  /**
   * The pelvis and stances at a second, with an optional course reading
   * already made by the same synchronous solve.
   *
   * @param seconds Seconds since the push.
   * @param feet The scheduled feet at that second.
   * @param reading This course's reading at that same second; read here when absent.
   * @returns The held pelvis, feet and contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the time, feet and exact same-course/same-second premise of a supplied reading.
   * @evidence contracts/development/implementation.md#principled-implementation The recovery's centre course and judged trunk determine the root frame, then walkReachHeld holds the feet under it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read or borrow the course sample, construct the frame, hold the feet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new fit, tolerance, time memo or posed-result cache is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms A supplied sample avoids duplicate interpolation, and the shared root formula avoids building an unused preliminary pelvis; held-foot work is unchanged and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work solve lends its same synchronous course reading; other callers retain the original default read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This operation retains neither the supplied reading nor its result.
   */
  public settle(
    seconds: number,
    feet: Record<"left" | "right", walkFoot.IScheduled>,
    reading: walkStanceCourse.IReading = walkStanceCourse.at(
      this.course(),
      seconds,
    ),
  ): walkReach.IGround {
    const entry: IHumanPosture = this.posture;
    return walkReachHeld.held(
      this.body,
      staggerKnots.root(entry.root, this.bend, this.recovery.course(seconds), reading.trunk),
      entry.yaw,
      entry.joints.hips ?? [0, 0, 0],
      feet,
      reading,
    );
  }

  /** The standing feet, each at the placement its latest landed step supplied.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads action-local seconds and returns original fixed placement/toe records for both sides.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the original ordered landed-step updates under the unchanged land-1e-9 comparison.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Entry feet form the base and one step scan replaces each landed side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves step order, endpoint placements and original landing comparison without interpolation.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(s) work for s recovery steps and two output slots.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the fixed entry/step placement geometry while producing a fresh two-foot schedule per query.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fixed-size schedule and retains no queried time or schedule.
   */
  public standing(
    seconds: number,
  ): Record<"left" | "right", walkFoot.IScheduled> {
    const out: Record<"left" | "right", walkFoot.IScheduled> = {
      left: { placement: this.entered.left, toes: 0 },
      right: { placement: this.entered.right, toes: 0 },
    };
    for (const step of this.recovery.steps)
      if (seconds >= step.land - 1e-9)
        out[step.side] = { placement: step.to, toes: 0 };
    return out;
  }

  /** The standing schedule with each active walking-foot swing written over it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Uses seconds since the push and preserves the original open swing intervals.
   * @evidence contracts/development/implementation.md#principled-implementation Starts from actual landed feet and applies the original bowed walking-foot law only for start<seconds<land. Its lazy bow owner fits each original interior course-knot observation against the standing leg and keeps the original tangle-bound, two-sided millimetre bisection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing schedule and one step scan delegate active swing geometry to swungAt; end owns declared settled endpoints and staggerSwingBow owns the clearance search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original interval predicate, endpoint/contact, lift, course-knot sample, reach pass and clearance-selected bow; only declared step endpoints enter the endpoint map.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(s) schedule scans for s recovery steps, plus the original k-instant two-sided fit search when an unprepared step is first queried; fixed endpoint geometry and completed bows remove only repeated equivalent search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body, complete entry, judged course and immutable step identity establish endpoint/swing/bow equivalence; every queried share and bow still receives the actual swing evaluation without a sampled-time result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most two settled endpoints and one swing/bow record per declared step remain with this finite recovery's plan; temporary bow observations release on search return or failure, and current schedule outputs belong to callers.
   */
  public scheduled(
    seconds: number,
  ): Record<"left" | "right", walkFoot.IScheduled> {
    const out: Record<"left" | "right", walkFoot.IScheduled> =
      this.standing(seconds);
    for (const step of this.recovery.steps) {
      if (seconds <= step.start || seconds >= step.land) continue;
      out[step.side] = this.swungAt(step, seconds, this.bowOf(step));
    }
    return out;
  }

  /**
   * The feet, the pelvis and the reached feet at a second: a swinging foot
   * held inside its leg's ranges under the settled pelvis and off the floor
   * (`walkReach.swing`), alongside the same course reading the trunk uses.
   *
   * @param seconds Seconds since the push.
   * @returns The scheduled, settled and reached feet and their course reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the common clock and each part of the result.
   * @evidence contracts/development/implementation.md#principled-implementation Schedule both feet from the judged Hof recovery course, compensate the root for trunk tilt about the hips, hold each foot rocker and reach each swinging foot with the original leg-range fit in world metres/degrees/action seconds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One schedule, course read and settlement precede at most two swings. The instance supplies fixed body-only reach preparation; walkReachHeld, walkFoot and walkReach own the actual physical calculations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The unchanged foot and leg owners still perform every fit; the returned reading is not memoized by time.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(s) fixed-step scans, one course lookup and two-foot settlement/reach, plus any first-demand bow search documented by scheduled; the returned trunk reading avoids another interpolation and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Two body-only reach readers prepared at construction serve the same immutable body, and settle borrows this exact same-second course reading also returned to stagger's trunk writer; all current-time feet are calculated afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record belongs to this synchronous writer evaluation. Two body-only reach readers release with the plan alongside scheduled's O(s) endpoint/swing/bow preparation; no arbitrary-time posed state or external handle is retained.
   */
  public solve(seconds: number): {
    feet: Record<"left" | "right", walkFoot.IScheduled>;
    settled: walkReach.IGround;
    reached: Record<"left" | "right", walkFoot.IEnd>;
    reading: walkStanceCourse.IReading;
  } {
    const feet: Record<"left" | "right", walkFoot.IScheduled> =
      this.scheduled(seconds);
    const reading: walkStanceCourse.IReading = walkStanceCourse.at(
      this.course(),
      seconds,
    );
    const settled: walkReach.IGround = this.settle(seconds, feet, reading);
    const reached: Record<"left" | "right", walkFoot.IEnd> = {
      ...settled.feet,
    };
    for (const side of ["left", "right"] as const)
      if (feet[side].swing !== undefined)
        reached[side] = this.swingReaches[side](
          settled,
          feet[side],
          this.swinging(side, seconds),
        );
    return { feet, settled, reached, reading };
  }

  /**
   * Settle a declared step endpoint once under this instance's fixed course.
   * Only immutable step start/landing seconds form these side/second keys;
   * later current-time queries borrow the actual completed endpoint.
   */
  private end(side: "left" | "right", seconds: number): walkFoot.IEnd {
    const key: string = `${side}:${seconds}`;
    let out: walkFoot.IEnd | undefined = this.ends.get(key);
    if (out === undefined) {
      out = this.settle(seconds, this.standing(seconds)).feet[side];
      this.ends.set(key, out);
    }
    return out;
  }

  /**
   * The first matching open swing's exact linear share at action-local
   * seconds, retaining the original strict endpoints and zero default.
   */
  private swinging(side: "left" | "right", seconds: number): number {
    for (const step of this.recovery.steps)
      if (step.side === side && seconds > step.start && seconds < step.land)
        return (seconds - step.start) / (step.land - step.start);
    return 0;
  }

  /**
   * Read a step's original raised-start walking swing at action-local
   * seconds and signed lateral bow metres. The foot rises by CLEARANCE over
   * the original rising share, then follows the prepared swing and
   * 16*share^2*(1-share)^2 lateral bump, resting at both endpoints.
   * Fixed endpoint/normal preparation is shared; each sample is fresh.
   */
  private swungAt(
    step: staggerRecover.IStep,
    seconds: number,
    bow: number,
  ): walkFoot.IScheduled {
    const { CLEARANCE }: typeof staggerBounds = staggerBounds;
    const rising: number = this.rising;
    const u: number = (seconds - step.start) / (step.land - step.start);
    const { from, normal, at }: ReturnType<StaggerFeet["swingOf"]> = this.swingOf(step);
    const share: number = Math.max(0, (u - rising) / (1 - rising));
    const swung: walkFoot.IFoot =
      u < rising
        ? {
            placement: {
              ankle: {
                ...from.ankle,
                y: from.ankle.y + CLEARANCE * minimumJerk.share(u / rising),
              },
              rotation: from.rotation,
            },
            toes: from.toes,
          }
        : at(share);
    const bump: number = 16 * share * share * (1 - share) * (1 - share);
    return {
      ...swung,
      placement: {
        ...swung.placement,
        ankle: Vector3.add(
          swung.placement.ankle,
          Vector3.scale(normal, bow * bump),
        ),
      },
      // The pelvis reads the swing from its lift-off on: a foot still
      // rising bears its claim on the hips as a stance does.
      swing: { u: share, off: step.start, on: step.land },
    };
  }

  /**
   * Prepare one immutable step's settled endpoints, raised-start walking
   * swing and lateral normal under this instance's fixed body/course.
   * The original 1e-9 travel-size test retains its heading fallback, and
   * the prepared reader computes each queried share without sample history.
   */
  private swingOf(step: staggerRecover.IStep): {
    from: walkFoot.IEnd;
    normal: IAutoMovieVector3;
    at: (share: number) => walkFoot.IFoot;
  } {
    const known: ReturnType<StaggerFeet["swingOf"]> | undefined = this.swings.get(step);
    if (known !== undefined) return known;
    const from: walkFoot.IEnd = this.end(step.side, step.start);
    const to: walkFoot.IEnd = this.end(step.side, step.land);
    const raised: walkFoot.IEnd = {
      ...from,
      ankle: { ...from.ankle, y: from.ankle.y + staggerBounds.CLEARANCE },
    };
    const travel: IAutoMovieVector3 = {
      x: to.ankle.x - from.ankle.x,
      y: 0,
      z: to.ankle.z - from.ankle.z,
    };
    const size: number = Vector3.length(travel);
    const out: ReturnType<StaggerFeet["swingOf"]> = {
      from,
      normal: size > 1e-9
        ? { x: -travel.z / size, y: 0, z: travel.x / size }
        : HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: this.posture.yaw },
            { x: 0, y: 0, z: 1 },
          ),
      at: walkFoot.prepareSwing(this.body, step.side, {
        from: raised,
        velocity: { x: 0, y: 0, z: 0 },
        to,
        seconds: (1 - this.rising) * (step.land - step.start),
        lift: staggerBounds.LIFT,
      }),
    };
    this.swings.set(step, out);
    return out;
  }

  /**
   * Find and retain one immutable step's original clearance bow. All
   * strictly interior KNOTS-rate observations are settled at zero bow, then
   * staggerSwingBow runs the actual two-sided leg-fit/tangle search to its
   * original millimetre bisection bound. Temporary observations release
   * after the search; only the actual signed result remains for that step.
   */
  private bowOf(step: staggerRecover.IStep): number {
    const known: number | undefined = this.bows.get(step);
    if (known !== undefined) return known;
    const count: number = Math.ceil(
      (step.land - step.start) * staggerBounds.KNOTS,
    );
    const instants: Parameters<typeof staggerSwingBow>[2] = Array.from({ length: count - 1 }, (_: unknown, i: number): Parameters<typeof staggerSwingBow>[2][number] => {
      const seconds: number =
        step.start + ((i + 1) / count) * (step.land - step.start);
      const feet: Record<"left" | "right", walkFoot.IScheduled> =
        this.standing(seconds);
      feet[step.side] = this.swungAt(step, seconds, 0);
      return { seconds, settled: this.settle(seconds, feet) };
    });
    const bow: number = staggerSwingBow(
      this.body,
      step,
      instants,
      (seconds: number, lateral: number): walkFoot.IScheduled => this.swungAt(step, seconds, lateral),
    );
    this.bows.set(step, bow);
    return bow;
  }
}
