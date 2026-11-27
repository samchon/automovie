import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineRigidCarrierSample,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRide,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HeldRideArms } from "./HeldRideArms";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";
import { RideRestingHands } from "./RideRestingHands";
import { WorkingSeatRidePlan } from "./WorkingSeatRidePlan";
import { humanRidePosting } from "./humanRidePosting";
import { humanRideWindows } from "./humanRideWindows";
import { placeRideFeet } from "./placeRideFeet";
import { prepareHumanEquestrianRide } from "./prepareHumanEquestrianRide";

/*
 * Riding: a seated person carried by a support that moves by itself, such as a
 * car, a bicycle or a horse given to the performance as a moving prop
 * (`AutoMovieMotionHumanObject.prop` with a motion).
 *
 * The rider sits down on the support first (`sit` on its seat where it stands
 * at that second; `AutoMovieMotionHumanObject.seat` reads a saddle with its pedals or
 * stirrups) and then rides it: the seated posture is carried rigidly with the
 * support, turning, leaning and pitching as it does, the seat and each foot
 * that rested on it bearing on it, so nothing slides in the support's frame.
 * The arms, the hands, the head and the trunk's turn are yielded, so steering,
 * holding on, waving, looking and aiming from the saddle are actions performed
 * over the ride. Register `HumanRide.ride` to use it.
 *
 * With `rising` the rider posts to a trot, by a stride time or on the strides
 * of a cue track; with `feet` each foot stays on a part that moves within the
 * support, a pedal on its crank or a stirrup; with `hands` each hand holds a
 * grip, a rein or a wheel's rim and follows it the same way, the trunk leaning
 * to keep the grips in reach. With `equestrian` the rider can articulate
 * relative to the saddle on the horse's touchdown clock, ride an authored jump,
 * or turn over one shoulder on a film cue. The ride passes its original seat on
 * as its base for dismounting.
 */
export namespace HumanRide {
  /*
   * Seconds a hand takes to reach the point it is to hold (provisional).
   */
  export const TAKE: number = 0.6;

  /*
   * How far a rising trot lifts the seat off the saddle, thigh lengths
   * (provisional: no rider kinematics were read).
   */
  export const POST: number = 0.25;

