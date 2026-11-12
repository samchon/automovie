import {
  type IAutoMovieResolvedBone,
  Vector3,
  minimumJerk,
  resolveAutoMovieMutualGoal,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanClasp } from "./HumanClasp";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { handshakeOffer } from "./handshakeOffer";

/**
 * Shaking hands with a partner: both bring the same hand's palm to one
 * shared point, clasp, pump together and let go.
 *
 * The goal is the meeting, not the arm: each palm socket is brought to the
 * point `handshakeOffer.point` places between the two offering elbows, where both forearms
 * reach it with the upper arms as they offer (the taller of two unequal
 * partners extends the elbow and reaches down, lowering the upper arm toward
 * hanging before the arm straightens, the shorter flexes the elbow and
 * raises the forearm, and neither raises the upper arm), with the palm facing
 * the partner's palm across the line between the two people and the
 * fingers pointing at the partner along the line that halves the angle
 * between the two forearms, so two right hands meet web to web with
 * their thumbs up; the two hands then turn in their palms' planes together,
 * the palms' contact unchanged, to the pair of turns whose open hands keep
 * every phalanx off the other's forearm and which both arms reach best at the
 * clasp and at the pump's top and bottom alike (`HumanClasp.choose`), so each
 * hand's fingers close round the other's hand rather than lie along its
 * wrist. Inverse kinematics
 * solves each arm (`HumanHand.place`, the Final IK and Unreal Control Rig
 * practice of an effector socket on a world target), and through the clasp
 * and the pump the arm keeps the configuration it clasped in
 * (`IHumanPosture.IGoal.reference`); the feet stay planted as the stand law
 * places them. Both partners compute the same point from the same two
 * shoulders, so the palms meet without either reading the other's moving
 * hand. The comfortable reach is the shoulder-to-palm distance of an arm
 * offering a hand: the upper arm 30 degrees forward of hanging and the elbow
 * flexed 45 degrees, which slopes the forearm 15 degrees down to the hand,
 * both provisional, as no measurement of the offering arm was located. The
 * slope is what lets two hands clasp with both elbows low: each hand's
 * fingers clear the partner's forearm only when they point about 65 degrees
 * off it (measured on the sweep's bodies between two turns of 30 and two of
 * 37.5 degrees), the wrist deviates 30 degrees less the 5.5 the pump takes,
 * and two level forearms leave the rest to a raised elbow; two forearms each
 * sloping 15 degrees down supply it. `gap` is the chest gap at
 * which both such arms meet, the distance partners stand at to shake hands.
 * The limit is the straight arm less the pump's amplitude, so the pump stays
 * within reach above and below the meeting point.
 *
 * Phases, the handshake's reach, grasp, shake and release (Jindai et al.,
 * reviewed by Prasad et al. 2022, Human-Robot Handshaking: A Review, Int. J.
 * Soc. Robot.): the reach is a minimum-jerk transport whose time is the
 * reach-to-grasp movement time over the comfortable reach (`HumanPrehension`),
 * the longer of the two partners' so both palms arrive together; the hand
 * opens during the reach to the offered hand of `HumanClasp.open` and its
 * digits close from there on the partner's hand by the clasp (`HumanGrip`);
 * the shake moves the shared point up and down at 2.43 Hz for
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
    const mine: IAutoMovieVector3 = entered.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const theirs: IAutoMovieVector3 = context
      .performer(context.params.partner)
      .bones(context.start)
      .get(`${side}UpperArm`)!.worldPosition;
    const meeting: handshakeOffer.IMeeting = handshakeOffer.point(
      { body, shoulder: mine },
      { body: partner, shoulder: theirs },
      side,
      AMPLITUDE,
    );
    const meet: IAutoMovieVector3 = meeting.point;

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

    // The hand's grasp frame: palm toward the partner's palm, fingers at the
    // partner along the line that halves the two forearms' angle, then both
    // hands turned in their palms' planes together (`HumanClasp.choose`),
    // from both standing postures, so both partners agree on the clasp.
    const across: IAutoMovieVector3 = Vector3.normalize({
      x: theirs.x - mine.x,
      y: 0,
      z: theirs.z - mine.z,
    });
    const left: IAutoMovieVector3 = { x: across.z, y: 0, z: -across.x };
    const palm: IAutoMovieVector3 =
      side === "right" ? left : Vector3.scale(left, -1);
    const hands: [HumanClasp.IHand, HumanClasp.IHand] = [
      {
        subject: context.subject,
        body,
        posture: HumanGrasp.standing(body, entered),
        palm,
        fingers: meeting.fingers,
      },
      {
        subject: context.params.partner,
        body: partner,
        posture: HumanGrasp.standing(
          partner,
          context.performer(context.params.partner).bones(context.start),
        ),
        palm: Vector3.scale(palm, -1),
        fingers: Vector3.scale(meeting.fingers, -1),
      },
    ];
    const choice: HumanClasp.IChoice = HumanClasp.choose(
      side,
      meet,
      AMPLITUDE,
      ...hands,
    );
    const own: HumanGrasp.IReach = choice.mine;
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

    // The fingers close from the offered hand round the partner's hand as it
    // will lie at the clasp, posed as the partner's arm will be.
    const offered: IHumanPosture["joints"] = HumanClasp.open(body, side);
    const fingers: IHumanPosture["joints"] = HumanClasp.close(
      side,
      choice,
      ...hands,
    );
    const shapes = {
      entry: HumanGrip.fingers(context.entry.pose, side),
      open: offered,
      closed: fingers,
    };
    const open = {
      entry: fingers,
      open: offered,
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
              bend: AutoMovieMotionHumanBend.hang(body, posture, side),
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
                          : // Clamped, as the minimum-jerk position
                            // rounds past 1 at the return's end.
                            Math.max(
                              0,
                              1 - minimumJerk((t - reach - shake) / back).s,
                            ),
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
    /** How high the shoulder joint stands above the floor, metres. */
    height: number;

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
      height: shoulder.y,
      sternum: HumanTrunk.region(body, posture, "sternum").point.z,
      shoulder: shoulder.z,
      across: Math.abs(shoulder.x),
    };
  }

  /**
   * The horizontal sternum-to-sternum gap at which two partners facing each
   * other shake hands, the gap an approach stops at.
   *
   * Each offering arm reaches forward `u sin(handshakeOffer.SHOULDER) + l cos(slope)` from
   * its shoulder, the forearm `l` carrying the palm socket as `handshakeOffer.forearm` does
   * and sloping `90 - SHOULDER - ELBOW` degrees below level, further down by
   * `handshakeOffer.shape` under the higher elbow and less under the lower,
   * the higher upper arm lowered as that shape says; the two reaches sum to
   * the shoulders' horizontal distance,
   * across which the shaking shoulders sit each to its own side, and each
   * sternum leads its shoulder as the standing body places them
   * ({@link stance}). Partners whose floor points stand this gap plus both
   * sternum offsets apart therefore meet palm to palm where `handshakeOffer.point`
   * places the point, both upper arms in the offering shape.
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
    const sa: IStance = stance(a, side);
    const sb: IStance = stance(b, side);
    const s: number = (handshakeOffer.SHOULDER * Math.PI) / 180;
    const elbow = (body: IHumanBody, stood: IStance): number =>
      stood.height - body.measure.upperArm * Math.cos(s);
    const drop: number = elbow(a, sa) - elbow(b, sb);
    const [higher, lower]: [IHumanBody, IHumanBody] =
      drop >= 0 ? [a, b] : [b, a];
    const shaped: handshakeOffer.IShape = handshakeOffer.shape(
      higher.measure.upperArm,
      handshakeOffer.forearm(higher, side),
      handshakeOffer.forearm(lower, side),
      Math.abs(drop),
      AMPLITUDE,
    );
    const ahead = (body: IHumanBody, lowered: number, down: number): number =>
      body.measure.upperArm *
        Math.sin(((handshakeOffer.SHOULDER - lowered) * Math.PI) / 180) +
      handshakeOffer.forearm(body, side) *
        Math.cos(
          ((90 - handshakeOffer.SHOULDER - handshakeOffer.ELBOW + down) *
            Math.PI) /
            180,
        );
    const shoulders: number =
      ahead(higher, shaped.lowered, shaped.turn) +
      ahead(lower, 0, -shaped.turn);
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
    const lower: number = handshakeOffer.forearm(body, side);
    const flexion: number = (handshakeOffer.ELBOW * Math.PI) / 180;
    return {
      shoulder,
      reach: Math.sqrt(
        upper * upper + lower * lower + 2 * upper * lower * Math.cos(flexion),
      ),
      limit: upper + lower - AMPLITUDE,
    };
  }
}
