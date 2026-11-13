import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingReach } from "./StrikingReach";
import type { StrikingRecord } from "./StrikingRecord";
import { StrikingRoom } from "./StrikingRoom";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import type { punch } from "./punch";
import { punchContact } from "./punchContact";
import { punchFootwork } from "./punchFootwork";

/**
 * A built punch: the stroke of the wrist from the launch through the contact
 * back to the guard, composed with the footwork into a posture per second.
 *
 * The contact is solved first ({@link punchContact}), the feet and the trunk
 * follow it ({@link punchFootwork}), and the wrist travels on superposed
 * minimum-jerk units through the contact point ({@link StrikingStroke}). A
 * punch stopped on a body holds for the dwell, then its arm and its trunk's
 * turn retrace the approach back to the launch, the wrist carried onto the
 * guard it returns to: every configuration of the approach up to the first
 * contact was clear of the body it met, so the way back is too, where a
 * straight return to the guard cuts through a covering glove.
 *
 * The arm travels between two named configurations
 * (`IHumanPosture.IGoal.reference`): the one it launches in, read off the
 * entry pose, and the one it has at the contact, that instant's own solution
 * read once. Every goal of the stroke is anchored at full weight on their
 * mix by the fist's share of the way out, and back by its share of the
 * return, so the elbow stays on one side of the choice where two
 * configurations nearly tie. A reference that fades near the guard left that
 * choice free there, and the elbow jumped 15 cm between two solutions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order of the build, the retraced return of a stopped punch and the arm's one reference solution.
 * @evidence contracts/development/design.md#principled-representation One geometry per committed stop, read as postures in world metres and seconds, contact windows and a record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the timing the plan decides, the built geometry and its builder, which the punch law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, contact window and record types; the stroke scans nothing itself, the stop is the performance's joint resolution.
 */
export namespace punchGeometry {
  /**
   * A punch's timing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation Closed side unions and durations in seconds, decided once by the plan.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the contact solution, the footwork and the stroke read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the guard drop type.
   */
  export interface ITiming {
    /** The punching side. */
    side: "left" | "right";

    /** The stance's lead side. */
    lead: "left" | "right";

    /** Lead or rear hand. */
    which: "lead" | "rear";

    /** Launch to contact, seconds. */
    delivery: number;

    /** Launch to the contact or the feint's shown peak, seconds. */
    shown: number;

    /** The return to the guard, seconds. */
    recoil: number;

    /** The guard drop. */
    drop: StrikingSkill.IGuardDrop;

    /** The whole punch, seconds. */
    duration: number;
  }

  /**
   * A built punch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   * @evidence contracts/development/design.md#principled-representation A posture per second, contact windows as shares and the striking record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, contact window and record types.
   */
  export interface IGeometry {
    /** The posture at seconds since the start. */
    posture(seconds: number): IHumanPosture;

    /** The feet's contact windows. */
    contacts: IHumanContactWindow[];

    /** What the punch decided. */
    record: StrikingRecord.IRecord;
  }

