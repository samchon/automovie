import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";

/**
 * Riding: a seated person carried by a support that moves by itself, such
 * as a car, a bicycle or a horse given to the performance as a moving prop
 * (`HumanObject.prop` with a motion).
 *
 * The rider sits down on the support first (`sit` on its seat where it
 * stands at that second; `HumanObject.seat` reads a saddle with its pedals
 * or stirrups) and then rides it: the seated posture is carried rigidly
 * with the support, turning, leaning and pitching as it does, the seat and
 * each foot that rested on it bearing on it, so nothing slides in the
 * support's frame. The arms, the hands and the head are yielded, so
 * steering, holding on, waving and looking are actions performed over the
 * ride. Register `HumanRide.ride` to use it.
 *
 * With `rising` the rider posts to a trot, by a stride time or on the
 * strides of a cue track; with `feet` each foot stays on a part that moves
 * within the support, a pedal on its crank or a stirrup; with `hands` each
 * hand holds a grip, a rein or a wheel's rim and follows it the same way.
 * First pass: the rider
 * leans exactly as the support does and absorbs no bump, a pedalling foot
 * keeps its pitch to the frame except where the leg would run short and it
 * points down about its ball (`HumanMountRider`), and mounting and dismounting are the
 * sitting actions. The ride passes on the seat it was entered on as its
 * base, so `rise` after it gets off a saddle to the left unasked.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what riding is here, how it is composed, what it yields and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record whose posture is the entry's seated posture moved by the support's rigid motion, with contact windows that name the support as their frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law and its parameters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The support's motion is read from the performance's prop, never from parameters of the rider's own.
 */
export namespace HumanRide {
  /** Parameters of a ride. */
  export interface IParams {
    /** The moving prop ridden: its subject id in the performance. */
    on: string;

    /** Seconds ridden. */
    seconds: number;

    /**
     * A rising trot: the mount's stride time, seconds, or the cue track of
     * the performance that holds its strides (the footfalls of one
     * diagonal, as the mount's own ride publishes them). The rider stands
     * in the stirrups and sits again once a stride, the seat rising `POST`
     * thigh lengths off the saddle, so both feet must rest on the support.
     * On a cue track the seat is down at each of its instants and seated
     * before the first and after the last. Seated throughout when absent.
     */
    rising?: number | { cue: string };

    /**
     * The support's point each foot stays on, by its id, for a part that
     * moves within the support: a pedal on its turning crank, a stirrup on
     * a trotting horse (`IHumanProp.point`). The foot keeps the place it
     * had on that point when the ride began. A foot not named, or a point
     * that only moves with the support, is carried rigidly.
     */
    feet?: Partial<Record<"left" | "right", string>>;

    /**
     * The support's point the seat stays on, by its id, where the seat
     * itself moves within the support: a saddle on a horse's trunk, which
     * rises and falls with the stride over the course its root follows.
     * The body is carried with the support alone when absent.
     */
    seat?: string;

    /**
     * The support's point each hand holds, by its id: a handlebar grip, a
     * rein, a wheel's rim. The hand goes to it over `TAKE` seconds from the
     * ride's start and stays on it, following a part that moves within the
     * support. The arms are still yielded, so an arm action over the ride
     * takes a hand off for as long as it lasts. First pass: the wrist is
     * placed and the hand's turn and the fingers' closure are not.
     */
    hands?: Partial<Record<"left" | "right", string>>;
  }

  /** Seconds a hand takes to reach the point it is to hold (provisional). */
  export const TAKE: number = 0.6;

  /** How far off a held point the wrist stays along the point's outward normal, hand lengths: about the palm's thickness (provisional, as the armrests' rest). */
  export const PALM: number = 0.2;

  /** How far a rising trot lifts the seat off the saddle, thigh lengths (provisional: no rider kinematics were read). */
  export const POST: number = 0.25;

