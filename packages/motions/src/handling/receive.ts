import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHandover,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanReceive,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionMeeting,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanSeatedReach } from "../touch/HumanSeatedReach";
import { HumanGrip } from "./HumanGrip";
import { HumanHandover } from "./HumanHandover";
import { HumanHandoverMeeting } from "./HumanHandoverMeeting";
import { HumanHandoverUpright } from "./HumanHandoverUpright";
import { HumanPrehension } from "./HumanPrehension";
import { HumanPreshape } from "./HumanPreshape";
import { handshake } from "./handshake";

/** The record of `IPlanLean`'s site. */
type IPlanLean = {
  share: number;
  joints: IAutoMovieMotionHumanSeatedReach.IJoint[];
};

/**
 * Taking a prop a giver holds out: the receiver's half of a handover.
 *
 * The goal is the offered grip, not the arm: the receiver's grip socket is
 * brought onto the prop's receiving grip where the shared plan
 * (`HumanHandover`) puts the offer, on a reach-to-grasp transport that ends no
 * earlier than the giver's, the fingers opening to the peak aperture on the way
 * and closing on the prop's colliders until contact (`HumanGrip`). The hand
 * holds still through the transfer time while the giver lets go, and then
 * brings the prop in front of the body: the wrist where the elbow hangs at the
 * side flexed to a right angle (the upper arm's length below the shoulder and
 * the forearm's ahead of it), the common carrying posture, the prop kept
 * upright and turned about the vertical as the arm keeps it so
 * (`HumanHandover.upright`). The rest of the body holds the posture it was
 * entered in, a seated receiver whose arm alone falls short of the grip leaning
 * its trunk forward over the seat with the arm's course (`HumanSeatedReach`,
 * the place read from the partners' one meeting, `HumanHandoverMeeting`).
 *
 * Outcomes: `transfer` as above; `withdraw`, the hand stops short by the
 * approach setback as the offer is pulled back, and returns empty; `decline`,
 * the hand stays where it is.
 *
 * Events: `gripClosed` when the fingers close on the prop, `taken` at the end.
 * The hand grips the prop from `gripClosed` and holds it afterwards.
 */
export namespace receive {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "receive";

  /** Cancel table: once taken the prop is held. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["taken", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: ["taken", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * How far the carrying forearm may be raised above level, degrees, level
   * first (provisional: up to the half right angle, a cup held toward the
   * chest).
   */
  export const PITCHES: readonly number[] = [0, 15, 30, 45];