  /**
   * Build a punch's geometry from its first posture evaluation.
   *
   * @param context The action's context.
   * @param timing The punch's timing.
   * @param fixed The committed stop's second, null when the arm met nothing, undefined when the punch offers no weapon.
   * @param tangent The varied point within a person's region, when the punch varies.
   * @returns The geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its inputs and result; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation Superposed minimum-jerk units carry the wrist through the solved contact point, and the mix of the arm's launch and contact solutions anchors every goal of the stroke at full weight.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The contact, the footwork, the stroke, the composed posture, then the record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A feint is shown to its declared share and never into a person's guard; the stroke decides no stop the performance has not made.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the footwork's fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The arm's reference solution at the contact is resolved once and reused by every posture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the contact, the footwork, the stroke and one reference, released with the plan's geometry.
   */
  export function build(
    context: IHumanActionContext<punch.IParams>,
    timing: ITiming,
    fixed: number | null | undefined,
    tangent: resolveAutoMovieHumanoidSurfaces.ITangent | undefined,
  ): IGeometry {
    const p: punch.IParams = context.params;
    const { side, lead, shown, recoil, drop, duration } = timing;
    const body = context.body;
    const m = body.measure;
    const t0: number = context.start;
    const arm: "leftArm" | "rightArm" =
      side === "left" ? "leftArm" : "rightArm";
    const contact: punchContact.IContact = punchContact.solve(
      context,
      timing,
      tangent,
    );
    const { line, rotation, socket, tracker, bones, shoulder, solved } =
      contact;

    const origin: IAutoMovieVector3 = bones.get(
      `${side}Hand` as AutoMovieHumanoidBone,
    )!.worldPosition;
    const startRotation: IAutoMovieQuaternion = bones.get(
      `${side}Hand` as AutoMovieHumanoidBone,
    )!.worldRotation;
    const startElbow: IAutoMovieVector3 = bones.get(
      `${side}LowerArm` as AutoMovieHumanoidBone,
    )!.worldPosition;

    // Shares through the punch: out to the contact, back to the guard.
    const out = (t: number): number => minimumJerk(t / shown).s;
    const back = (t: number): number => minimumJerk((t - shown) / recoil).s;
    const sag = (t: number): number =>
      drop.seconds > 0
        ? back(t) - minimumJerk((t - shown - recoil) / drop.seconds).s
        : 0;
    const footwork: punchFootwork.IFootwork = punchFootwork.create({
      context,
      timing,
      line,
      advance: contact.advance,
      turn: contact.turn,
      dip: contact.dip,
      fixed,
      out,
      back,
    });

    // The guard the hand returns to, and the stroke from the launch through
    // the contact back to it, stopping on the struck body's first surface.
    const guardEnd: IHumanPosture.IGoal = StrikingStance.guard(
      body,
      footwork.base(duration),
      { lead },
    )[arm]!;
    const rotationAt = (t: number): IAutoMovieQuaternion =>
      Quaternion.slerp(
        Quaternion.slerp(startRotation, rotation, out(t)),
        startRotation,
        back(t),
      );
    const lag: number = StrikingSkill.lag(context.skill) * shown;

    // A feint is shown to its declared share, never into a person's guard.
    const reached: IAutoMovieVector3 =
      p.feint === undefined
        ? solved.end
        : Vector3.lerp(
            origin,
            solved.end,
            StrikingRoom.feint(context, p.at, {
              declared: minimumJerk(p.feint).s,
              aimed: contact.first,
              origin,
              end: solved.end,
              reach: Vector3.length(socket),
              line,
              launch: t0,
            }),
          );
    const units = StrikingStroke.delivery({
      origin,
      impact: reached,
      direction:
        p.feint === undefined
          ? contact.direction
          : Vector3.subtract(reached, origin),
      launch: t0 + lag,
      contact: t0 + shown,
      speed: p.feint === undefined ? StrikingSkill.IMPACT_SPEED_SHARE.punch : 1,
      // The fist's own movement reaches the measured peak; the body turns
      // and steps over the whole delivery.
      ...(p.feint === undefined
        ? { peak: StrikingSkill.punchPeak(context.skill) }
        : {}),
    });
    // The stop is the performance's joint resolution of the arm's capsules
    // (`fixed`); the stroke scans nothing itself.
    const stroke: StrikingStroke.IStroke = StrikingStroke.create({
      origin,
      units,
      ...(p.feint === undefined ? { tracker } : {}),
      contact: t0 + shown,
      back: guardEnd.point,
      recoil,
      scan: { from: t0, to: t0 + shown + 0.1, step: 1 / 96 },
      ...(fixed === undefined ? {} : { fixed }),
    });

    // The punch's posture for a wrist goal at a second, the arm's elbow and
    // the trunk's turn on a clock (the second itself unless withdrawing),
    // anchored between the arm's launch configuration and its solution at
    // the contact.
    const launch: IHumanPosture.IReference = resolveHumanPosture.reference(
      context.entry.pose,
      arm,
    );
    let anchor: IHumanPosture.IReference | undefined;
    let anchoring: boolean = false;
    const compose = (
      t: number,
      end: IAutoMovieVector3,
      clock: number = t,
    ): IHumanPosture => {
      if (anchor === undefined && !anchoring) {
        anchoring = true;
        try {
          anchor = resolveHumanPosture.reference(
            resolveHumanPosture(body, compose(shown, reached)),
            arm,
          );
        } finally {
          anchoring = false;
        }
      }
      const held: number = Math.max(0, Math.min(1, out(clock) - back(clock)));
      const posture: IHumanPosture = footwork.base(t, clock);
      const guard = StrikingStance.guard(body, posture, { lead });
      const elbow: IAutoMovieVector3 = Vector3.lerp(
        Vector3.lerp(
          startElbow,
          StrikingReach.hint(shoulder, solved, contact.bend, 0.25 * m.upperArm),
          out(clock),
        ),
        guard[arm]!.bend,
        back(clock),
      );
      const wrist: IAutoMovieVector3 = Vector3.add(end, {
        x: 0,
        y: -drop.depth * sag(t),
        z: 0,
      });
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...guard,
          [arm]: {
            point: wrist,
            bend: elbow,
            rotation: rotationAt(clock),
            ...(anchor === undefined
              ? {}
              : {
                  reference: {
                    // Blended as rotations: the launch and the contact
                    // may be written in different charts of the shoulder.
                    upper: blendHumanJoint(
                      body,
                      `${side}UpperArm`,
                      launch.upper,
                      anchor.upper,
                      held,
                    ),
                    lower: blendHumanJoint(
                      body,
                      `${side}LowerArm`,
                      launch.lower,
                      anchor.lower,
                      held,
                    ),
                  },
                }),
          },
        },
      };
    };

    return {
      contacts: footwork.contacts,
      record: {
        limb: side === "left" ? "leftHand" : "rightHand",
        offset: contact.offset,
        planned: tracker.planned,
        reached: Vector3.add(solved.end, socket),
        status: solved.status,
        stop: stroke.stop,
      },
      posture: (t: number): IHumanPosture => {
        const at: number | undefined = stroke.stop(t0 + t);
        if (at === undefined || t <= at - t0)
          return compose(t, stroke.end(t0 + t));

        // Held for the dwell, then the approach is retraced on a minimum-jerk
        // clock, the wrist carried onto the guard it returns to.
        const s: number = at - t0;
        const w: number = minimumJerk(
          (t - s - StrikingStroke.DWELL) /
            Math.max(1e-3, duration - s - StrikingStroke.DWELL),
        ).s;
        const clock: number = s * (1 - w);
        return compose(
          t,
          Vector3.add(
            stroke.free(t0 + clock),
            Vector3.scale(Vector3.subtract(guardEnd.point, origin), w),
          ),
          clock,
        );
      },
    };
  }
}
