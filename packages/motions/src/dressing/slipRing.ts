import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSlipRing,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { StrikingBody } from "../striking/StrikingBody";
import { HumanWornItem } from "./HumanWornItem";

/** Where along the proximal phalanx a ring rests, as a share from its base joint (provisional: a ring sits on the phalanx's proximal third). */
const SEAT: number = 0.35;

/** How far beyond the fingertip the ring lines up before it slides on, metres (provisional: clear of the fingertip by a ring's width). */
const LINE_UP: number = 0.015;

/** The step the band's free roll about the finger is searched by, degrees. */
const ROLL: number = 15;

/** World up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Slip a ring onto a partner's finger (#4015). The partner's presented hand
 * is read where it is at the action's start, so the partner presents it
 * first (`presentHand`). The dresser's other hand takes the partner's
 * forearm from its own side, its fingers toward the partner's wrist, and holds it from `ready` to `relax`. The ring hand brings
 * the ring's hole onto the finger's axis `LINE_UP` beyond the fingertip by
 * `ready`, then slides it along the axis to `SEAT` of the proximal phalanx
 * over the stroke: the ring's `wear` axis lies along the finger, from the
 * fingertip toward the hand, its roll about the finger the one, by `ROLL`
 * steps, that turns the holding hand least from how it holds the ring. From `strokeEnd` the ring is worn on the
 * partner's proximal bone and the ring hand's grip ends, so custody passes
 * without a gap; both hands then return. Both arms are laid in one course
 * (`courseArmGoal` with `with`), the hands excused from each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who holds what, the ring's path, the custody change, the timing and the course.
 * @evidence contracts/development/design.md#principled-representation The ring's frame along the partner's finger axis is the plan; both hands follow from it and from the partner's palm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds the finger's axis, the seat and the custody change; transport, phrase, course and reach refusals are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ring is never posed here; the performance carries it in the hand and then on the partner's bone.
 */