  /*
   * Ride a moving support, seated on it.
   */
  export const ride = {
    name: "ride",
    interrupts: {
      any: [{ window: { start: 0, end: 1 }, kind: "inertialize", entry: 0 }],
    },
    yields: [
      "head",
      "leftHand",
      "rightHand",
      "leftArm",
      "rightArm",
      "trunkTurn",
    ],
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
    ): WorkingSeatRidePlan.IPlan => {
      const { on, duration: seconds }: IAutoMovieMotionHumanRide.IParams =
        context.params;
      HumanBound.above("duration", seconds, 0, "s");
      const placeFeet: boolean = context.params.placeFeet === true;
      if (placeFeet) HumanBound.least("duration", seconds, TAKE, "s");

      // Any seated entry rides: straight from sitting down, from another ride, or from an act taken seated, which keeps the seated base.
      const entered: IAutoMovieMotionHumanBase = context.entry.base;
      if (entered.kind !== "seated")
        throw new AutoMovieMotionHumanRefusal({
          kind: "base",
          axis: "base",
          value: entered.kind,
          feasible: { kind: "alternatives", values: ["sit", "ride"] },
          reason: `a ride is entered seated on its support, and the performer is ${entered.kind}`,
          fix: "sit on the support's seat first, then ride it",
        });
      const support: IAutoMovieMotionHumanPropReader = context.prop(on);
      // A hand that holds a prop and takes no grip of the ride keeps the carriage it brought in, its prop gripped through the ride (`HeldRideArms`).
      const kept: HeldRideArms.IKept = HeldRideArms(context);
      const seated: IAutoMovieMotionHumanPosture = kept.posture;
      const origin: IAutoMovieRigidTransform = support.frame(context.start);
      // A rising trot stands in the stirrups, so it needs both.
      const rising: RideRising = context.params.rising;
      const posting: humanRidePosting.IPosting = humanRidePosting(
        rising === undefined
          ? undefined
          : typeof rising === "number"
            ? { kind: "period", seconds: rising }
            : {
                kind: "strides",
                cue: rising.cue,
                strides: context
                  .cue(rising.cue)
                  .map((c: IRideStridesC): number => c.seconds)
                  .sort((a: number, b: number): number => a - b),
              },
        context.start,
        POST * context.body.measure.thigh,
      );
      if (rising !== undefined) {
        if (
          !context.entry.feet.left.planted ||
          !context.entry.feet.right.planted
        )
          throw new AutoMovieMotionHumanRefusal({
            kind: "affordance",
            axis: "rising",
            value: rising,
            feasible: { kind: "alternatives", values: ["seated"] },
            reason: `a rising trot stands in the stirrups, and a foot of the rider rests on nothing`,
            fix: "sit on a saddle whose stirrups both legs reach, or ride seated",
          });
      }

      // Each foot keeps the support it entered with. A named stirrup plant
      // carries its entering fit in the tread frame. Moving pedals track
      // their crank points, and a foot that hung at entry keeps hanging.
      const { pedals, placed, retained }: placeRideFeet.ISupports =
        placeRideFeet.supports(context, support);
      const resting: humanRideWindows.IResting[] = [];
      for (const side of ["left", "right"] as const) {
        if (
          !context.entry.feet[side].planted ||
          (placeFeet && context.params.feet?.[side] !== undefined)
        )
          continue;
        const mounted: placeRideFeet.IRetained | undefined = retained.find(
          (foot: placeRideFeet.IRetained): boolean => foot.side === side,
        );
        if (mounted !== undefined) {
          resting.push({ side, pedal: mounted.id, socket: mounted.socket });
          continue;
        }
        const id: string | undefined = pedals.find(
          (pedal: placeRideFeet.IRidePedal): boolean => pedal.side === side,
        )?.id;
        resting.push(id === undefined ? { side } : { side, pedal: id });
      }

      // The hands: the points they hold, the lean that brings them in reach and the fingers closed on the support (`HumanRideHands`).
      const {
        posture,
        gripsAt,
        closures,
        alternatives,
      }: HumanRideHands.IHands = HumanRideHands(
        context,
        on,
        support,
        seated,
        origin,
        TAKE,
      );
      const saddle: string | undefined = context.params.seat;
      if (saddle !== undefined && support.prop.points[saddle] === undefined)
        throw new AutoMovieMotionHumanRefusal({
          kind: "affordance",
          axis: "seat",
          value: saddle,
          feasible: {
            kind: "alternatives",
            values: Object.keys(support.prop.points),
          },
          reason: `${on} has no point ${saddle} to sit on`,
          fix: "name the support's seat",
        });
      const sat: IAutoMovieVector3 | undefined =
        saddle === undefined
          ? undefined
          : support.prop.point?.(saddle, context.start)?.point;
      const equestrian: ReturnType<typeof prepareHumanEquestrianRide> =
        prepareHumanEquestrianRide(context, origin, sat);
      // An arm that takes no grip of the ride keeps where its entry displays it, resting or holding a prop; an articulation bends and tips the trunk over the pelvis, so there it rides the pelvis (`RideRestingHands`).
      const rests: RideRestingHands.Rests =
        equestrian === undefined
          ? {}
          : RideRestingHands(
              context.body,
              seated,
              context.entry.pose,
              (["left", "right"] as const).filter(
                (side: AutoMovieHumanSide): boolean =>
                  context.params.hands?.[side] === undefined,
              ),
            );
      const contacts: IAutoMovieMotionHumanContactWindow[] = humanRideWindows({
        on,
        seat: saddle,
        seconds,
        kept: kept.contacts,
        resting,
        placed: placed.map(
          (foot: (typeof placed)[number]): AutoMovieHumanSide => foot.side,
        ),
        take: TAKE,
        ...(equestrian?.offSeat === undefined
          ? {}
          : { offSeat: equestrian.offSeat }),
        rising: rising !== undefined,
      });

      // How far a part of the support has left the place the support alone would have carried it to from where it was when the ride began.
      const strayed = (
        id: string,
        began: IAutoMovieVector3,
        film: number,
        now: IAutoMovieRigidTransform,
        sample?: AutoMovieEngineRigidCarrierSample.IRead,
      ): IAutoMovieVector3 => {
        const moved: IAutoMovieVector3 | undefined =
          sample?.point(id).translation ??
          support.prop.point?.(id, film)?.point;
        return moved === undefined
          ? { x: 0, y: 0, z: 0 }
          : AutoMovieEngineVector3.subtract(
              moved,
              AutoMovieEngineVector3.add(
                now.position,
                AutoMovieEngineQuaternion.rotateVector(
                  AutoMovieEngineQuaternion.multiply(now.rotation, turned),
                  AutoMovieEngineVector3.subtract(began, origin.position),
                ),
              ),
            );
      };
      const turned: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(origin.rotation);
      // The pose and any certified candidate use the same actual carrier read.
      const written = <T>(
        at: number,
        publish: (
          posture: IAutoMovieMotionHumanPosture,
          frame: IAutoMovieRigidTransform,
        ) => T,
      ): T => {
        const film: number = context.start + Math.min(seconds, Math.max(0, at));
        const now: IAutoMovieRigidTransform = support.frame(film);
        const sample: AutoMovieEngineRigidCarrierSample.IRead | undefined =
          AutoMovieEngineRigidCarrierSample.playback(support.prop)?.sample(film);
        const taken: number = AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, at / TAKE));
        const grips: ReturnType<HumanRideHands.IHands["gripsAt"]> = gripsAt(
          film,
          now,
          sample,
        );
        const leant: IAutoMovieMotionHumanPosture = posture(
          grips,
          now,
          taken,
          taken === 1 ? film : undefined,
        );
        const carried: IAutoMovieMotionHumanPosture = carryHumanPosture(
          leant,
          origin,
          now,
        );

