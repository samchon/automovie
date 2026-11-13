import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { seated } from "../everyday/seated";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMount } from "./HumanMount";

/** Where the pelvis is at an instant of getting on: the root, the heading, the pelvis pitch and the set joints. */
type Frame = Pick<IHumanPosture, "root" | "yaw" | "pitch" | "joints">;

/**
 * Getting onto a high seat, or a seat sat astride, from standing beside or
 * in front of it: what `sit` plans where the feet cannot stay on the floor.
 *
 * The goal is the seat socket on its point on the seat (`seated.point`) and
 * each foot on its rest: the ball of the foot on the tread the seat names
 * for that side, the foot level. A foot whose seat names no rest, or whose
 * rest the seated leg cannot reach, hangs under a thigh in the direction
 * `HumanMount.HANG` gives, or stands on the floor where that would pass it.
 * The root follows from the socket and the trunk's pitch, and the legs and
 * the hands are solved by inverse kinematics.
 *
 * The socket travels up from 10 % of the climb, passes `HumanMount.HOP`
 * above the seat and sets down on it at 80 %, the `seatContact`. It crosses
 * to a seat sat on with the legs ahead over the first 70 %, and to one sat
 * astride from 30 to 80 %, after the far leg has left the floor. The
 * leading foot goes to its place from 10 to 45 %: the left one, or astride
 * the one on the side the performer stands. The other foot pushes off the
 * floor for as long as its leg reaches it, at the latest at the contact, or
 * astride at 35 %, then follows over 30 % of the climb; astride its ankle
 * passes above and behind the seat (`HumanMount.OVER`). A foot bears on its
 * rest once the seat has taken the body and the foot has arrived: a leg
 * cannot hold a fixed rest under a pelvis that still travels. So between
 * the push-off and the contact the body is off the floor, as in a hop onto
 * a stool or a vault onto a saddle; a climb that stands in a stirrup is not
 * modelled.
 *
 * It continues from the entry: a foot the entry holds off the floor, on a
 * rest, hanging or in flight, goes on from where it is, and a body already
 * on the seat, as when getting off was broken off, settles over
 * `HumanMount.SETTLE` seconds with no climb. `commit` is the instant the
 * first foot leaves the floor, the last at which the sitting can be
 * abandoned for standing.
 *
 * The climb lasts `2 (1 + 0.6 (r - 1))` seconds for a seat at `r` of the
 * popliteal height, at most 4 (provisional, continuing the sit's time), and
 * the trunk leans forward `HumanMount.LEAN` degrees at 40 % of it. First
 * pass: the pelvis does not turn toward the seat while a leg swings over,
 * and the hands do not hold the seat, a pommel or a bar.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goals, the fallback for a foot with no reachable rest, the timing with its provisional values and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One planner over the action-law core's types: a context in, a plan of world-metre postures and contact windows out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, called by `sit`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A stool and a saddle are one plan told apart by the seat's own `astride` and `footrests`; no object is named.
 */