  /** Ride a moving support, seated on it. */
  export const ride: IHumanActionLaw<IParams> = {
    name: "ride",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const { on, seconds }: IParams = context.params;
      if (!(seconds > 0))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "seconds",
          value: seconds,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: null,
            unit: "s",
            open: "minimum",
          },
          reason: "a ride lasts a positive time",
          fix: "give the seconds ridden",
        });

      // Any seated entry rides: straight from sitting down, from another ride, or from an act taken seated, which keeps the seated base.
      if (context.entry.base.kind !== "seated")
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: context.entry.base.kind,
          feasible: { kind: "alternatives", values: ["sit", "ride"] },
          reason: `a ride is entered seated on its support, and the performer is ${context.entry.base.kind}`,
          fix: "sit on the support's seat first, then ride it",
        });
      const support: IHumanActionContext.IProp = context.prop(on);
      const seated: IHumanPosture = context.entry.posture;
      const origin: IHumanProp.IFrame = support.frame(context.start);
      const bears = (
        part: IHumanContactWindow["part"],
        kind: IHumanContactWindow["kind"],
      ): IHumanContactWindow => ({
        part,
        kind,
        from: 0,
        to: 1,
        support: { kind: "prop", subject: on },
      });


      // A rising trot stands in the stirrups, so it needs both.
      const rising: number | { cue: string } | undefined =
        context.params.rising;
      const strides: readonly number[] =
        typeof rising === "object"
          ? context
              .cue(rising.cue)
              .map((c: { seconds: number }): number => c.seconds)
              .sort((a: number, b: number): number => a - b)
          : [];
      if (rising !== undefined) {
        if (typeof rising === "number")
          HumanBound.above("rising", rising, 0, "s");
        else if (strides.length < 2)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "rising",
            value: rising.cue,
            feasible: null,
            reason: `the cue track ${rising.cue} holds ${strides.length} instants, and a stride lies between two`,
            fix: "give a cue track with the mount's strides, or the stride time in seconds",
          });
        if (!context.entry.feet.left.planted || !context.entry.feet.right.planted)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "rising",
            value: rising,
            feasible: { kind: "alternatives", values: ["seated"] },
            reason: `a rising trot stands in the stirrups, and a foot of the rider rests on nothing`,
            fix: "sit on a saddle whose stirrups both legs reach, or ride seated",
          });
      }

      // A foot bears on the support only where it bore when the ride began: a foot that hangs from a saddle keeps hanging. The seat bears throughout unless the rider rises from it.
      const contacts: IHumanContactWindow[] =
        rising === undefined ? [bears("seat", "seat")] : [];
      for (const side of ["left", "right"] as const)
        if (context.entry.feet[side].planted)
          contacts.push(bears(`${side}Foot`, "plant"));
      const post: number = POST * context.body.measure.thigh;

      // How far through a stride a second of the ride is, 0 to 1; none outside the strides of a cue track.
      const stride = (at: number): number | undefined => {
        if (typeof rising === "number") return (at / rising) % 1;
        const film: number = context.start + at;
        for (let i: number = 0; i + 1 < strides.length; ++i)
          if (film >= strides[i]! && film < strides[i + 1]!)
            return (film - strides[i]!) / (strides[i + 1]! - strides[i]!);
        return undefined;
      };

      // The points the feet stay on, where they were when the ride began.
      const pedals: {
        side: "left" | "right";
        id: string;
        began: IAutoMovieVector3;
      }[] = [];
      for (const side of ["left", "right"] as const) {
        const id: string | undefined = context.params.feet?.[side];
        if (id === undefined) continue;
        if (
          support.prop.points[id] === undefined ||
          seated.limbs[`${side}Leg`] === undefined
        )
          throw new HumanRefusal({
            kind: "affordance",
            axis: "feet",
            value: id,
            feasible: {
              kind: "alternatives",
              values: Object.keys(support.prop.points),
            },
            reason:
              support.prop.points[id] === undefined
                ? `${on} has no point ${id} for the ${side} foot`
                : `the ${side} foot rests on nothing of ${on} when the ride begins`,
            fix: "name one of the support's points, and sit with that foot on its rest first",
          });
        const began: IAutoMovieVector3 | undefined = support.prop.point?.(
          id,
          context.start,
        )?.point;
        if (began !== undefined) pedals.push({ side, id, began });
      }
      const grips: Partial<Record<"left" | "right", IAutoMovieVector3>> = {};
      for (const side of ["left", "right"] as const) {
        const id: string | undefined = context.params.hands?.[side];
        if (id !== undefined && support.prop.points[id] === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "hands",
            value: id,
            feasible: {
              kind: "alternatives",
              values: Object.keys(support.prop.points),
            },
            reason: `${on} has no point ${id} for the ${side} hand`,
            fix: "name one of the support's points",
          });
        if (id !== undefined)
          grips[side] = Vector3.add(
            origin.position,
            Quaternion.rotateVector(
              origin.rotation,
              support.prop.points[id]!.point,
            ),
          );
      }

      // A rider whose arms do not reach what the hands hold leans the trunk forward until they do, as a cyclist does to the bar.
      const lean: number = HumanMountRider.lean(context.body, seated, grips);
      const saddle: string | undefined = context.params.seat;
      if (saddle !== undefined && support.prop.points[saddle] === undefined)
        throw new HumanRefusal({
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

      // How far a part of the support has left the place the support alone would have carried it to from where it was when the ride began.
      const strayed = (
        id: string,
        began: IAutoMovieVector3,
        film: number,
        now: IHumanProp.IFrame,
      ): IAutoMovieVector3 => {
        const moved: IAutoMovieVector3 | undefined = support.prop.point?.(
          id,
          film,
        )?.point;
        return moved === undefined
          ? { x: 0, y: 0, z: 0 }
          : Vector3.subtract(
              moved,
              Vector3.add(
                now.position,
                Quaternion.rotateVector(
                  Quaternion.multiply(now.rotation, turned),
                  Vector3.subtract(began, origin.position),
                ),
              ),
            );
      };
      const upright: IAutoMovieQuaternion = resolveHumanPosture.heading(seated);
      const turned: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
      return {
        duration: seconds,
        events: [],
        contacts,

        // The seat sat on is passed on, so getting off after the ride still knows it.
        base:
          context.entry.base.kind === "seated"
            ? context.entry.base
            : { kind: "seated" },
        posture: (at: number): IHumanPosture => {
          const now: IHumanProp.IFrame = support.frame(
            context.start + Math.min(seconds, Math.max(0, at)),
          );
          const carried: IHumanPosture = carryHumanPosture(seated, origin, now);

          // The pelvis keeps its place on the seat, so it tips with a support that leans or pitches; the heading stays the unwrapped one the carry gives.
          const tipped: Pick<IHumanPosture, "yaw" | "pitch" | "roll"> =
            resolveHumanPosture.angles(
            Quaternion.multiply(
              Quaternion.multiply(now.rotation, turned),
              upright,
            ),
          );

          // Rising, the seat lifts off the saddle along the mount's own up and comes back once a stride; the feet stay on their rests.
          const through: number | undefined =
            rising === undefined ? undefined : stride(at);
          const lift: number =
            through === undefined
              ? 0
              : post * Math.sin(Math.PI * through) ** 2;
          const up: IAutoMovieVector3 = Quaternion.rotateVector(now.rotation, {
            x: 0,
            y: 1,
            z: 0,
          });

          // A foot on a part that moves within the support goes with the part: by how far the part has left the place the support alone would have carried it to.
          const film: number =
            context.start + Math.min(seconds, Math.max(0, at));
          const limbs: IHumanPosture["limbs"] = { ...carried.limbs };
          for (const pedal of pedals) {
            const goal: IHumanPosture.IGoal | undefined =
              carried.limbs[`${pedal.side}Leg`];
            if (goal === undefined) continue;
            limbs[`${pedal.side}Leg`] = {
              ...goal,
              point: Vector3.add(
                goal.point,
                strayed(pedal.id, pedal.began, film, now),
              ),
            };
          }
          const seat: IAutoMovieVector3 =
            sat === undefined || saddle === undefined
              ? { x: 0, y: 0, z: 0 }
              : strayed(saddle, sat, film, now);
          const out: IHumanPosture = {
            ...HumanMountRider.leant(
              carried,
              lean * minimumJerk(Math.min(1, at / TAKE)).s,
            ),
            limbs,
            root: {
              x: carried.root.x + seat.x + up.x * lift,
              y: carried.root.y + seat.y + up.y * lift,
              z: carried.root.z + seat.z + up.z * lift,
            },
            yaw:
              tipped.yaw + 360 * Math.round((carried.yaw - tipped.yaw) / 360),
            pitch: tipped.pitch,
            roll: tipped.roll,
          };

          // A hand told to hold a point of the support goes to it over `TAKE` seconds and stays, a palm's thickness off it along its outward normal.
          for (const side of ["left", "right"] as const) {
            const id: string | undefined = context.params.hands?.[side];
            if (id === undefined) continue;
            const rest: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
              support.prop.points[id]!;
            const part:
              | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
              | undefined = support.prop.point?.(id, film);
            const target: IAutoMovieVector3 = Vector3.add(
              part?.point ??
                Vector3.add(
                  now.position,
                  Quaternion.rotateVector(now.rotation, rest.point),
                ),
              Vector3.scale(
                part?.normal ??
                  Quaternion.rotateVector(now.rotation, rest.normal),
                PALM * context.body.measure.hand,
              ),
            );
            const share: number = minimumJerk(Math.min(1, at / TAKE)).s;
            const legs: IHumanPosture["limbs"] = { ...limbs };
            delete legs.leftArm;
            delete legs.rightArm;
            limbs[`${side}Arm`] = {
              point:
                share >= 1
                  ? target
                  : Vector3.lerp(
                      poseBones(
                        context.body,
                        resolveHumanPosture(context.body, {
                          ...out,
                          limbs: legs,
                        }),
                      ).get(`${side}Hand`)!.worldPosition,
                      target,
                      share,
                    ),
              bend: AutoMovieMotionHumanBend.hang(context.body, out, side, 0.2),
              planted: share >= 1,
            };
          }
          if (pedals.length === 0) return out;

          // Where a pedal is further than the leg reaches with its knee still bent, the foot points down about its ball, as a cyclist's ankle does through the bottom of the stroke.
          const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
            context.body,
            out.root,
            resolveHumanPosture.heading(out),
            out.joints.hips,
          );
          for (const pedal of pedals) {
            const goal: IHumanPosture.IGoal | undefined =
              limbs[`${pedal.side}Leg`];
            if (goal !== undefined)
              limbs[`${pedal.side}Leg`] = HumanMountRider.ankled(
                context.body,
                pedal.side,

                // A pedalling foot faces the way the body does and its knee tracks ahead of its hip, over the pedal, whichever way the leg came onto it.
                {
                  ...goal,
                  rotation: resolveHumanPosture.heading(out),
                  bend: Vector3.add(
                    hips[pedal.side],
                    Quaternion.rotateVector(resolveHumanPosture.heading(out), {
                      x: 0,
                      y: 0.3 * context.body.measure.thigh,
                      z: context.body.measure.thigh,
                    }),
                  ),
                },
                hips[pedal.side],
                resolveHumanPosture.heading(out),
              );
          }
          return out;
        },
      };
    },
  };
}