        // The pelvis keeps its place on the seat, so it tips with a support that leans or pitches; the heading stays the unwrapped one the carry gives.
        const tipped: Pick<IAutoMovieMotionHumanPosture, RideWrittenTipped> =
          humanPostureHeading.angles(
            AutoMovieEngineQuaternion.multiply(
              AutoMovieEngineQuaternion.multiply(now.rotation, turned),
              humanPostureHeading(leant),
            ),
          );

        // Rising, the seat lifts off the saddle along the mount's own up and comes back once a stride; the feet stay on their rests.
        const lift: number = posting.lift(at);

        const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(now.rotation, {
          x: 0,
          y: 1,
          z: 0,
        });

        // A foot on a part that moves within the support goes with the part: by how far the part has left the place the support alone would have carried it to.
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...carried.limbs,
        };
        for (const pedal of pedals) {
          const goal: IAutoMovieHumanLimbGoal | undefined =
            carried.limbs[`${pedal.side}Leg`];
          if (goal === undefined) continue;
          limbs[`${pedal.side}Leg`] = {
            ...goal,
            point: AutoMovieEngineVector3.add(
              goal.point,
              strayed(pedal.id, pedal.began, film, now),
            ),
          };
        }
        for (const foot of retained)
          limbs[`${foot.side}Leg`] = foot.at(film, sample);
        const seat: IAutoMovieVector3 =
          sat === undefined || saddle === undefined
            ? { x: 0, y: 0, z: 0 }
            : strayed(saddle, sat, film, now, sample);
        const out: IAutoMovieMotionHumanPosture = {
          ...carried,
          limbs,
          root: {
            x: carried.root.x + seat.x + up.x * lift,
            y: carried.root.y + seat.y + up.y * lift,
            z: carried.root.z + seat.z + up.z * lift,
          },
          yaw: tipped.yaw + 360 * Math.round((carried.yaw - tipped.yaw) / 360),
          pitch: tipped.pitch,
          roll: tipped.roll,
        };
        equestrian?.at(film - context.start, out, now, seat, up);
        for (const [side, rest] of Object.entries(rests) as [
          AutoMovieHumanSide,
          RideRestingHands.IRest,
        ][])
          limbs[`${side}Arm`] = RideRestingHands.place(rest, out);

        // A hand told to hold a point of the support goes to it over `TAKE` seconds and stays, turned to it and closed on it (`HumanMountRider.hold`).
        const grasp: IAutoMovieMotionHumanPosture["joints"] = {};
        const taking: ReturnType<typeof HumanMountRider.taking> | undefined =
          taken < 1 && grips.left !== undefined && grips.right !== undefined
            ? HumanMountRider.taking(context.body, out, taken)
            : undefined;
        for (const side of ["left", "right"] as const) {
          const grip: ReturnType<HumanRideHands.IHands["gripsAt"]>["left"] =
            grips[side];
          if (grip === undefined) continue;
          const closed: IAutoMovieMotionHumanPosture["joints"] =
            closures[side] ?? {};
          const held: ReturnType<typeof HumanMountRider.hold> =
            taking !== undefined
              ? taking(side, grip, closed)
              : HumanMountRider.hold(
                  context.body,
                  side,
                  out,
                  grip,
                  taken,
                  closed,
                );
          limbs[`${side}Arm`] = held.arm;
          Object.assign(grasp, held.fingers);
        }
        if (Object.keys(grasp).length > 0)
          out.joints = { ...out.joints, ...grasp };
        for (const foot of placed)
          limbs[foot.side === "left" ? "leftLeg" : "rightLeg"] =
            placeRideFeet.acquire(foot, out, film, taken);
        if (pedals.length === 0) return publish(out, now);

        // Where a pedal is further than the leg reaches with its knee still bent, the foot points down about its ball, as a cyclist's ankle does through the bottom of the stroke.
        const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
          context.body,
          out.root,
          humanPostureHeading(out),
          out.joints.hips,
        );
        for (const pedal of pedals) {
          const goal: IAutoMovieHumanLimbGoal | undefined =
            limbs[`${pedal.side}Leg`];
          if (goal !== undefined)
            limbs[`${pedal.side}Leg`] = HumanMountRider.ankled(
              context.body,
              pedal.side,

              // A pedalling foot bears on its ball, so where the ankle cannot give the foot its turn (at the top of the stroke) the ball stays on the pedal and the turn gives way; its knee bends forward, toward a point a thigh's length ahead of its hip (the bend hint picks the side only), whichever way the leg came onto it.
              {
                ...goal,
                contact:
                  goal.contact ??
                  HumanFoot.offset(context.body, pedal.side, "ball"),
                bend: AutoMovieEngineVector3.add(
                  hips[pedal.side],
                  AutoMovieEngineQuaternion.rotateVector(humanPostureHeading(out), {
                    x: 0,
                    y: 0,
                    z: context.body.measure.thigh,
                  }),
                ),
              },
              hips[pedal.side],
              humanPostureHeading(out),
            );
        }
        return publish(out, now);
      };
      const plan: WorkingSeatRidePlan.IPlan = {
        duration: seconds,
        events: [],
        contacts,

        ...(kept.holds.length === 0 ? {} : { holds: kept.holds }),

        // The seat sat on is passed on, so getting off after the ride still knows it.
        base: entered,
        posture: (at: number): IAutoMovieMotionHumanPosture =>
          written(at, WorkingSeatRidePlan.postureOnly),
        postureWithFrame: (at: number): WorkingSeatRidePlan.IWritten =>
          written(at, WorkingSeatRidePlan.withFrame),
      };
      if (placed.length !== 0)
        placeRideFeet.admit(
          context,
          placed,
          (at: number): IAutoMovieMotionHumanPosture => plan.posture(at),
          TAKE,
        );
      if (alternatives === undefined) return plan;
      return new WorkingSeatRidePlan(
        plan,
        context.body,
        alternatives,
        plan.postureWithFrame,
      );
    },
  } satisfies IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRide.IParams>;
}

/*
 * The alternatives of `RideWrittenTipped`'s site.
 */
type RideWrittenTipped = "yaw" | "pitch" | "roll";

/*
 * The record of `IRideStridesC`'s site.
 */
type IRideStridesC = { seconds: number };

/*
 * The alternatives of `RideRising`'s site.
 */
type RideRising = number | IRideRising | undefined;

/*
 * The record of `IRideRising`'s site.
 */
type IRideRising = { cue: string };
