import {
  Quaternion,
  Vector3,
  minimumJerk,
  superposeMinimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieMotionHumanStrikingReach,
  IAutoMovieMotionHumanStrikingRecord,
  IAutoMovieMotionHumanStrikingSkill,
  IAutoMovieMotionHumanStrikingStroke,
  IAutoMovieQuaternion,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingRoom } from "./StrikingRoom";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { punchAnchored } from "./punchAnchored";
import { punchCompose } from "./punchCompose";
import { punchContact } from "./punchContact";
import { punchCorrected } from "./punchCorrected";
import { punchFootwork } from "./punchFootwork";
import type { punchLaunch } from "./punchLaunch";
import type { punchReach } from "./punchReach";

/** The alternatives of `BuildOff`'s site. */
type BuildOff = "leftArm" | "rightArm";

/** The alternatives of `TimingWhich`'s site. */
type TimingWhich = "lead" | "rear";

/**
 * A built punch: the stroke of the wrist from the launch through the contact
 * back to the guard, composed with the footwork into a posture per second.
 *
 * The contact is solved first ({@link punchContact}), the feet and the trunk
 * follow it ({@link punchFootwork}), and the wrist travels on superposed
 * minimum-jerk units through the contact point ({@link StrikingStroke}). A punch
 * stopped on a body holds for the dwell, then its arm and its trunk's turn
 * retrace the approach back to the launch, the wrist carried onto the guard it
 * returns to: every configuration of the approach up to the first contact was
 * clear of the body it met, so the way back is too, where a straight return to
 * the guard cuts through a covering glove.
 *
 * The arm travels between two named configurations
 * (`HumanPosture.IGoal.reference`): the one it launches in, read off the entry
 * pose, and the one it has at the contact, that instant's own solution read
 * once. Every goal of the stroke is anchored at full weight on their mix by the
 * fist's share of the way out, and back by its share of the return, so the
 * elbow stays on one side of the choice where two configurations nearly tie. A
 * reference that fades near the guard left that choice free there, and the
 * elbow jumped 15 cm between two solutions.
 */
export namespace punchGeometry {
  /** A punch's timing. */
  export interface ITiming {
    /** The punching side. */
    side: AutoMovieHumanSide;

    /** The stance's lead side. */
    lead: AutoMovieHumanSide;

    /** Lead or rear hand. */
    which: TimingWhich;

    /** Launch to contact, seconds. */
    delivery: number;

    /** Launch to the contact or the feint's shown peak, seconds. */
    shown: number;

    /** The return to the guard, seconds. */
    recoil: number;

    /** The guard drop. */
    drop: IAutoMovieMotionHumanStrikingSkill.IGuardDrop;

    /** The whole punch, seconds. */
    duration: number;
  }

  /** A built punch. */
  export interface IGeometry {
    /**
     * The complete posture at local seconds, borrowing only current same-body
     * FK/ROM metadata.
     */
    posture(
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture;

    /** The feet's contact windows. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /** What the punch decided. */
    record: IAutoMovieMotionHumanStrikingRecord.IRecord;
  }