  /**
   * Plan the receiver's half.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanReceive.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    const body: IAutoMovieMotionHumanBody = context.body;
    const held: IAutoMovieMotionHumanPosture = context.entry.posture;
    const giver: IAutoMovieMotionHumanPerformerReader = context.performer(
      context.params.partner,
    );
    const prop: IAutoMovieMotionHumanPropReader = context.prop(
      context.params.prop,
    );
    const giverSide: AutoMovieHumanSide = context.params.giverHand ?? "right";
    // The place both partners read from one meeting record.
    const met: IAutoMovieMotionMeeting = context.meeting(
      HumanHandoverMeeting.kind({
        giver: giverSide,
        receiver: side,
        prop: prop.prop,
        frame: prop.frame(context.start),
        handle: context.params.handle,
        exchange: HumanHandover.EXCHANGE,
      }),
      HumanHandoverMeeting.RECEIVER,
      { role: HumanHandoverMeeting.GIVER, subject: context.params.partner },
    );
    const shared: IAutoMovieMotionHumanHandover.IPlan = HumanHandover.plan({
      meet: HumanFrame.point(met.frame, met.contacts.meet!),
      giver: {
        body: giver.body,
        side: giverSide,
        bones: giver.bones(
          context.start,
          new Set<AutoMovieHumanoidBone>([`${giverSide}Hand`]),
        ),
      },
      receiver: {
        body,
        side,
        bones: context
          .performer(context.subject)
          .bones(
            context.start,
            new Set<AutoMovieHumanoidBone>([
              "hips",
              "leftFoot",
              "rightFoot",
              `${side}Hand`,
            ]),
          ),
      },
      prop: prop.prop,
      frame: prop.frame(context.start),
      handle: context.params.handle,
      ...(context.params.mass === undefined
        ? {}
        : { mass: context.params.mass }),
      ...(context.params.outcome === undefined
        ? {}
        : { outcome: context.params.outcome }),
    });
    const takes: boolean = shared.outcome === "transfer";

    // Seated, the trunk leans forward over the seat as far as the grasp
    // needs, the hand's target first (`HumanSeatedReach.need`), with the
    // arm's own course in and out; standing, or declining, it leans none.
    const entered: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const shoulder: IAutoMovieVector3 = entered.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const lean: IPlanLean =
      shared.outcome === "decline"
        ? { share: 0, joints: [] }
        : HumanSeatedReach.need(
            {
              name: HumanHandoverMeeting.RECEIVER,
              subject: context.subject,
              body,
              posture: held,
              bones: entered,
              seated: context.entry.supports.some(
                (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
                  s.kind === "seat",
              ),
            },
            shoulder,
            shared.receiverAt.point,
            handshake.arm(body, side, shoulder).limit,
          );
    const leaned = (share: number): IAutoMovieMotionHumanPosture =>
      HumanSeatedReach.posed(body, held, lean.joints, lean.share * share);
    const setback: number = HumanPrehension.aperture(shared.target.width);
    const short: IAutoMovieVector3 = Vector3.subtract(
      shared.receiverAt.point,
      Vector3.scale(shared.target.approach, setback),
    );
    const arrive: IAutoMovieVector3 = takes ? shared.receiverAt.point : short;
    const out: IAutoMovieMotionHumanPrehension.ITransport =
      HumanPrehension.transport(
        shared.receiverFrom.point,
        arrive,
        shared.target.approach,
        takes ? setback : 0,
        { from: shared.receiverFrom.rotation, to: shared.receiverAt.rotation },
        shared.reach,
      );

    // After the transfer: the carrying place in front of the body, or home.
    // The forearm is raised as far of `PITCHES` as the arm needs to hold the
    // prop upright there in the hand that took it, at its best turn about
    // the vertical: the grip a giver's height put the hand in may not stay
    // upright with the forearm level.
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );
    let carry: IAutoMovieVector3 = shared.receiverFrom.point;
    if (takes) {
      const carryAt: (pitch?: number) => IAutoMovieVector3 = (
        pitch: number = 0,
      ): IAutoMovieVector3 => HumanHandover.carried(body, held, side, pitch);
      carry = carryAt();
      const tipped: (goal: IAutoMovieHumanLimbGoal) => number = (
        goal: IAutoMovieHumanLimbGoal,
      ): number =>
        HumanHandover.tipped(body, side, {
          ...held,
          limbs: { ...held.limbs, [`${side}Arm`]: goal },
        });
      let least: number = Infinity;
      for (const pitch of PITCHES) {
        const place: IAutoMovieVector3 = carryAt(pitch);
        for (const yaw of HumanHandover.YAWS) {
          const tip: number =
            tipped({
              point: place,
              rotation: Quaternion.multiply(
                Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
                shared.receiverShown.rotation,
              ),
              bend,
            }) +
            0.1 * pitch;
          if (tip < least - 1e-9) {
            least = tip;
            carry = place;
          }
        }
      }
    }
    const end: IAutoMovieVector3 = takes ? carry : shared.receiverFrom.point;
    // A hand that took the prop carries it; an empty one returns as it reached.
    const travel: number = Vector3.length(Vector3.subtract(end, arrive));
    const back: number = takes
      ? HumanPrehension.carry(travel)
      : HumanPrehension.nominal(travel, 0);

    const home: IAutoMovieMotionHumanPrehension.ITransport =
      HumanPrehension.transport(
        arrive,
        end,
        { x: 0, y: 0, z: 0 },
        0,
        {
          from: takes
            ? shared.receiverShown.rotation
            : shared.receiverAt.rotation,
          to: takes
            ? shared.receiverShown.rotation
            : shared.receiverFrom.rotation,
        },
        back,
      );
    const leave: number = takes ? shared.release : shared.gripClosed;
    const duration: number =
      shared.outcome === "decline" ? shared.release : leave + back;

    const closed: IAutoMovieMotionHumanPosture["joints"] = takes
      ? HumanGrip.close(
          body,
          side,
          shared.target.grip,
          shared.receiverShown,
          shared.target.colliders,
        ).joints
      : HumanHand.shape(side, "relaxed");
    const open: IAutoMovieMotionHumanPosture["joints"] = HumanPreshape.open(
      body,
      side,
      takes ? closed : HumanHand.shape(side, "relaxed"),
      shared.target.width,
    ).joints;
    const peak: number = HumanPrehension.peak(context.random("peak"));
    const shapes: Parameters<typeof HumanPrehension.shape>[0] = {
      entry: HumanGrip.fingers(context.entry.pose, side),
      open,
      closed,
    };
    const shapeAt: ReturnType<typeof HumanPrehension.prepareShape> =
      HumanPrehension.prepareShape(shapes, peak);
    const returnShape:
      | ReturnType<typeof HumanPrehension.prepareShape>
      | undefined = takes
      ? undefined
      : HumanPrehension.prepareShape(
          { entry: open, open: shapes.entry, closed: shapes.entry },
          1,
        );

    // The body at a second with the carried hand turned by a yaw, degrees,
    // about the world's up: a hand that took the prop keeps the rotation it
    // showed at the grip, not the one it was asked there, since the prop sits
    // in the hand as the hand was shown, and its upright carry leaves only
    // the turn about the vertical, which the take-away chooses
    // (`HumanHandoverUpright`). Each original yaw callback re-reads its raw
    // transport, digits, direct body and complete other goals.
    const frameAt: (seconds: number) => HumanHandoverUpright.IFrame = (
      seconds: number,
    ): HumanHandoverUpright.IFrame => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      let wrist: IAutoMovieVector3;
      let rotation: IAutoMovieQuaternion;
      let digits: IAutoMovieMotionHumanPosture["joints"];
      let share: number = 0;
      if (shared.outcome === "decline" || t <= shared.reachStart) {
        wrist = shared.receiverFrom.point;
        rotation = shared.receiverFrom.rotation;
        digits = shapes.entry;
      } else if (t <= shared.gripClosed) {
        wrist = out.wrist(t - shared.reachStart);
        rotation = out.turn(t - shared.reachStart);
        digits = shapeAt((t - shared.reachStart) / shared.reach);
        share = minimumJerk.share((t - shared.reachStart) / shared.reach);
      } else if (t <= leave) {
        wrist = arrive;
        rotation = shared.receiverAt.rotation;
        digits = closed;
        share = 1;
      } else {
        share = 1 - Math.min(1, minimumJerk.share((t - leave) / back));
        wrist = home.wrist(t - leave);
        rotation = takes ? shared.receiverShown.rotation : home.turn(t - leave);
        digits = takes
          ? closed
          : returnShape!(minimumJerk.share((t - leave) / back));
      }
      const base: IAutoMovieMotionHumanPosture = leaned(share);
      return {
        posture: { ...base, joints: { ...base.joints, ...digits } },
        goal: {
          point: wrist,
          bend,
          // The grasp's own arm solution anchors the hold, the reach
          // more and more as it arrives, and the take-away less and
          // less as it leaves: at the carrying place the arm is another
          // arm, and a full reference there is paid for by the hand's
          // rotation, which tips what it carries.
          ...(takes && t > leave
            ? {
                reference: {
                  ...shared.receiverReference,
                  // The share is held at 1 first: at the take-away's end it
                  // rounds a hair past 1, and its complement below 0.
                  weight: share,
                },
              }
            : takes && t >= shared.gripClosed
              ? { reference: shared.receiverReference }
              : takes && t > shared.reachStart
                ? {
                    reference: {
                      ...shared.receiverReference,
                      weight: share,
                    },
                  }
                : {}),
          ...(takes && t >= shared.gripClosed && t <= leave
            ? { planted: true }
            : {}),
        },
        rotation: (yaw: number): IAutoMovieQuaternion =>
          takes && t > leave
            ? Quaternion.multiply(
                Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
                rotation,
              )
            : rotation,
      };
    };
    const turn: (seconds: number) => number = takes
      ? HumanHandover.upright(
          body,
          side,
          (seconds: number, yaw: number): IAutoMovieMotionHumanPosture =>
            HumanHandoverUpright.posed(frameAt(seconds), side, yaw),
          leave,
          duration,
          [0, undefined],
        )
      : (): number => 0;

    const part: IAutoMovieMotionHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    return {
      duration,
      events: [
        {
          name: "gripClosed",
          share: Math.min(1, shared.gripClosed / duration),
        },
        { name: "taken", share: 1 },
      ],
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        ...(takes
          ? [
              {
                part,
                kind: "grip" as const,
                from: shared.gripClosed / duration,
                to: 1,
                support: {
                  kind: "prop" as const,
                  subject: context.params.prop,
                },
              },
            ]
          : []),
      ],
      ...(takes
        ? {
            holds: [
              {
                side,
                prop: context.params.prop,
                from: shared.gripClosed / duration,
                fingers: closed,
              },
            ],
          }
        : {}),
      hands: [side],
      contact: shared.gripClosed,
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        HumanHandoverUpright.posed(frameAt(seconds), side, turn(seconds)),
    };
  }
}
