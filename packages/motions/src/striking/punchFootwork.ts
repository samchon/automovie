import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingArrest } from "./StrikingArrest";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingTwist } from "./StrikingTwist";
import type { punch } from "./punch";
import type { punchGeometry } from "./punchGeometry";

/**
 * A punch's root, heading and feet: the lead foot steps in by the advance
 * with a small lift, the rear foot drags after it from mid-delivery to
 * mid-return (the IBA stepping jab: the rear foot follows at once), and a
 * rear-hand punch pivots the rear foot on its ball.
 *
 * The trunk's turn is shared by the pelvis (two fifths) and the lumbar and
 * thoracic spine (three tenths each), as the rotation of a punch runs up the
 * spine; the pelvis alone would twist the planted hips past their range. The
 * trunk turns back only once a stepping punch's rear foot has landed from its
 * drag, and the rear foot's pivot returns on that same profile, so no planted
 * foot is twisted under a hip turning back over it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the step, the drag, the pivot and the shared trunk turn with their source.
 * @evidence contracts/development/design.md#principled-representation One footwork built from the punch's timing and its contact solution, read as a posture per second and as contact windows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the heel raise, the drag's share, the footwork and its inputs, which the punch's contact solution and geometry read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, foot placement and contact window types; every length comes from the punching body's measure.
 */
export namespace punchFootwork {
  /** Rear heel raise of a rear-hand punch's ball pivot at contact, degrees (provisional reading of the IBA cross drawing's released heel). */
  export const HEEL_RAISE: number = 15;

  /**
   * What the footwork is built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The punch's context and timing with the contact solution's line, step, turn and dip in metres and degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the values the feet and the trunk read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the context and timing types.
   */
  export interface IProps {
    /** The punch's context. */
    context: IHumanActionContext<punch.IParams>;

    /** The punch's timing. */
    timing: punchGeometry.ITiming;

    /** The horizontal unit line to the target. */
    line: IAutoMovieVector3;

    /** The lead foot's step along the line, metres. */
    advance: number;

    /** The trunk turn at contact, degrees. */
    turn: number;

    /** How far the root lowers at contact, metres. */
    dip: number;

    /** The committed stop's second, null when the arm met nothing, undefined when the punch offers no weapon. */
    fixed: number | null | undefined;

    /** The share of the way out at seconds since the start. */
    out(seconds: number): number;

    /** The share of the way back at seconds since the start. */
    back(seconds: number): number;
  }

  /**
   * A punch's built footwork.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it returns.
   * @evidence contracts/development/design.md#principled-representation A posture per second with the trunk's turn on its own clock, and the feet's contact windows as shares.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the punch's geometry reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture and contact window types.
   */
  export interface IFootwork {
    /**
     * The posture without the punching arm.
     *
     * @param seconds Seconds since the start, the feet's clock.
     * @param clock The trunk turn's clock; the feet's own when absent.
     */
    base(seconds: number, clock?: number): IHumanPosture;

    /** The feet's contact windows, as shares of the punch. */
    contacts: IHumanContactWindow[];
  }

