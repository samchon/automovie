import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { walkFoot } from "../actions/walkFoot";
import { walkReach } from "../actions/walkReach";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import type { staggerRecover } from "./staggerRecover";
import { staggerSwingBow } from "./staggerSwingBow";

/**
 * A stagger's feet and pelvis at every second of its plan (`stagger`): the
 * pelvis carried by the recovery's centre of mass course, the feet standing
 * where the steps put them, and each step's swing as a walking foot swings,
 * risen first by the least toe clearance of walking and bowed around the
 * standing foot where it would pass into it.
 *
 * Every reading is a prepared curve evaluated at the second plus the walk's
 * own settling of the pelvis over its feet: the root is the entry's moved by
 * the centre of mass's travel (`staggerRecover.ICourses.course`), the trunk
 * upright over it, and lowered to the height its planted legs allow
 * (`walkReach.ground`, a scalar root of each leg's closed-form reach claim,
 * its heel rising about the ball where the ankle runs out of room); a
 * swinging foot follows its prepared walking-foot curve (`walkFoot.prepareSwing`)
 * between its two settled ends, its bow fixed in closed form for its step
 * (`staggerSwingBow`), and is held inside its leg's ranges under that pelvis
 * (`walkReach.prepareSwing`). The legs' admission (`staggerAdmission`)
 * already read this same pelvis at every step's mid-swing and landing.
 *
 * The instance prepares body-only swing reach once. Declared step endpoints,
 * swing readers and bows are lazy and bounded by the fixed recovery's steps;
 * no arbitrary-time result is retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read at a second, from which course, and how a swing is shaped.
 * @evidence contracts/development/design.md#principled-representation One plan's feet with the memoised stance ends, swing curves and bows they share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The readings the plan's leg row writes from.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The clearance, the lift and the sampling rate are `staggerBounds`'; the bow is the soles' own clearance.
 */
export class StaggerFeet {
  /** The feet as the entry stands them. */
  private readonly entered: Record<"left" | "right", HumanFoot.IPlacement>;

  /** The share of a swing a foot rises in (`staggerKnots.risingOf`). */
  private readonly rising: number;

  /** Each foot's stance at a step's start or landing, by side and second. */
  private readonly ends: Map<string, walkFoot.IEnd> = new Map();

  /** Each step's bow around the standing foot. */
  private readonly bows: Map<staggerRecover.IStep, number> = new Map();

  /** One fixed swing reader and nonzero-travel direction per recovery step. */
  private readonly swings: Map<staggerRecover.IStep, {
    from: walkFoot.IEnd;
    normal: IAutoMovieVector3 | undefined;
    at: (share: number) => walkFoot.IFoot;
  }> = new Map();

  /** The entry's posture. */
  private readonly posture: IHumanPosture;

  /** The body. */
  private readonly body: IHumanActionContext["body"];

  /** The recovery. */
  private readonly recovery: staggerRecover.IRecovery;

  /** Each side's body-only swing range and floor-clearance prerequisites. */
  private readonly swingReaches: Record<"left" | "right", ReturnType<typeof walkReach.prepareSwing>>;

  /**
   * Keep one plan's body, entry posture and recovery, and prepare each
   * side's body-only swing reach; endpoint, swing and bow work remains lazy
   * and bounded by the plan's declared steps.
   *
   * @param body The body.
   * @param entry The context's entry.
   * @param recovery The admitted recovery.
   */
  public constructor(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    recovery: staggerRecover.IRecovery,
  ) {
    this.body = body;
    this.recovery = recovery;
    this.posture = entry.posture;
    this.entered = StrikingTarget.feet(entry);
    this.rising = staggerKnots.risingOf(body);
    this.swingReaches = {
      left: walkReach.prepareSwing(body, "left"),
      right: walkReach.prepareSwing(body, "right"),
    };
  }

  /**
   * The pelvis and stances at a second: the entry's root moved by the
   * centre of mass's travel, the trunk upright, settled over the feet as
   * the walk settles its pelvis.
   *
   * @param seconds Seconds since the push.
   * @param feet The scheduled feet at that second.
   * @param resolution Optional exact FK source borrowed by the same synchronous settlement.
   * @returns The settled pelvis, feet and contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the time, the root's course, the upright trunk and the settling.
   * @evidence contracts/development/implementation.md#principled-implementation The pelvis carries the centre of mass's course (Hof's pendulum and its settling) and the walk's ground settling lowers it to the closed-form height the planted legs allow, each heel rising about its ball where the ankle runs out of room.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the course, place the root, settle with the walk's owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fit, tolerance, time memo or posed-result cache is introduced; the settling is the walk's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms One course read and one ground settling: a bracketed scalar root over at most two stance readers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The walk's ground owner settles every query; an optional parent FK source reaches only its hip reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains neither the FK source nor its result after return.
   */
  public settle(
    seconds: number,
    feet: Record<"left" | "right", walkFoot.IScheduled>,
    resolution?: Parameters<typeof walkReach.ground>[7],
  ): walkReach.IGround {
    const entry: IHumanPosture = this.posture;
    const travel: IAutoMovieVector3 = this.recovery.course(seconds);
    return walkReach.ground(
      this.body,
      { x: entry.root.x + travel.x, y: entry.root.y, z: entry.root.z + travel.z },
      entry.yaw,
      entry.joints.hips ?? [0, 0, 0],
      feet,
      {},
      undefined,
      resolution,
    );
  }

