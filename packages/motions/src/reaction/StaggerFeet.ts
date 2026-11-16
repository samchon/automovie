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

  /**
   * The feet of one plan.
   *
   * @param body The body.
   * @param entry The context's entry.
   * @param recovery The judged recovery.
   * @param bend The trunk's shift of the centre of mass per sine of its tilt.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines one judged recovery's body, entry feet, bending and swing-rise share.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the original entry foot placements and contact-height-derived rise share for the same fixed recovery course.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One plan-owned object holds fixed recovery geometry and bounded per-step preparation maps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original course, entry posture and measured rise formula remain authoritative.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant constructor work; endpoint settlement and bow fitting remain lazy until a step is queried.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body, entry and immutable recovery steps define equivalence for each endpoint/swing/bow preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning plan retains this object; at most two endpoint records and one swing/bow record per recovery step grow lazily and release with the plan.
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
   * @evidence contracts/development/implementation.md#principled-implementation Starts from actual landed feet and applies the original bowed walking-foot law only for start<seconds<land.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing schedule and one step scan delegate active swing geometry to swungAt.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original interval predicates and original clearance-selected bow for every step.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(s) schedule scans, plus a lazy one-time bow search when an unprepared step is first queried.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same immutable step reuses only its endpoint/swing/bow preparation; every queried share receives the actual swing evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Query outputs release with callers while per-step preparation remains bounded by this recovery's finite steps and plan lifetime.
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
   * @evidence contracts/development/implementation.md#principled-implementation Schedule both feet, read their judged stance course, hold the pelvis and reach each swinging foot with the original leg-range fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One schedule, course read and settlement, then at most two swings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The unchanged foot and leg owners still perform every fit; the returned reading is not memoized by time.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant course lookup and two-foot work; stagger reuses the returned trunk reading instead of interpolating it again, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work settle receives this exact same-second reading, also returned to stagger's trunk writer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record belongs to this synchronous writer evaluation; no new per-time state is retained by StaggerFeet.
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
        reached[side] = walkReach.swing(
          this.body,
          side,
          settled,
          feet[side],
          this.swinging(side, seconds),
        );
    return { feet, settled, reached, reading };
  }

  /** A fixed recovery endpoint's settled foot, indexed by its side and second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Only the owning immutable step's start/landing seconds are supplied, under this same body/recovery/course.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original standing schedule and held-course settlement at the exact endpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One endpoint key guards one original settlement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reuses the actual settled endpoint without changing its pose, sample time or course.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant lookup; each distinct queried step endpoint performs settlement once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The private caller supplies only fixed endpoints of this instance's immutable recovery, so side/time plus the owning instance fix every dependency.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most two endpoint records per recovery step are retained in this plan-owned map, released with the instance.
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

  /** The current open swing interval's linear share for one foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Uses action-local seconds and returns zero when this side has no open swing.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the first matching original step and its normalized elapsed-time expression.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered step scan returns the matching share or original zero default.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps original strict endpoints and order, without rounding time or extending a swing.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(s) scans and constant scalar storage for s steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads fixed step windows while every queried second is evaluated directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Stores no time or share history.
   */
  private swinging(side: "left" | "right", seconds: number): number {
    for (const step of this.recovery.steps)
      if (step.side === side && seconds > step.start && seconds < step.land)
        return (seconds - step.start) / (step.land - step.start);
    return 0;
  }

  /**
   * A step's swinging foot at a second of its swing, its path bowed across
   * its travel by `bow` metres on a bump at rest at both ends. The foot
   * first rises clear of the floor, by the least toe clearance of walking,
   * over the share of the swing a walking foot takes to set down from that
   * height, then swings from there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines same-step seconds, signed lateral bow metres, rise share and exact endpoint-rest bump.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves original minimum-jerk initial clearance, walking-foot swing and 16*share^2*(1-share)^2 lateral bow along the original perpendicular direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed endpoint/normal data come from swingOf; this reader computes only the current rise, swing share and bow displacement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains all original lift, clearance, rise/terminal timing and pelvis swing claims without resampling.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant current-share work after one fixed reader preparation per step; repeated endpoint angle decomposition and normal construction are avoided.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only fixed immutable step/body/course endpoints and the original normal; current seconds and bow still produce a fresh foot placement.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned sample belongs to its caller; no per-second or per-bow sample cache is retained.
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
                y: from.ankle.y + CLEARANCE * minimumJerk(u / rising).s,
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

  /** Fixed endpoint geometry shared by every query and bow trial of a step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns this step's original settled start, lateral unit normal and prepared raised-foot swing reader.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original raised start, settled landing, fixed zero velocity, LIFT and remaining swing duration with the exact original travel-normal/heading fallback formula.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One step-identity lookup guards fixed endpoint and walking-foot preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the 1e-9 travel-size branch, original rise split and actual endpoints without a changed path or target.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant setup once per step and constant map lookup afterward; endpoint geometry, direction and swing angle terms are not rebuilt per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Immutable recovery step identity under this fixed body/course instance determines every prepared input; the reader never retains time-query answers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One fixed record/reader per queried recovery step is retained until this plan-owned instance is released.
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
   * A swing that passes the standing leg goes around it: its path bows
   * across its travel, to whichever side asks less, by the least that keeps
   * the swinging leg clear of the standing one as the tangle audit reads
   * them (`walkLegClearance`), read at the stance course's knots (`KNOTS`)
   * through the swing and bisected to a millimetre; a swing already clear
   * keeps its path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States original sample rate, millimetre bisection and memoized per-step signed bow.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the original strictly interior knot instants and their unbowed settlements, then delegates the unchanged two-sided tangle-bound search to staggerSwingBow.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Per-step ownership stays here while the fixed-observation clearance search has one source owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains all original instants, endpoint exclusion, zero-bow frame and winning scalar without reducing fitting or clearance checks.
   * @evidence contracts/development/implementation.md#efficient-algorithms Observations are settled once per step; the original sampled bisection cost is paid only on the first query of that immutable step.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Step identity plus this instance's fixed body, entry, course and endpoints determines the completed bow search; no changing time query forms a key.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary observations/search readers release on return or failure, and one scalar per queried step remains until the plan releases this instance.
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
