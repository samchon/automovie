import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  curlChainUntilContact,
  minimumJerk,
  resolveAutoMovieMutualGoal,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";

/**
 * Shaking hands with a partner: both bring the same hand's palm to one
 * shared point, clasp, pump together and let go.
 *
 * The goal is the meeting, not the arm: each palm socket is brought to the
 * point `resolveAutoMovieMutualGoal` places midway between the two acting
 * shoulders, at the height both comfortable reaches agree on, with the palm
 * facing the partner's palm across the line between the two people and the
 * fingers pointing at the partner, so two right hands meet web to web with
 * their thumbs up; each hand then turns in its palm's plane to the tilt its
 * own arm can reach at the clasp and at the pump's top and bottom alike
 * (`HumanGrasp.reachable`), the palms' contact unchanged. Inverse kinematics
 * solves each arm (`HumanHand.place`, the Final IK and Unreal Control Rig
 * practice of an effector socket on a world target), and through the clasp
 * and the pump the arm keeps the configuration it clasped in
 * (`IHumanPosture.IGoal.reference`); the feet stay planted as the stand law
 * places them. Both partners compute the same point from the same two
 * shoulders, so the palms meet without either reading the other's moving
 * hand. The comfortable reach is the shoulder-to-palm distance of an arm
 * offering a hand: the upper arm 30 degrees forward of hanging and the elbow
 * flexed 60 degrees, which holds the forearm level, both provisional, as no
 * measurement of the offering arm was located; `gap` is the chest gap at
 * which both such arms meet, the distance partners stand at to shake hands.
 * The limit is the straight arm less the pump's amplitude, so the pump stays
 * within reach above and below the meeting point.
 *
 * Phases, the handshake's reach, grasp, shake and release (Jindai et al.,
 * reviewed by Prasad et al. 2022, Human-Robot Handshaking: A Review, Int. J.
 * Soc. Robot.): the reach is a minimum-jerk transport whose time is the
 * reach-to-grasp movement time over the comfortable reach (`HumanPrehension`),
 * the longer of the two partners' so both palms arrive together; the fingers
 * open during the reach and close on the partner's hand by the clasp
 * (`HumanGrip`); the shake moves the shared point up and down at 2.43 Hz for
 * two cycles, the greeting handshake of Tagne et al. 2016 (0.90 s of main
 * shaking at 2.43 Hz, as tabulated by Prasad et al.), with a vertical
 * amplitude of 25 mm about the point that is provisional (no study located
 * reports the amplitude; the robot reference of Wang et al. used 10 cm peak to
 * peak) and a `sin^2` envelope so the pump starts and stops at rest; then the
 * fingers open and the hand returns to where it hung over another reach time.
 *
 * Events: `clasp` and `gripClosed` when the palms meet and the fingers close,
 * `shakeEnd` when the pump ends, `release` as the hand opens. The hand grips
 * the partner's palm region from `clasp` to `release`. A handshake cut into a
 * stand before `clasp` is a declined reach: the hand returns under the
 * transition's inertialization, continuous in velocity, with no offset left
 * once the blend ends.
 *
 * Both partners must stand within reach when the handshake starts; the
 * mutual goal refuses a gap neither arm can close. The partner's shoulder is
 * read at the start, so the partner's earlier actions must be placed first,
 * which `HumanChain.pair` arranges.
 */
export namespace handshake {
  /** The action's name. */
  export const name: HumanActionName = "handshake";

  /** Cancel table: declined before the clasp, or ended after the release. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: [0, "clasp"], kind: "inertialize", entry: 0, blend: 0.3 },
      { window: ["release", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [
      { window: ["release", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The partner's subject id. */
    partner: string;