  /**
   * Build a punch's geometry from its first posture evaluation.
   *
   * @param context The action's context.
   * @param timing The punch's timing.
   * @param fixed The committed stop's second, null when the arm met nothing,
   *   undefined when the punch offers no weapon.
   * @param tangent The varied point within a person's region, when the punch
   *   varies.
   * @param entered What the punch reads of its own entry alone (`punchLaunch`),
   *   made once for the plan.
   * @returns The geometry.
   */
  export function build(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>,
    timing: ITiming,
    fixed: number | null | undefined,
    tangent: IAutoMovieHumanoidSurfaces.ITangent | undefined,
    entered: punchLaunch.ILaunch,
  ): IGeometry {
    const p: IAutoMovieMotionHumanPunch.IParams = context.params;
    const { side, lead, shown, recoil, drop, duration }: ITiming = timing;
    const guardAt: ReturnType<typeof StrikingStance.prepareGuard> =
      StrikingStance.prepareGuard(context.body, { lead });
    const body: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>["body"] =
      context.body;
    const t0: number = context.start;
    const arm: punchCompose.BuildArm = side === "left" ? "leftArm" : "rightArm";
    const contact: punchContact.IContact = punchContact.solve(
      context,
      timing,
      tangent,
      entered,
    );
    const {
      line,
      rotation,
      socket,
      tracker,
      bones,
      solved,
    }: punchContact.IContact = contact;

    // The tracker's corrections arrived by a second since the start, each
    // carried into the step, the wrist at contact and the elbow's hint on
    // its own minimum-jerk window, so the punch is planned on the launch and
    // corrected only as each correction arrives. A feint tracks nothing.
    const corrections = (t: number): readonly punchReach.ICorrection[] =>
      p.feint === undefined ? contact.corrected(t0 + t) : [];
    const carry = (
      origin: IAutoMovieVector3,
      t: number,
      of: (c: punchReach.ICorrection) => IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      superposeMinimumJerk.position(
        origin,
        corrections(t).map(
          (
            c: punchReach.ICorrection,
          ): IAutoMovieSuperposeMinimumJerk.IUnit => ({
            displacement: of(c),
            start: c.start,
            duration: c.duration,
          }),
        ),
        t0 + t,
      );
    const step = (t: number): number =>
      carry(
        { x: contact.advance, y: 0, z: 0 },
        t,
        (c: punchReach.ICorrection): IAutoMovieVector3 => ({
          x: c.advance,
          y: 0,
          z: 0,
        }),
      ).x;

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
    const out = (t: number): number => minimumJerk.share(t / shown);
    const back = (t: number): number => minimumJerk.share((t - shown) / recoil);
    const sag = (t: number): number =>
      drop.seconds > 0
        ? back(t) - minimumJerk.share((t - shown - recoil) / drop.seconds)
        : 0;
    const walk = (advance: (t: number) => number): punchFootwork.IFootwork =>
      punchFootwork.create({
        context,
        timing,
        line,
        advance,
        turn: contact.turn,
        dip: contact.dip,
        fixed,
        out,
        back,
      });
    const footwork: punchFootwork.IFootwork = walk(step);

    // The guard the hand returns to, and the stroke from the launch through
    // the contact back to it, stopping on the struck body's first surface.
    // Solved once here at the punch's end, where every correction that moves
    // the feet has arrived.
    const ended: IAutoMovieHumanLimbGoal = guardAt(footwork.base(duration))[
      arm
    ]!;
    const guardEnd = (): IAutoMovieHumanLimbGoal => ended;
    const rotationAt = (t: number): IAutoMovieQuaternion =>
      Quaternion.slerp(
        Quaternion.slerp(startRotation, rotation, out(t)),
        startRotation,
        back(t),
      );
    const lag: number = StrikingSkill.lag(context.skill) * shown;

    // A feint is shown to its declared share, never into a person's guard.
    const landed: IAutoMovieVector3 =
      p.feint === undefined
        ? solved.end
        : Vector3.lerp(
            origin,
            solved.end,
            StrikingRoom.feint(context, p.at, {
              declared: minimumJerk.share(p.feint),
              aimed: contact.first,
              origin,
              end: solved.end,
              reach: Vector3.length(socket),
              line,
              launch: t0,
            }),
          );
    // The delivery aims where the arm lands on the launch plan, and each
    // correction carries the wrist to where its own solution lands.
    const reached: IAutoMovieVector3 = landed;
    const corrected: IAutoMovieMotionHumanStrikingAim.ITracker = punchCorrected(
      { tracker, contact },
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
    const stroke: IAutoMovieMotionHumanStrikingStroke.IStroke =
      StrikingStroke.create({
        origin,
        units,
        ...(p.feint === undefined ? { tracker: corrected } : {}),
        contact: t0 + shown,
        back: (): IAutoMovieVector3 => guardEnd().point,
        recoil,
        ...(fixed === undefined ? {} : { fixed }),
      });

    // The punch's posture for a wrist goal at a second, the arm's elbow and
    // the trunk's turn on a clock (the second itself unless withdrawing),
    // anchored between the arm's launch configuration and its solution at
    // the contact. Each solution's anchor is the arm resolved on it at the
    // contact, its own step under it; the anchor carried at a second
    // follows the corrections arrived by then.
    const launch: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
      context.entry.pose,
      arm,
    );
    // Each reach's arm anchor is fitted once when the geometry is built
    // (`anchors`, below `compose`); a read only looks it up.
    const fitAnchor = (
      reach: punchReach.IReach,
    ): IAutoMovieHumanLimbReference => {
      const fixedStep: punchFootwork.IFootwork = walk(
        (): number => reach.advance,
      );
      return HumanLimbFit.reference(
        resolveHumanPosture(
          body,
          compose(shown, reach.solved.end, shown, {
            base: fixedStep.base,
            hint: (): IAutoMovieVector3 => reach.hint,
          }),
        ),
        arm,
      );
    };
    const anchor = (reach: punchReach.IReach): IAutoMovieHumanLimbReference =>
      anchors.get(reach)!;
    const anchored: (clock: number) => IAutoMovieHumanLimbReference =
      punchAnchored({ anchor, contact, corrections, t0, body, side });
    // The wrist's share of its way from the guard to where the arm lands on
    // the launch plan, on its free path at a clock: the delivery's own reach
    // of the hand, through the contact and held there after.
    const way: IAutoMovieVector3 = Vector3.subtract(landed, origin);
    const span: number = Vector3.dot(way, way);
    const travelled = (clock: number): number =>
      clock >= shown || !(span > 0)
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              Vector3.dot(
                Vector3.subtract(stroke.free(t0 + clock), origin),
                way,
              ) / span,
            ),
          );
    // The other hand comes up to its guard from where the entry held it
    // over the delivery: a punch thrown from a guard keeps it, one thrown
    // from a stand raises it, instead of the guard's goal being taken at the
    // launch and the arm thrown out round it.
    const off: BuildOff = arm === "leftArm" ? "rightArm" : "leftArm";
    const offSide: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const offHeld: IAutoMovieHumanLimbGoal | undefined =
      context.entry.posture.limbs[off];
    const shownOff: ReturnType<typeof poseBones> | undefined =
      offHeld === undefined
        ? poseBones(
            body,
            context.entry.pose,
            undefined,
            new Set<AutoMovieHumanoidBone>([
              `${offSide}LowerArm`,
              `${offSide}Hand`,
            ]),
          )
        : undefined;
    const entryOff: IAutoMovieHumanLimbGoal = offHeld ?? {
      point: shownOff!.get(`${offSide}Hand`)!.worldPosition,
      bend: shownOff!.get(`${offSide}LowerArm`)!.worldPosition,
      rotation: shownOff!.get(`${offSide}Hand`)!.worldRotation,
    };
    const raised = (
      guard: ReturnType<typeof StrikingStance.guard>,
      clock: number,
    ): ReturnType<typeof StrikingStance.guard> => {
      const to: IAutoMovieHumanLimbGoal | undefined = guard[off];
      const w: number = out(clock);
      if (to === undefined || w >= 1) return guard;
      return {
        ...guard,
        [off]: {
          ...to,
          point: Vector3.lerp(entryOff.point, to.point, w),
          bend: Vector3.lerp(entryOff.bend, to.bend, w),
          ...(entryOff.rotation !== undefined && to.rotation !== undefined
            ? { rotation: Quaternion.slerp(entryOff.rotation, to.rotation, w) }
            : {}),
        },
      };
    };
    const compose: (
      t: number,
      end: IAutoMovieVector3,
      clock?: number,
      bare?: punchCompose.IBuildComposeBare,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ) => IAutoMovieMotionHumanPosture = punchCompose({
      anchored,
      travelled,
      back,
      footwork,
      raised,
      guardAt,
      startElbow,
      carry,
      contact,
      arm,
      drop,
      sag,
      rotationAt,
      body,
      side,
      launch,
    });