export namespace HumanMountOn {
  /**
   * Plan getting onto a seat.
   *
   * @param context The sit's context.
   * @param seat The seat.
   * @param final The seated back: its pitch and trunk angles, degrees.
   * @param turn The turn from the entry heading to the seat's, degrees.
   * @returns The plan, with the sit's events `seatContact` and `seated`.
   * @throws {HumanRefusal} When the pelvis stands more than a leg's length from its place on the seat, with that length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the events and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Effector goals solved by the shared inverse kinematics: the seat socket on the seat, each ball of a foot on its tread. Every path is a minimum-jerk share (Flash and Hogan 1985). A foot is declared planted only while its hip keeps the ankle within the leg's reachable band, so no plant is held by a leg that cannot reach it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Refuse, time the climb, place the feet's ends, find when each foot leaves and bears, then one posture function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rest out of the seated leg's reach is not clamped onto: the foot hangs, as the seat's `footrests` doc declares. The timing shares and the constants of `HumanMount` are provisional and named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning scans the climb at 60 Hz three times, each step one forward-kinematics pass of the pelvis; a posture costs one such pass and the limb fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The feet's ends and instants are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
   */
  export function plan(
    context: IHumanActionContext<{
      seconds?: number;
      manner?: AutoMovieMotionManner.IManner;
    }>,
    seat: seated.ISeat,
    final: {
      pitch: number;
      joints: Partial<
        Record<AutoMovieHumanoidBone, readonly [number, number, number]>
      >;
    },
    turn: number,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m: IHumanBody["measure"] = body.measure;
    const astride: boolean = seat.astride === true;
    const yaw0: number = context.entry.posture.yaw;
    const yaw1: number = yaw0 + turn;
    const start: IAutoMovieVector3 = seated.socket(body, context.entry.posture);
    const goal: IAutoMovieVector3 = seated.point(body, seat);

    // The body gets on from within a leg's length of its place on the seat.
    const away: number = Math.hypot(goal.x - start.x, goal.z - start.z);
    const reach: number = m.thigh + m.shank;
    if (away > reach)
      throw new HumanRefusal({
        kind: "reach",
        axis: "seat",
        value: away,
        feasible: { kind: "range", minimum: 0, maximum: reach, unit: "m" },
        reason: `the pelvis stands ${away.toFixed(3)} m from its place on the seat, and a body gets onto a high seat from within a leg's length, ${reach.toFixed(3)} m`,
        fix: "walk up to the seat first",
      });

    const hold: number = context.params.seconds ?? 1;
    HumanBound.least("seconds", hold, 0, "s");

    // A body already on the seat, as when getting off was broken off, only settles: no climb and no hop.
    const settled: boolean =
      Vector3.length(Vector3.subtract(goal, start)) < 0.1 * m.thigh;
    const climb: number =
      (settled
        ? HumanMount.SETTLE
        : Math.min(
            4,
            2 * (1 + 0.6 * Math.max(0, seated.ratio(body, seat) - 1)),
          )) * AutoMovieMotionManner.of(context, context.params.manner).tempo;
    const duration: number = climb + hold;
    const contact: number = 0.8 * climb;
    const hop: number = settled ? 0 : HumanMount.HOP * m.thigh;
    const upright: IHumanPosture["joints"] = standUpright.of(body).joints;

    // The pelvis crosses to a saddle late, after the far leg has left the floor; it backs onto a stool from the start.
    const crossing: readonly [number, number] = astride
      ? [0.3 * climb, contact]
      : [0, 0.7 * climb];
    const frameAt = (t: number): Frame => {
      const across: number = minimumJerk(
        (t - crossing[0]) / (crossing[1] - crossing[0]),
      ).s;
      const socket: IAutoMovieVector3 = {
        x: start.x + (goal.x - start.x) * across,
        y:
          start.y +
          (goal.y + hop - start.y) *
            minimumJerk((t - 0.1 * climb) / (0.45 * climb)).s -
          hop * minimumJerk((t - 0.55 * climb) / (0.25 * climb)).s,
        z: start.z + (goal.z - start.z) * across,
      };
      const settle: number = minimumJerk((t - 0.6 * climb) / (0.4 * climb)).s;
      const lean: number =
        t < 0.6 * climb
          ? HumanMount.LEAN * minimumJerk(t / (0.4 * climb)).s
          : HumanMount.LEAN + (final.pitch - HumanMount.LEAN) * settle;
      const joints: IHumanPosture["joints"] = { ...stand.RELAXED, ...upright };
      for (const [bone, a] of Object.entries(final.joints) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]) {
        const was: readonly [number, number, number] = joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [
          was[0] + a[0] * settle,
          was[1] + a[1] * settle,
          was[2] + a[2] * settle,
        ];
      }
      const tilt: { pitch: number; joints: IHumanPosture["joints"] } =
        HumanTrunk.incline(joints, lean);
      const yaw: number = yaw0 + turn * across;
      return {
        root: seated.root(body, socket, { yaw, pitch: tilt.pitch, roll: 0 }),
        yaw,
        pitch: tilt.pitch,
        joints: tilt.joints,
      };
    };
    const hipsAt = (t: number): Record<"left" | "right", IAutoMovieVector3> => {
      const frame: Frame = frameAt(t);
      return hipJoints(
        body,
        frame.root,
        resolveHumanPosture.heading({ ...frame, roll: 0 }),
        frame.joints.hips,
      );
    };