  /** The standing feet, each at the placement its latest landed step supplied.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads action-local seconds and returns fixed placement/toe records for both sides.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the ordered landed-step updates under the land-1e-9 comparison.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Entry feet form the base and one step scan replaces each landed side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves step order, endpoint placements and the landing comparison without interpolation.
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
   * @evidence contracts/development/common.md#meaningful-documentation Uses seconds since the push and the open swing intervals.
   * @evidence contracts/development/implementation.md#principled-implementation Starts from the landed feet and applies the bowed walking-foot law only for start<seconds<land, its bow the step's closed-form soles' clearance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing schedule and one step scan delegate active swing geometry to swungAt; end owns settled endpoints and staggerSwingBow the bow.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every interval predicate, endpoint, lift and bow; only declared step endpoints enter the endpoint map.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(s) schedule scans for s recovery steps, plus one closed-form bow per step on its first query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoints, swing curves and bows are kept per declared step of this fixed recovery; every queried share is evaluated afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most two endpoints and one swing/bow record per declared step remain with this finite recovery's plan.
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
   * (`walkReach.swing`).
   *
   * @param seconds Seconds since the push.
   * @param resolution Optional parent FK source borrowed only by this synchronous settlement.
   * @returns The scheduled, settled and reached feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the common clock and each part of the result.
   * @evidence contracts/development/implementation.md#principled-implementation Schedule both feet, settle the pelvis on the recovery's centre of mass course and reach each swinging foot with the walk's leg-range hold, in world metres, degrees and action seconds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One schedule and settlement precede at most two swings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The walk's foot and leg owners perform every hold; the result is not memoized by time.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(s) step scans, one course read, one ground settling and at most two prepared swing holds; no stance course and no iterative leg fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body-only reach readers serve the fixed body; all current-time feet remain actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result belongs to this evaluation; the FK loan ends with settlement.
   */
  public solve(seconds: number, resolution?: Parameters<typeof walkReach.ground>[7]): {
    feet: Record<"left" | "right", walkFoot.IScheduled>;
    settled: walkReach.IGround;
    reached: Record<"left" | "right", walkFoot.IEnd>;
  } {
    const feet: Record<"left" | "right", walkFoot.IScheduled> =
      this.scheduled(seconds);
    const settled: walkReach.IGround = this.settle(seconds, feet, resolution);
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
    return { feet, settled, reached };
  }

  /**
   * Settle a declared step endpoint once. Only immutable step start/landing
   * seconds form these side/second keys.
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
   * The first matching open swing's linear share at action-local seconds,
   * zero outside every swing.
   */
  private swinging(side: "left" | "right", seconds: number): number {
    for (const step of this.recovery.steps)
      if (step.side === side && seconds > step.start && seconds < step.land)
        return (seconds - step.start) / (step.land - step.start);
    return 0;
  }

  /**
   * A step's raised-start walking swing at action-local seconds and signed
   * lateral bow metres: the foot rises by CLEARANCE over the rising share,
   * then follows the prepared swing plus the 16*share^2*(1-share)^2 lateral
   * bump, resting at both endpoints, so it is continuous at lift-off and at
   * touch-down.
   */
  private swungAt(
    step: staggerRecover.IStep,
    seconds: number,
    bow: number,
  ): walkFoot.IScheduled {
    const { CLEARANCE }: typeof staggerBounds = staggerBounds;
    const rising: number = this.rising;
    const u: number = (seconds - step.start) / (step.land - step.start);
    const { from, at }: ReturnType<StaggerFeet["swingOf"]> = this.swingOf(step);
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
    const normal: IAutoMovieVector3 = this.normalOf(step);
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

  /** The unit a step's bow displaces its ankle along: its travel turned a quarter turn, or the entry's heading for a step in place. */
  private normalOf(step: staggerRecover.IStep): IAutoMovieVector3 {
    return this.swingOf(step).normal ?? HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: this.posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
  }

  /**
   * Prepare one immutable step's settled endpoints, raised-start walking
   * swing curve and nonzero-travel normal.
   */
  private swingOf(step: staggerRecover.IStep): {
    from: walkFoot.IEnd;
    normal: IAutoMovieVector3 | undefined;
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
        : undefined,
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

  /** One step's closed-form bow around the foot standing through its swing (`staggerSwingBow`), kept for the step. */
  private bowOf(step: staggerRecover.IStep): number {
    const known: number | undefined = this.bows.get(step);
    if (known !== undefined) return known;
    const stance: "left" | "right" = step.side === "left" ? "right" : "left";
    const bow: number = staggerSwingBow(
      this.body,
      step,
      this.standing(step.start)[stance].placement,
      this.normalOf(step),
      (seconds: number, lateral: number): walkFoot.IScheduled => this.swungAt(step, seconds, lateral),
    );
    this.bows.set(step, bow);
    return bow;
  }
}