    /** The shaking hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** Pump cycles; 2 when absent. */
    pumps?: number;
  }

  /** Elbow flexion of the offering arm, degrees; provisional. */
  export const ELBOW: number = 60;

  /** Shoulder flexion of the offering arm, degrees; provisional. */
  export const SHOULDER: number = 30;

  /** Pump frequency, hertz (Tagne et al. 2016, greeting). */
  export const FREQUENCY: number = 2.43;

  /** Pump amplitude about the meeting point, metres; provisional. */
  export const AMPLITUDE: number = 0.025;

  /**
   * Plan a handshake.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the partners stand beyond reach of each other, or the pump count is not a positive integer.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const side: HumanHand.Side = context.params.hand ?? "right";
    const pumps: number = context.params.pumps ?? 2;
    if (!(Number.isInteger(pumps) && pumps > 0))
      throw new Error("A handshake pumps a positive whole number of times");
    const body: IHumanBody = context.body;
    const partner: IHumanBody = context.performer(context.params.partner).body;
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";

    // The meeting point from both acting shoulders at the start.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose);
    const mine: IAutoMovieVector3 = entered.get(`${side}UpperArm`)!
      .worldPosition;
    const theirs: IAutoMovieVector3 = context
      .performer(context.params.partner)
      .bones(context.start)
      .get(`${side}UpperArm`)!.worldPosition;
    const meet: IAutoMovieVector3 = resolveAutoMovieMutualGoal({
      a: arm(body, side, mine),
      b: arm(partner, side, theirs),
    }).point;

    // Shared timing: the slower partner's reach, then the pump, then the return.
    const reach: number = Math.max(
      HumanPrehension.nominal(arm(body, side, mine).reach, 0),
      HumanPrehension.nominal(arm(partner, side, theirs).reach, 0),
    );
    const shake: number = pumps / FREQUENCY;
    const back: number = reach;
    const duration: number = reach + shake + back;
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });

    // The hand's grasp frame: palm toward the partner's palm, fingers at the partner.
    const across: IAutoMovieVector3 = Vector3.normalize({
      x: theirs.x - mine.x,
      y: 0,
      z: theirs.z - mine.z,
    });
    const left: IAutoMovieVector3 = { x: across.z, y: 0, z: -across.x };
    const palm: IAutoMovieVector3 =
      side === "right" ? left : Vector3.scale(left, -1);
    // Each hand may turn in its palm's plane (the palms' contact is the same)
    // to the tilt its own arm can reach, as hands cross at an angle in a real
    // handshake; the same tilt must hold at the pump's top and bottom, so
    // those are keys of the choice. Each partner computes both choices from
    // both standing postures, so they agree.
    const clasping = (
      who: IHumanBody,
      posture: IHumanPosture,
      normal: IAutoMovieVector3,
      fingers: IAutoMovieVector3,
    ): HumanGrasp.IReach => {
      const bend: IAutoMovieVector3 = HumanHand.elbow(who, posture, side);
      return HumanGrasp.reachable(
        who,
        posture,
        side,
        bend,
        (angle: number): HumanHand.IWrist =>
          HumanHand.place(
            who,
            side,
            "palm",
            meet,
            Quaternion.normalize(
              Quaternion.multiply(
                Quaternion.fromAxisAngle(normal, angle),
                HumanHand.rotation(side, { fingers, palm: normal }),
              ),
            ),
            "flat",
          ),
        [0],
        (wrist: HumanHand.IWrist): HumanGrasp.IKey[] =>
          [-AMPLITUDE, AMPLITUDE].map(
            (lift: number): HumanGrasp.IKey => ({
              posture,
              wrist: {
                point: { ...wrist.point, y: wrist.point.y + lift },
                rotation: wrist.rotation,
              },
              bend,
            }),
          ),
      );
    };
    const own: HumanGrasp.IReach = clasping(
      body,
      base.posture(reach),
      palm,
      across,
    );
    const clasp: HumanHand.IWrist = own.wrist;
    const turn: IAutoMovieQuaternion = clasp.rotation;

    // Where the hand starts and where it returns to.
    const entry: IAutoMovieResolvedBone = entered.get(`${side}Hand`)!;
    const rest: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture(body, base.posture(duration)),
    ).get(`${side}Hand`)!;
    const out: HumanPrehension.ITransport = HumanPrehension.transport(
      entry.worldPosition,
      clasp.point,
      palm,
      0,
      { from: entry.worldRotation, to: turn },
      reach,
    );
    const home: HumanPrehension.ITransport = HumanPrehension.transport(
      clasp.point,
      rest.worldPosition,
      Vector3.scale(palm, -1),
      0,
      { from: turn, to: rest.worldRotation },
      back,
    );
    const peak: number = HumanPrehension.peak(context.random("peak"));

    // The fingers close round the partner's hand as it will lie at the clasp:
    // the partner's palm on the same point, turned to face this palm. The
    // partner's hand, forearm and open thumb, posed as the partner's arm will
    // be at the clasp, are what the closing digits stop on.
    const standing: IHumanPosture = HumanGrasp.standing(
      partner,
      context.performer(context.params.partner).bones(context.start),
    );
    const their: HumanHand.IWrist = clasping(
      partner,
      standing,
      Vector3.scale(palm, -1),
      Vector3.scale(across, -1),
    ).wrist;
    const partnerPose: IAutoMoviePose = resolveHumanPosture(partner, {
      ...standing,
      joints: { ...standing.joints, ...HumanHand.shape(side, "flat") },
      limbs: {
        ...standing.limbs,
        [limb]: {
          point: their.point,
          rotation: their.rotation,
          bend: HumanHand.elbow(partner, standing, side),
        },
      },
    });
    const partnerBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(partner, partnerPose);
    const colliders: curlChainUntilContact.ICollider[] =
      partner.profile.segments
        .filter(
          (s: IAutoMoviePhysicalProfile.ISegment): boolean =>
            s.bone === `${side}Hand` ||
            s.bone === `${side}LowerArm` ||
            s.bone.startsWith(`${side}Thumb`),
        )
        .flatMap(
          (
            s: IAutoMoviePhysicalProfile.ISegment,
          ): curlChainUntilContact.ICollider[] => {
            const bone: IAutoMovieResolvedBone = partnerBones.get(
              s.bone as AutoMovieHumanoidBone,
            )!;
            return s.shapes.map(
              (
                shape: IAutoMoviePhysicalProfile.IShape,
              ): curlChainUntilContact.ICollider => ({
                shape,
                frame: {
                  position: bone.worldPosition,
                  rotation: bone.worldRotation,
                },
              }),
            );
          },
        );
    const fingers: IHumanPosture["joints"] = HumanGrip.close(
      body,
      side,
      "power",
      own.shown,
      colliders,
    ).joints;
    const shapes = {
      entry: HumanGrip.fingers(context.entry.pose, side),
      open: HumanHand.shape(side, "flat"),
      closed: fingers,
    };
    const open = {
      entry: fingers,
      open: HumanHand.shape(side, "flat"),
      closed: HumanHand.shape(side, "relaxed"),
    };
    return {
      duration,
      events: [
        { name: "clasp", share: reach / duration },
        { name: "gripClosed", share: reach / duration },
        { name: "shakeEnd", share: (reach + shake) / duration },
        { name: "release", share: (reach + shake) / duration },
      ],
      contacts: [
        ...base.contacts,
        {
          part: side === "left" ? "leftHand" : "rightHand",
          kind: "grip",
          from: reach / duration,
          to: (reach + shake) / duration,
          support: {
            kind: "person",
            subject: context.params.partner,
            region: side === "left" ? "palmLeft" : "palmRight",
          },
        },
      ],
      contact: reach,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = base.posture(t);
        let wrist: IAutoMovieVector3;
        let rotation: IAutoMovieQuaternion;
        let digits: IHumanPosture["joints"];
        if (t <= reach) {
          wrist = out.wrist(t);
          rotation = out.turn(t);
          digits = HumanPrehension.shape(shapes, peak, t / reach);
        } else if (t <= reach + shake) {
          const tau: number = t - reach;
          const lift: number =
            AMPLITUDE *
            Math.sin(2 * Math.PI * FREQUENCY * tau) *
            Math.sin((Math.PI * tau) / shake) ** 2;
          wrist = { ...clasp.point, y: clasp.point.y + lift };
          rotation = turn;
          digits = fingers;
        } else {
          wrist = home.wrist(t - reach - shake);
          rotation = home.turn(t - reach - shake);
          digits = HumanPrehension.shape(
            open,
            0.5,
            minimumJerk((t - reach - shake) / back).s,
          );
        }
        const gripping: boolean = t >= reach && t <= reach + shake;
        return {
          ...posture,
          joints: { ...posture.joints, ...digits },
          limbs: {
            ...posture.limbs,
            [limb]: {
              point: wrist,
              rotation,
              bend: HumanHand.elbow(body, posture, side),
              // The clasp's own arm solution anchors the pump, the reach more
              // and more as it arrives and the return less and less as it
              // leaves.
              ...(gripping
                ? { planted: true, reference: own.reference }
                : {
                    reference: {
                      ...own.reference,
                      weight:
                        t < reach
                          ? minimumJerk(t / reach).s
                          : 1 - minimumJerk((t - reach - shake) / back).s,
                    },
                  }),
            },
          },
        };
      },
    };
  }

  /** Where a standing body's chest and acting shoulder lie from its floor point. */
  export interface IStance {
    /** How far the sternum region lies ahead of the floor point, metres. */
    sternum: number;

    /** How far the shoulder joint lies ahead of the floor point, metres. */
    shoulder: number;

    /** How far the shoulder joint lies to the side of the floor point, metres. */
    across: number;
  }

  /**
   * A body's chest and shoulder offsets in the stand law's own posture, read
   * on the body itself and not estimated from its measures, so a case or an
   * approach places partners by the geometry the handshake will meet.
   *
   * @param body The body.
   * @param side The acting arm; `right` when absent.
   * @returns The offsets.
   */
  export function stance(
    body: IHumanBody,
    side: HumanHand.Side = "right",
  ): IStance {
    const posture: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, posture).get(
      `${side}UpperArm`,
    )!.worldPosition;
    return {
      sternum: HumanTrunk.region(body, posture, "sternum").point.z,
      shoulder: shoulder.z,
      across: Math.abs(shoulder.x),
    };
  }

  /**
   * The horizontal sternum-to-sternum gap at which two partners facing each
   * other shake hands, the gap an approach stops at.
   *
   * Each offering arm reaches forward `u sin(SHOULDER) + l sin(SHOULDER +
   * ELBOW)` from its shoulder, the forearm `l` carrying the palm socket as
   * `arm` does; the two reaches sum to the shoulders' horizontal distance,
   * across which the shaking shoulders sit each to its own side, and each
   * sternum leads its shoulder as the standing body places them
   * ({@link stance}). Partners whose floor points stand this gap plus both
   * sternum offsets apart therefore meet palm to palm with both arms at the
   * comfortable reach.
   *
   * @param a One partner.
   * @param b The other.
   * @param side The shaking hand of both; `right` when absent.
   * @returns Metres.
   */
  export function gap(
    a: IHumanBody,
    b: IHumanBody,
    side: HumanHand.Side = "right",
  ): number {
    const ahead = (body: IHumanBody): number => {
      const s: number = (SHOULDER * Math.PI) / 180;
      const e: number = ((SHOULDER + ELBOW) * Math.PI) / 180;
      return (
        body.measure.upperArm * Math.sin(s) +
        (body.measure.forearm +
          Vector3.length(HumanHand.offset(body, side, "palm").point)) *
          Math.sin(e)
      );
    };
    const sa: IStance = stance(a, side);
    const sb: IStance = stance(b, side);
    const shoulders: number = ahead(a) + ahead(b);
    const across: number = sa.across + sb.across;
    return (
      Math.sqrt(Math.max(0, shoulders * shoulders - across * across)) -
      (sa.sternum - sa.shoulder) -
      (sb.sternum - sb.shoulder)
    );
  }

  /**
   * One partner's acting arm for the mutual goal: the shoulder, the
   * comfortable reach to the palm at the handshake's elbow flexion, and the
   * straight arm's reach less the pump's amplitude.
   *
   * @param body The body.
   * @param side The arm.
   * @param shoulder The shoulder joint, world metres.
   * @returns The side.
   */
  export function arm(
    body: IHumanBody,
    side: HumanHand.Side,
    shoulder: IAutoMovieVector3,
  ): resolveAutoMovieMutualGoal.ISide {
    const upper: number = body.measure.upperArm;
    const lower: number =
      body.measure.forearm +
      Vector3.length(HumanHand.offset(body, side, "palm").point);
    const flexion: number = (ELBOW * Math.PI) / 180;
    return {
      shoulder,
      reach: Math.sqrt(
        upper * upper + lower * lower + 2 * upper * lower * Math.cos(flexion),
      ),
      limit: upper + lower - AMPLITUDE,
    };
  }
}
