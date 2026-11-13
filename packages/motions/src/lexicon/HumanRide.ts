import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

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
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

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
 * within the support, a pedal on its crank or a stirrup. A hand on a grip,
 * a wheel or a rein is an arm action over the ride aimed at that point of
 * the prop, which follows the part the same way. First pass: the rider
 * leans exactly as the support does and absorbs no bump, a pedalling foot
 * keeps its pitch to the frame except where the leg would run short and it
 * points down about its ball (`KNEE`, `ANKLING`), and mounting and dismounting are the
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
  }

  /** How far a rising trot lifts the seat off the saddle, thigh lengths (provisional: no rider kinematics were read). */
  export const POST: number = 0.25;

  /** The knee flexion a pedalling leg keeps at the bottom of the stroke, degrees: the low end of the 25 to 35 a saddle is set for (Bini, Hume and Croft 2011, Sports Med 41:463, as the bicycle archetype cites it; not re-read here, so provisional). */
  export const KNEE: number = 25;

  /** The furthest a pedalling foot points down from the pitch it mounted with, degrees (provisional, inside the ankle's 50 of plantar flexion). */
  export const ANKLING: number = 35;

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

      // A foot goal turned toes-down about its contact until its ankle is within the leg's reach of a hip, no further than `ANKLING`.
      const reach: number =
        (context.body.measure.thigh + context.body.measure.shank) *
        Math.cos((KNEE * Math.PI) / 360);
      const ankled = (
        goal: IHumanPosture.IGoal,
        hip: IAutoMovieVector3,
      ): IHumanPosture.IGoal => {
        const rotation: IAutoMovieQuaternion | undefined = goal.rotation;
        const contact: IAutoMovieVector3 | undefined = goal.contact;
        if (rotation === undefined || contact === undefined) return goal;
        const ball: IAutoMovieVector3 = Vector3.add(
          goal.point,
          Quaternion.rotateVector(rotation, contact),
        );
        const across: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
          x: 1,
          y: 0,
          z: 0,
        });
        const turnedBy = (degrees: number): IHumanPosture.IGoal => {
          const pitched: IAutoMovieQuaternion = Quaternion.multiply(
            Quaternion.fromAxisAngle(across, degrees),
            rotation,
          );
          return {
            ...goal,
            rotation: pitched,
            point: Vector3.subtract(
              ball,
              Quaternion.rotateVector(pitched, contact),
            ),
          };
        };
        const far = (degrees: number): number =>
          Vector3.length(Vector3.subtract(turnedBy(degrees).point, hip));
        if (far(0) <= reach) return goal;
        const sign: number = far(1) < far(-1) ? 1 : -1;
        if (far(sign * ANKLING) > reach) return turnedBy(sign * ANKLING);
        let low: number = 0;
        let high: number = ANKLING;
        for (let i: number = 0; i < 24; ++i) {
          const middle: number = (low + high) / 2;
          if (far(sign * middle) > reach) low = middle;
          else high = middle;
        }
        return turnedBy(sign * high);
      };
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
            ...carried,
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
              limbs[`${pedal.side}Leg`] = ankled(goal, hips[pedal.side]);
          }
          return out;
        },
      };
    },
  };
}