    // Where each foot ends: on its rest when the seated leg reaches it, on the floor when the hanging leg would pass it, hanging otherwise.
    const floor: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      yaw0,
    );
    const span: readonly [number, number] = HumanMount.span(body);
    const within = (
      hip: IAutoMovieVector3,
      ankle: IAutoMovieVector3,
    ): boolean => {
      const d: number = Vector3.length(Vector3.subtract(ankle, hip));
      return d >= span[0] && d <= span[1];
    };
    const seatedHips: Record<"left" | "right", IAutoMovieVector3> =
      hipsAt(climb);
    const place = (
      side: "left" | "right",
    ): { foot: HumanMount.IFoot; rests: boolean } => {
      const sign: number = side === "left" ? 1 : -1;
      const hip: IAutoMovieVector3 = seatedHips[side];
      const heading: number = yaw1 + sign * stand.TOE_OUT;
      const tread: IAutoMovieVector3 | undefined = seat.footrests?.[side];
      if (tread !== undefined) {
        const ankle: IAutoMovieVector3 = Vector3.subtract(
          tread,
          Quaternion.rotateVector(
            HumanFrame.turn(heading),
            HumanFoot.offset(body, side, "ball"),
          ),
        );
        if (within(hip, ankle))
          return {
            foot: {
              ankle,
              bend: HumanFrame.point(
                { origin: hip, yaw: yaw1 },
                { x: sign * (astride ? 0.5 : 0.05), y: 0, z: 1 },
              ),
              yaw: heading,
            },
            rests: true,
          };
      }
      const thigh: readonly [number, number, number] =
        HumanMount.HANG[astride ? "astride" : "ahead"];
      const knee: IAutoMovieVector3 = HumanFrame.point(
        { origin: hip, yaw: yaw1 },
        {
          x: sign * thigh[0] * m.thigh,
          y: thigh[1] * m.thigh,
          z: thigh[2] * m.thigh,
        },
      );
      const grounded: boolean = knee.y - m.shank <= m.ankleHeight;
      return {
        foot: {
          ankle: { ...knee, y: Math.max(m.ankleHeight, knee.y - m.shank) },
          bend: knee,
          yaw: heading,
        },
        rests: grounded,
      };
    };
    const places: Record<
      "left" | "right",
      { foot: HumanMount.IFoot; rests: boolean }
    > = { left: place("left"), right: place("right") };

    // The leading foot, and when each foot leaves the floor and arrives.
    const lead: "left" | "right" =
      astride && HumanFrame.local({ origin: goal, yaw: seat.yaw }, start).x < 0
        ? "right"
        : "left";
    const push: "left" | "right" = lead === "left" ? "right" : "left";

    // A seat that is mounted from one side only refuses the other.
    if (
      astride &&
      seat.mount !== undefined &&
      seat.mount !== "either" &&
      seat.mount !== lead
    )
      throw new HumanRefusal({
        kind: "base",
        axis: "seat",
        value: lead,
        feasible: { kind: "alternatives", values: [seat.mount] },
        reason: `the performer stands on the seat's ${lead}, and this seat is mounted from its ${seat.mount}`,
        fix: `stand on the seat's ${seat.mount} side before sitting on it`,
      });
    const first = (
      from: number,
      to: number,
      found: (t: number) => boolean,
    ): number => {
      for (let t: number = from; t < to; t += 1 / 60) if (found(t)) return t;
      return to;
    };

    // A foot the entry already holds off the floor, on a rest, hanging or in flight, goes on from where it is, and one already on its rest stays there.
    const entry: IHumanActionContext["entry"] = context.entry;
    const onFloor: Record<"left" | "right", boolean> = {
      left: HumanMount.grounded(body, entry.feet.left),
      right: HumanMount.grounded(body, entry.feet.right),
    };
    const starts: Record<"left" | "right", HumanMount.IFoot> = {
      left: HumanMount.held(entry, "left"),
      right: HumanMount.held(entry, "right"),
    };
    const stay = (side: "left" | "right"): boolean =>
      !onFloor[side] &&
      entry.feet[side].planted &&
      places[side].rests &&
      Vector3.length(
        Vector3.subtract(starts[side].ankle, places[side].foot.ankle),
      ) < 0.005;
    const stays: Record<"left" | "right", boolean> = {
      left: stay("left"),
      right: stay("right"),
    };

    // The pushing foot leaves when its leg must be longer than it is: a leg pushing off straightens fully, past the band a resting foot is placed in, which a quiet stance already stands beyond.
    const stretch = (t: number): number =>
      Vector3.length(Vector3.subtract(floor[push], hipsAt(t)[push]));
    const longest: number = m.thigh + m.shank;
    const off: number = onFloor[push]
      ? first(
          0,
          astride ? 0.35 * climb : contact,
          (t: number): boolean => stretch(t) > longest,
        )
      : 0;
    const flight: Record<"left" | "right", readonly [number, number]> = {
      left: [0, 0],
      right: [0, 0],
    };
    flight[lead] = [onFloor[lead] ? 0.1 * climb : 0, 0.45 * climb];
    flight[push] = [off, Math.min(climb, off + 0.3 * climb)];

    // A foot bears on its rest once the seat has taken the body and the foot has arrived: before that the pelvis is still on its way, and a leg cannot hold a fixed rest under a pelvis that travels.
    const bears = (side: "left" | "right"): number =>
      stays[side] ? 0 : Math.max(contact, flight[side][1]);
    const bearing: Record<"left" | "right", number> = {
      left: bears("left"),
      right: bears("right"),
    };
    const over: IAutoMovieVector3 = HumanFrame.point(
      { origin: goal, yaw: seat.yaw },
      {
        x: 0,
        y: HumanMount.OVER.above * m.thigh,
        z: -HumanMount.OVER.behind * m.thigh,
      },
    );

    // The seat bears from the contact, or from the start under a body already on it. The sitting is committed when the first foot leaves the floor: until then it can be abandoned for standing.
    const touch: number = settled ? 0 : contact;
    const commit: number = Math.min(
      onFloor.left ? flight.left[0] : 0,
      onFloor.right ? flight.right[0] : 0,
    );
    const contacts: IHumanContactWindow[] = [
      {
        part: "seat",
        kind: "seat",
        from: touch / duration,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    for (const side of ["left", "right"] as const) {
      const part: "leftFoot" | "rightFoot" = `${side}Foot`;
      if (onFloor[side] && flight[side][0] > 0)
        contacts.push({
          part,
          kind: "plant",
          from: 0,
          to: flight[side][0] / duration,
          support: { kind: "ground" },
        });
      if (places[side].rests)
        contacts.push({
          part,
          kind: "plant",
          from: bearing[side] / duration,
          to: 1,
          support: { kind: "ground" },
        });
    }
    return {
      duration,
      events: [
        { name: "commit", share: commit / duration },
        { name: "seatContact", share: touch / duration },
        { name: "seated", share: climb / duration },
      ],
      contacts,
      contact: touch,
      base: { kind: "seated", seat },
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const frame: Frame = frameAt(t);
        const standing: IHumanPosture["limbs"] = stand.legs(
          body,
          frame.root,
          yaw0,
          floor,
        );
        const limbs: IHumanPosture["limbs"] = {};
        for (const side of ["left", "right"] as const) {
          const limb: "leftLeg" | "rightLeg" = `${side}Leg`;
          if (stays[side]) {
            limbs[limb] = HumanMount.leg(body, side, places[side].foot, true);
            continue;
          }
          const planted: IHumanPosture.IGoal = standing[limb]!;
          const [leaves, arrives]: readonly [number, number] = flight[side];
          if (onFloor[side] && t <= leaves) {
            limbs[limb] = planted;
            continue;
          }
          const share: number = minimumJerk(
            (t - leaves) / (arrives - leaves),
          ).s;
          limbs[limb] = HumanMount.leg(
            body,
            side,
            HumanMount.between(
              onFloor[side]
                ? {
                    ankle: floor[side],
                    bend: planted.bend,
                    yaw:
                      yaw0 +
                      (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
                  }
                : starts[side],
              places[side].foot,
              share,
              0.1 * m.shank,
              astride && side === push ? over : undefined,
            ),
            places[side].rests && t >= bearing[side],
          );
        }
        return seated.arms(
          body,
          { ...frame, roll: 0, limbs },
          minimumJerk((t - 0.5 * climb) / (0.5 * climb)).s,
        );
      },
    };
  }
}
