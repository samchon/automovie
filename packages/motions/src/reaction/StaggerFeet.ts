import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanLegChain, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanWalkFoot, IAutoMovieMotionHumanWalkLegClearance, IAutoMovieMotionHumanWalkStanceCourse, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3, minimumJerk } from "@automovie/engine";

import { walkFoot } from "../actions/walkFoot";
import { walkLegClearance } from "../actions/walkLegClearance";
import { walkReach } from "../actions/walkReach";
import { walkReachHeld } from "../actions/walkReachHeld";
import { walkStanceCourse } from "../actions/walkStanceCourse";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanLegChain } from "../posture/HumanLegChain";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import type { staggerRecover } from "./staggerRecover";

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
  private readonly entered: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;

  /** The share of a swing a foot rises in (`staggerKnots.risingOf`). */
  private readonly rising: number;

  /** Each foot's stance at a step's start or landing, by side and second. */
  private readonly ends: Map<string, walkFoot.IEnd> = new Map();

  /** Each step's bow around the standing leg. */
  private readonly bows: Map<staggerRecover.IStep, number> = new Map();

  /** The entry's posture. */
  private readonly posture: IAutoMovieMotionHumanPosture;

  /** The body. */
  private readonly body: IAutoMovieMotionHumanActionContext["body"];

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
   */
  public constructor(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
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

  /** The judged course. */
  public course(): IAutoMovieMotionHumanWalkStanceCourse.ICourse {
    return this.recovery.stances!;
  }

  /** The pelvis and the stances at a second, as the course holds them. */
  public settle(
    seconds: number,
    feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled>,
  ): walkReach.IGround {
    const entry: IAutoMovieMotionHumanPosture = this.posture;
    const reading: IAutoMovieMotionHumanWalkStanceCourse.IReading = walkStanceCourse.at(
      this.course(),
      seconds,
    );
    return walkReachHeld.held(
      this.body,
      staggerKnots
        .frame(this.body, entry, this.bend, this.recovery.course(seconds), feet)
        .root(reading.trunk),
      entry.yaw,
      entry.joints.hips ?? [0, 0, 0],
      feet,
      reading,
    );
  }

  /** The feet as they stand at a second no foot swings: each where the last of its steps put it. */
  public standing(
    seconds: number,
  ): Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled> {
    const out: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled> = {
      left: { placement: this.entered.left, toes: 0 },
      right: { placement: this.entered.right, toes: 0 },
    };
    for (const step of this.recovery.steps)
      if (seconds >= step.land - 1e-9)
        out[step.side] = { placement: step.to, toes: 0 };
    return out;
  }

  /** The feet at a second as a gait schedules them: a stance where it stands, and a swing as a walking foot swings. */
  public scheduled(
    seconds: number,
  ): Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled> {
    const out: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled> =
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
   */
  public solve(seconds: number): {
    feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled>;
    settled: walkReach.IGround;
    reached: Record<"left" | "right", walkFoot.IEnd>;
  } {
    const feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled> =
      this.scheduled(seconds);
    const settled: walkReach.IGround = this.settle(seconds, feet);
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
    return { feet, settled, reached };
  }

  /** A foot's stance as reached at a step's start or landing, when both feet stand, memoised by its second. */
  private end(side: "left" | "right", seconds: number): walkFoot.IEnd {
    const key: string = `${side}:${seconds}`;
    let out: walkFoot.IEnd | undefined = this.ends.get(key);
    if (out === undefined) {
      out = this.settle(seconds, this.standing(seconds)).feet[side];
      this.ends.set(key, out);
    }
    return out;
  }

  /** The share of its swing a foot is at. */
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
   */
  private swungAt(
    step: staggerRecover.IStep,
    seconds: number,
    bow: number,
  ): IAutoMovieMotionHumanWalkFoot.IScheduled {
    const { CLEARANCE, LIFT } = staggerBounds;
    const rising: number = this.rising;
    const u: number = (seconds - step.start) / (step.land - step.start);
    const from: walkFoot.IEnd = this.end(step.side, step.start);
    const to: walkFoot.IEnd = this.end(step.side, step.land);
    const raised: walkFoot.IEnd = {
      ...from,
      ankle: { ...from.ankle, y: from.ankle.y + CLEARANCE },
    };
    const share: number = Math.max(0, (u - rising) / (1 - rising));
    const swung: IAutoMovieMotionHumanWalkFoot.IFoot =
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
        : walkFoot.swing(this.body, step.side, {
            from: raised,
            velocity: { x: 0, y: 0, z: 0 },
            to,
            u: share,
            seconds: (1 - rising) * (step.land - step.start),
            lift: LIFT,
          });
    const travel: IAutoMovieVector3 = {
      x: to.ankle.x - from.ankle.x,
      y: 0,
      z: to.ankle.z - from.ankle.z,
    };
    const size: number = Vector3.length(travel);
    const normal: IAutoMovieVector3 =
      size > 1e-9
        ? { x: -travel.z / size, y: 0, z: travel.x / size }
        : HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: this.posture.yaw },
            { x: 0, y: 0, z: 1 },
          );
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
   * A swing that passes the standing leg goes around it: its path bows
   * across its travel, to whichever side asks less, by the least that keeps
   * the swinging leg clear of the standing one as the tangle audit reads
   * them (`walkLegClearance`), read at the stance course's knots (`KNOTS`)
   * through the swing and bisected to a millimetre; a swing already clear
   * keeps its path.
   */
  private bowOf(step: staggerRecover.IStep): number {
    const known: number | undefined = this.bows.get(step);
    if (known !== undefined) return known;
    const body = this.body;
    const stance: "left" | "right" = step.side === "left" ? "right" : "left";
    const count: number = Math.ceil(
      (step.land - step.start) * staggerBounds.KNOTS,
    );
    const instants = Array.from({ length: count - 1 }, (_: unknown, i: number) => {
      const seconds: number =
        step.start + ((i + 1) / count) * (step.land - step.start);
      const feet: Record<"left" | "right", IAutoMovieMotionHumanWalkFoot.IScheduled> =
        this.standing(seconds);
      feet[step.side] = this.swungAt(step, seconds, 0);
      return { seconds, settled: this.settle(seconds, feet) };
    });
    // Each leg as the posture's own fit poses it there (`HumanLegChain`),
    // its knee bent toward the hint the posture gives it.
    const legOf = (
      side: "left" | "right",
      settled: walkReach.IGround,
      foot: walkFoot.IEnd,
    ): IAutoMovieMotionHumanWalkLegClearance.ILeg => {
      const pelvis: IAutoMovieQuaternion =
        settled.pelvis ??
        resolveHumanPosture.heading({ yaw: settled.yaw, pitch: 0, roll: 0 });
      const swivel: IAutoMovieMotionHumanLegChain.ISwivel = HumanLegChain.fit(
        body,
        side,
        pelvis,
        settled.hips[side],
        foot.ankle,
        staggerKnots.kneePole(
          body,
          settled.root,
          settled.yaw,
          side,
          HumanFoot.heading(foot.rotation),
        ),
        foot.rotation,
      );
      return {
        ...HumanLegChain.pose(
          body,
          side,
          pelvis,
          settled.hips[side],
          foot.ankle,
          swivel,
        )!,
        side,
        rotation: foot.rotation,
      };
    };
    // The standing leg's fit is read once a knot.
    const standingLegs: IAutoMovieMotionHumanWalkLegClearance.ILeg[] = instants.map(({ settled }) =>
      legOf(stance, settled, settled.feet[stance]),
    );
    const worst = (bow: number): number => {
      let out: number = 0;
      for (const [i, { seconds, settled }] of instants.entries()) {
        const reached: walkFoot.IEnd = walkReach.swing(
          body,
          step.side,
          settled,
          this.swungAt(step, seconds, bow),
          (seconds - step.start) / (step.land - step.start),
        );
        out = Math.max(
          out,
          walkLegClearance.excess(
            body,
            legOf(step.side, settled, reached),
            standingLegs[i]!,
          ),
        );
      }
      return out;
    };
    let bow: number = 0;
    if (worst(0) > walkLegClearance.BOUND) {
      const widest: number =
        2 *
        Vector3.length(
          Vector3.subtract(
            HumanFoot.point(body, step.side, "toe", step.from),
            HumanFoot.point(body, step.side, "heel", step.from),
          ),
        );
      const sides = [1, -1].map((way: number) => {
        if (worst(way * widest) > walkLegClearance.BOUND)
          return { way, bow: Infinity, at: worst(way * widest) };
        let lo: number = 0;
        let hi: number = widest;
        while (hi - lo > 0.001) {
          const mid: number = (lo + hi) / 2;
          if (worst(way * mid) > walkLegClearance.BOUND) lo = mid;
          else hi = mid;
        }
        return { way, bow: hi, at: 0 };
      });
      const pick = sides.reduce((a, b) =>
        a.bow < b.bow || (a.bow === b.bow && a.at <= b.at) ? a : b,
      );
      bow = pick.way * (Number.isFinite(pick.bow) ? pick.bow : widest);
    }
    this.bows.set(step, bow);
    return bow;
  }
}