export const slipRing: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSlipRing> =
  {
    name: "slipRing",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSlipRing>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanSlipRing = context.params;
      const body: IAutoMovieMotionHumanBody = context.body;
      const side: AutoMovieHumanSide = p.side ?? "right";
      const steady: AutoMovieHumanSide = side === "right" ? "left" : "right";
      const hand: AutoMovieHumanSide = p.hand ?? "left";
      const finger: IAutoMovieMotionHumanSlipRing.Finger = p.finger ?? "ring";
      if (p.partner === context.subject)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "partner",
          value: p.partner,
          reason: "a ring is slipped onto another performer's finger",
          fix: "name another performer as the partner",
        });
      const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
        context,
        side,
        p.prop,
      );
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        p.partner,
      );

      // The finger's axis where the partner presents it at the start.
      const Finger: string = finger[0]!.toUpperCase() + finger.slice(1);
      const base: AutoMovieHumanoidBone =
        `${hand}${Finger}Proximal` as AutoMovieHumanoidBone;
      const middle: AutoMovieHumanoidBone =
        `${hand}${Finger}Intermediate` as AutoMovieHumanoidBone;
      const tipRegion: AutoMovieHumanoidRegion =
        `${finger}Tip${hand === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion;
      const palmRegion: AutoMovieHumanoidRegion =
        hand === "left" ? "palmLeft" : "palmRight";
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        partner.bones(context.start);
      const knuckle: IAutoMovieResolvedBone | undefined = bones.get(base);
      const joint: IAutoMovieResolvedBone | undefined = bones.get(middle);
      if (knuckle === undefined || joint === undefined)
        throw new HumanRefusal({
          kind: "participant",
          axis: "finger",
          value: finger,
          reason: `the partner's rig has no ${base} or ${middle} bone to wear a ring on`,
          fix: "name a finger the partner's rig has",
        });
      const tip: IAutoMovieVector3 = StrikingBody.region(
        partner.body,
        bones,
        tipRegion,
      ).point;
      const seat: IAutoMovieVector3 = Vector3.lerp(
        knuckle.worldPosition,
        joint.worldPosition,
        SEAT,
      );
      // From the fingertip toward the hand: the way the ring travels.
      const axis: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(seat, tip),
      );
      const palm: ReturnType<typeof StrikingBody.region> = StrikingBody.region(
        partner.body,
        bones,
        palmRegion,
      );

      // The ring's frame on the axis: its `wear` socket's `+Y` along the axis.
      const wear: IAutoMovieAffordance | undefined = held.affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === "wear",
      );
      if (wear === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "prop",
          value: p.prop,
          reason: `${p.prop} declares no wear socket to put on a finger`,
          fix: "give the ring a wear socket along its hole's axis",
        });
      const lined: IAutoMovieQuaternion = HumanHand.align(
        {
          normal: Quaternion.rotateVector(wear.frame.rotation, UP),
          forward: Quaternion.rotateVector(wear.frame.rotation, {
            x: 1,
            y: 0,
            z: 0,
          }),
        },
        {
          normal: axis,
          forward:
            Math.abs(Vector3.dot(axis, UP)) > 0.9 ? { x: 1, y: 0, z: 0 } : UP,
        },
      );
      // A band is round, so its roll about the finger is free: the roll
      // that turns the holding hand least from how it holds the ring now.
      const holding: IAutoMovieQuaternion = poseBones(
        body,
        context.entry.pose,
      ).get(`${side}Hand`)!.worldRotation;
      let turn: IAutoMovieQuaternion = lined;
      let nearest: number = -1;
      for (let roll: number = 0; roll < 360; roll += ROLL) {
        const candidate: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(Quaternion.fromAxisAngle(axis, roll), lined),
        );
        const hand: IAutoMovieQuaternion = Quaternion.multiply(
          candidate,
          Quaternion.inverse(held.frame.rotation),
        );
        const near: number = Math.abs(
          hand.x * holding.x +
            hand.y * holding.y +
            hand.z * holding.z +
            hand.w * holding.w,
        );
        if (near > nearest) {
          nearest = near;
          turn = candidate;
        }
      }
      const ring = (centre: IAutoMovieVector3): IAutoMovieRigidTransform => ({
        position: Vector3.subtract(
          centre,
          Quaternion.rotateVector(turn, wear.frame.translation),
        ),
        rotation: turn,
      });
      const begin: IAutoMovieVector3 = Vector3.add(
        tip,
        Vector3.scale(axis, -LINE_UP),
      );
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const bend = (arm: AutoMovieHumanSide): IAutoMovieVector3 =>
        AutoMovieMotionHumanBend.hang(body, entry, arm);
      const ringAt = (
        progress: number,
      ): IAutoMovieMotionHumanArmTarget.ITarget =>
        HumanWornItem.holding(
          body,
          side,
          held,
          ring(Vector3.lerp(begin, seat, progress)),
          bend(side),
        );

      // The steadying palm takes the partner's forearm a third of the way
      // from the wrist to the elbow, from the side facing the steadying
      // shoulder, its fingers toward the partner's wrist: on the presented
      // hand the two hands converged and their forearms crossed (25 mm,
      // then 22.8 mm on either side of the hand). The palm lies the forearm's
      // radius off its axis toward the steadying shoulder and faces back
      // onto it, so the steadying arm comes in from its own side.
      const wrist: IAutoMovieVector3 = bones.get(
        `${hand}Hand` as AutoMovieHumanoidBone,
      )!.worldPosition;
      const elbow: IAutoMovieVector3 = bones.get(
        `${hand}LowerArm` as AutoMovieHumanoidBone,
      )!.worldPosition;
      const grasped: IAutoMovieVector3 = Vector3.lerp(wrist, elbow, 1 / 3);
      const along: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(wrist, elbow),
      );
      const shoulder: IAutoMovieVector3 = poseBones(
        body,
        context.entry.pose,
      ).get(`${steady}UpperArm`)!.worldPosition;
      const toward: IAutoMovieVector3 = Vector3.subtract(shoulder, grasped);
      const outward: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          toward,
          Vector3.scale(along, Vector3.dot(toward, along)),
        ),
      );
      const under: IAutoMovieMotionHumanArmTarget.ITarget =
        AutoMovieMotionHumanArmTarget.prepareTarget(
          body,
          steady,
          "palm",
          "flat",
        )({
          point: Vector3.add(
            grasped,
            Vector3.scale(outward, partner.body.measure.forearmRadius),
          ),
          rotation: HumanHand.align(
            HumanHand.offset(body, steady, "palm", "flat"),
            {
              normal: Vector3.scale(outward, -1),
              forward: along,
            },
          ),
          bend: bend(steady),
        });

      // Each hand's place before and after, and the phases on one clock.
      const pose: ReturnType<typeof poseBones> = poseBones(
        body,
        context.entry.pose,
      );
      const frame = { origin: entry.root, yaw: entry.yaw };
      const origins: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanArmTarget.IOrigin
      > = {
        left: AutoMovieMotionHumanArmTarget.origin(
          body,
          pose,
          frame,
          "left",
          side === "left" ? "grip" : "palm",
        ),
        right: AutoMovieMotionHumanArmTarget.origin(
          body,
          pose,
          frame,
          "right",
          side === "right" ? "grip" : "palm",
        ),
      };
      const from = (arm: AutoMovieHumanSide): IAutoMovieVector3 =>
        AutoMovieMotionHumanArmTarget.point(entry, origins[arm]);
      const prepare: number = AutoMovieMotionHumanTiming.transport(
        Math.max(
          Vector3.distance(from(side), ringAt(0).point),
          Vector3.distance(from(steady), under.point),
        ),
      );
      const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
        prepare,
        attack: AutoMovieMotionHumanTiming.transport(
          Vector3.distance(begin, seat),
        ),
        hold: AutoMovieMotionHumanTiming.seconds("beat"),
        retract: prepare,
      });
      const plan: IAutoMovieMotionHumanActionPlan =
        composeAutoMovieMotionHumanAction({
          base: AutoMovieMotionHumanBase.under(context, clock.duration),
          clock,
          primitives: [
            {
              ...AutoMovieMotionHumanArmPhrase.stroke({
                body,
                clock,
                side,
                origin: origins[side],
                path: (
                  _posture: IAutoMovieMotionHumanPosture,
                  _seconds: number,
                  progress: number,
                ): IAutoMovieMotionHumanArmTarget.ITarget => ringAt(progress),
              }),
              // The holding hand keeps the fingers it holds the ring with.
              channels: [`${side}Arm`],
              reads: ["root", `${side}Arm`, `${side}Hand`],
            },
            {
              ...AutoMovieMotionHumanArmPhrase.stroke({
                body,
                clock,
                side: steady,
                origin: origins[steady],
                path: (): IAutoMovieMotionHumanArmTarget.ITarget => under,
              }),
              reads: ["root", `${steady}Arm`, `${steady}Hand`],
            },
          ],
          contact: "strokeEnd",
        });
      const span = {
        start: 0,
        ready: clock.at("ready"),
        relax: clock.at("relax"),
        end: clock.duration,
      };
      const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
        body,
        plan,
        side,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        span,
        grasp: ["hand"],
        with: [
          {
            side: steady,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, steady),
            grasp: ["hand"],
          },
        ],
      });
      const worn: number = clock.at("strokeEnd") / clock.duration;
      return {
        ...coursed,
        contacts: [
          ...coursed.contacts,
          {
            part: side === "left" ? "leftHand" : "rightHand",
            kind: "grip",
            from: 0,
            to: worn,
            support: { kind: "prop", subject: p.prop },
          },
          {
            part: steady === "left" ? "leftHand" : "rightHand",
            kind: "grip",
            from: clock.at("ready") / clock.duration,
            to: clock.at("relax") / clock.duration,
            support: { kind: "person", subject: p.partner, region: palmRegion },
          },
        ],
        wears: [
          ...(coursed.wears ?? []),
          { prop: p.prop, bone: base, from: worn, wearer: p.partner },
        ],
      };
    },
  };