    // The launch's anchor and each moved correction's, fitted once here: the
    // tracker's every correction (`contact.corrected(Infinity)`) is the set a
    // read over the whole punch can arrive at.
    const anchors: Map<punchReach.IReach, IAutoMovieHumanLimbReference> =
      new Map(
        [
          contact.launched,
          ...corrections(Infinity)
            .filter((c: punchReach.ICorrection): boolean => c.moved)
            .map((c: punchReach.ICorrection): punchReach.IReach => c.reach),
        ].map(
          (
            reach: punchReach.IReach,
          ): [punchReach.IReach, IAutoMovieHumanLimbReference] => [
            reach,
            fitAnchor(reach),
          ],
        ),
      );
    const landing = (): punchReach.IReach =>
      p.feint === undefined
        ? (contact.corrected(Infinity).at(-1)?.reach ?? contact.launched)
        : contact.launched;
    return {
      contacts: footwork.contacts,
      record: {
        limb: side === "left" ? "leftHand" : "rightHand",
        offset: contact.offset,
        planned: tracker.planned,
        // Where the arm lands once every correction has arrived.
        get reached(): IAutoMovieVector3 {
          return Vector3.add(landing().solved.end, socket);
        },
        get status(): IAutoMovieMotionHumanStrikingReach.ISolution["status"] {
          return landing().solved.status;
        },
        stop: stroke.stop,
      },
      posture: (
        t: number,
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: ReturnType<typeof prepareHumanPostureProjection>,
      ): IAutoMovieMotionHumanPosture => {
        const at: number | undefined = stroke.stop(t0 + t);
        if (at === undefined || t <= at - t0)
          return compose(
            t,
            stroke.end(t0 + t),
            t,
            undefined,
            resolution,
            projection,
          );

        // Held for the dwell, then the approach is retraced on a minimum-jerk
        // clock, the wrist carried onto the guard it returns to.
        const s: number = at - t0;
        const w: number = minimumJerk.share(
          (t - s - StrikingStroke.DWELL) /
            Math.max(1e-3, duration - s - StrikingStroke.DWELL),
        );
        const clock: number = s * (1 - w);
        return compose(
          t,
          Vector3.add(
            stroke.free(t0 + clock),
            Vector3.scale(Vector3.subtract(guardEnd().point, origin), w),
          ),
          clock,
          undefined,
          resolution,
          projection,
        );
      },
    };
  }
}