  /**
   * The share of its drag the rear foot has made.
   *
   * @param timing The punch's timing.
   * @param seconds Seconds since the start.
   * @returns The share in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace states the drag's window.
   * @evidence contracts/development/implementation.md#principled-implementation A minimum-jerk profile from mid-delivery to mid-return.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression over the window.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function drag(timing: punchGeometry.ITiming, seconds: number): number {
    const from: number = 0.5 * timing.shown;
    const to: number = timing.shown + 0.5 * timing.recoil;
    return minimumJerk((seconds - from) / (to - from)).s;
  }

  /**
   * The share of the step the root has carried the shoulder by the contact.
   *
   * @param timing The punch's timing.
   * @returns The share in [0.5, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the share measures.
   * @evidence contracts/development/implementation.md#principled-implementation The root travels with the mean of the two feet: the lead foot's whole step and the rear foot's drag so far.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function carried(timing: punchGeometry.ITiming): number {
    return 0.5 * (1 + drag(timing, timing.shown));
  }

  /**
   * Build a punch's footwork.
   *
   * @param props The context, the timing and the contact solution's values.
   * @returns The footwork.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input and result; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation The feet slide along the line on minimum-jerk shares, a step into a met body is arrested from the speed it had, and the legs are solved onto the placed feet.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The feet's travel first, then the posture per second, then the contact windows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A planted foot is never moved by the trunk's clock; the stance keeps its length when a step is arrested.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the lower body's fit.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each posture is a different second; the geometry that holds the footwork is built once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the entry's two foot placements, released with the geometry.
   */
  export function create(props: IProps): IFootwork {
    const { context, timing, line, advance, turn, dip, fixed, out, back } =
      props;
    const { lead, which, shown, recoil, duration } = timing;
    const body = context.body;
    const t0: number = context.start;
    const entry: IHumanPosture = context.entry.posture;
    const dragFrom: number = 0.5 * shown;
    const dragTo: number = shown + 0.5 * recoil;
    const dragged = (t: number): number => drag(timing, t);

    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const rear: "left" | "right" = StrikingStance.rear({ lead });
    const stepping: boolean = advance > 0.02;
    const lift: number = 0.015 * body.measure.stature;
    const turnBack = (t: number): number =>
      stepping
        ? minimumJerk((t - dragTo) / Math.max(1e-3, duration - dragTo)).s
        : back(t);

    // The feet keep the punch's clock; the trunk's turn may run on another
    // (a withdrawal's), so a stopped punch can turn back without moving a
    // planted foot.
    //
    // A stepping punch that meets a body before its lead foot has landed does
    // not finish the step into that body: from the stop the lead foot's
    // travel is arrested from the speed it had ({@link StrikingArrest}),
    // landing at the planned second, and the rear foot drags up to where the
    // lead foot came to rest, so the stance keeps its length.
    let travel = (t: number): number => (stepping ? advance * out(t) : 0);
    let follow = (t: number): number => (stepping ? advance * dragged(t) : 0);
    if (
      stepping &&
      fixed !== undefined &&
      fixed !== null &&
      fixed - t0 < shown
    ) {
      const s: number = Math.max(0, fixed - t0);
      const from: number = advance * out(s);
      const speed: number = (advance * minimumJerk(s / shown).ds) / shown;
      const rest: number = StrikingArrest.rest(from, speed, shown - s);
      travel = (t: number): number =>
        t <= s
          ? advance * out(t)
          : StrikingArrest.settle(from, speed, rest, shown - s, t - s);
      follow =
        s <= dragFrom
          ? (t: number): number => rest * dragged(t)
          : (t: number): number =>
              t <= s
                ? advance * dragged(t)
                : StrikingArrest.settle(
                    advance * dragged(s),
                    (advance *
                      minimumJerk((s - dragFrom) / (dragTo - dragFrom)).ds) /
                      (dragTo - dragFrom),
                    rest,
                    dragTo - s,
                    t - s,
                  );
    }
    const base = (t: number, clock: number = t): IHumanPosture => {
      const turning: number = out(clock) - turnBack(clock);
      const moved: number = travel(t);
      const followed: number = follow(t);
      const leadFoot: HumanFoot.IPlacement = StrikingTarget.slide(
        feet[lead],
        line,
        moved,
        stepping ? lift * 4 * out(t) * (1 - out(t)) : 0,
      );
      const slid: HumanFoot.IPlacement = StrikingTarget.slide(
        feet[rear],
        line,
        followed,
        stepping ? lift * 4 * dragged(t) * (1 - dragged(t)) : 0,
      );
      const rearFoot: HumanFoot.IPlacement =
        which === "rear"
          ? StrikingTarget.pivot(
              body,
              rear,
              slid,
              0.5 * turn * turning,
              HEEL_RAISE * turning,
            )
          : slid;
      const placed: Record<"left" | "right", HumanFoot.IPlacement> =
        lead === "left"
          ? { left: leadFoot, right: rearFoot }
          : { left: rearFoot, right: leadFoot };
      const leadDown: boolean = !stepping || t >= shown;
      const rearDown: boolean = !stepping || t <= dragFrom || t >= dragTo;
      return resolveHumanPosture.lower(
        body,
        {
          root: Vector3.add(
            { ...entry.root, y: entry.root.y - dip * turning },
            Vector3.scale(line, 0.5 * (moved + followed)),
          ),
          yaw: entry.yaw + 0.4 * turn * turning,
          pitch: entry.pitch,
          roll: entry.roll,
          joints: StrikingStance.facing(
            {
              ...entry.joints,
              ...StrikingStance.joints(),
              ...StrikingTwist.trunk(entry.joints, 0.3 * turn * turning),
            },
            turn * turning,
          ),
          limbs: StrikingStance.legs(
            body,
            placed,
            lead === "left"
              ? { left: leadDown, right: rearDown }
              : { left: rearDown, right: leadDown },
          ),
        },
        5,
      );
    };

    // The feet's contact windows, as shares of the punch.
    const contacts: IHumanContactWindow[] = [];
    const window = (
      part: "leftFoot" | "rightFoot",
      kind: "plant" | "pivot",
      from: number,
      to: number,
    ): void => {
      if (to > from)
        contacts.push({
          part,
          kind,
          from: from / duration,
          to: to / duration,
          support: { kind: "ground" },
        });
    };
    const rearKind: "plant" | "pivot" = which === "rear" ? "pivot" : "plant";
    window(`${lead}Foot`, "plant", stepping ? shown : 0, duration);
    if (stepping) {
      window(`${rear}Foot`, rearKind, 0, dragFrom);
      window(`${rear}Foot`, "plant", dragTo, duration);
    } else window(`${rear}Foot`, rearKind, 0, duration);

    return { base, contacts };
  }
}
