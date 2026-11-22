import { Vector3, minimumJerk, wrapDegrees } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { seated } from "../everyday/seated";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMount } from "./HumanMount";
import { HumanMountFlight } from "./HumanMountFlight";
import { HumanMountOnFrame } from "./HumanMountOnFrame";
import { HumanMountPlace } from "./HumanMountPlace";
import { HumanMountPush } from "./HumanMountPush";

/** Where the pelvis is at an instant of getting on (`HumanMountOnFrame`). */
type Frame = HumanMountOnFrame.Frame;

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
 * floor, its heel rolling up over the ball, until the extended leg's toes
 * leave, at the latest at the contact, or astride at 35 %, then follows over
 * 30 % of the climb; astride it crosses as the pelvis crosses, arriving at
 * the contact, its ankle passing above and behind the seat
 * (`HumanMount.OVER`). A foot bears on its
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The feet's ends and instants are computed once per instance; each posture passes its caller's forward-kinematics reader and range-of-motion projector to the hands' fit (`seated.arms`).
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<{
      seconds?: number;
      manner?: IAutoMovieMotionManner;
    }>,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    final: HumanMountOnFrame.IFinal,

    turn: number,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
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

    // The seat's height above the floor the feet leave (`seated.floor`).
    const under: number = seated.floor(body, context.entry);

    // A body already on the seat, as when getting off was broken off, only settles: no climb and no hop. It is on it when nearer its place than a hop rises, so a climb would overshoot its own seat.
    const settled: boolean =
      Vector3.length(Vector3.subtract(goal, start)) < HumanMount.HOP * m.thigh;
    const climb: number =
      (settled
        ? HumanMount.SETTLE
        : Math.min(
            4,
            2 * (1 + 0.6 * Math.max(0, seated.ratio(body, seat, under) - 1)),
          )) * AutoMovieMotionManner.of(context, context.params.manner).tempo;
    const duration: number = climb + hold;
    const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      yaw0,
    );
    const contact: number = 0.8 * climb;
    const hop: number = settled ? 0 : HumanMount.HOP * m.thigh;
    const crossing: readonly [number, number] = HumanMountOnFrame.crossing(
      climb,
      astride,
    );
    const frameAt: (t: number) => Frame = HumanMountOnFrame.of({
      body,
      seat,
      start,
      goal,
      climb,
      hop,
      yaw: yaw0,
      turn,
      final,
    });
    const hipsAt = (t: number): Record<"left" | "right", IAutoMovieVector3> => {
      const frame: Frame = frameAt(t);
      return hipJoints(
        body,
        frame.root,
        resolveHumanPosture.heading(frame),
        frame.joints.hips,
      );
    };

    // Where each foot ends: on its rest when the seated leg reaches it, on the floor when the hanging leg would pass it, hanging otherwise.
    const floor: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      yaw0,
    );
    const seatedHips: Record<"left" | "right", IAutoMovieVector3> =
      hipsAt(climb);
    const place = (side: "left" | "right"): HumanMountPlace.IPlace =>
      HumanMountPlace.of(
        body,
        side,
        seatedHips[side],
        yaw1,
        astride,
        seat.footrests?.[side],
        under,
      );
    const places: Record<"left" | "right", HumanMountPlace.IPlace> = {
      left: place("left"),
      right: place("right"),
    };

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
    const entry: IAutoMovieMotionHumanActionContext["entry"] = context.entry;
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
      ) < HumanMount.ON;
    const stays: Record<"left" | "right", boolean> = {
      left: stay("left"),
      right: stay("right"),
    };

    // The pushing leg extends as it pushes: as the pelvis rises its knee
    // straightens and its heel rolls up over the ball, by as much as the
    // shank, in the knee's own plane, would bend the flat foot's ankle past
    // what an unloaded ankle holds. The foot leaves when the extended leg's
    // toes leave: when even the rolled foot's ankle is past the leg's reach,
    // or the toes are extended as far as they go.
    const longest: number = m.thigh + m.shank;
    const rolledAt = (t: number): HumanMountPush.IRoll =>
      HumanMountPush.roll(
        body,
        push,
        legged(frameAt(t).root, floor)[`${push}Leg`]!,
        hipsAt(t)[push],
        yaw0 + (push === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
      );
    const off: number = onFloor[push]
      ? first(0, astride ? 0.35 * climb : contact, (t: number): boolean => {
          const rolled: HumanMountPush.IRoll = rolledAt(t);
          return rolled.reach > longest || rolled.roll > HumanMount.TOE_ROLL;
        })
      : 0;
    // As the foot leaves the floor, read once.
    let leaving: HumanMountPush.IRoll | undefined;
    const left = (): HumanMountPush.IRoll => (leaving ??= rolledAt(off));
    const flight: Record<"left" | "right", readonly [number, number]> = {
      left: [0, 0],
      right: [0, 0],
    };
    flight[lead] = [onFloor[lead] ? 0.1 * climb : 0, 0.45 * climb];
    // The far leg crosses a saddle's croup as the pelvis crosses onto it: a
    // foot that crossed ahead of the pelvis would have to rise above its hip.
    flight[push] = [
      off,
      astride ? crossing[1] : Math.min(climb, off + 0.3 * climb),
    ];

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
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
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
          support: { kind: "ground", height: under },
        });
      if (places[side].rests)
        contacts.push({
          part,
          kind: "plant",
          from: bearing[side] / duration,
          to: 1,
          // A foot rest bears at its own height, a stirrup's above the floor.
          support: { kind: "ground", height: places[side].height },
        });
    }
    // A swinging leg's goal at an instant, before its toes turn down.
    const flown = HumanMountFlight.of({
      body,
      flight,
      frameAt,
      hipsAt,
      legged,
      floor,
      onFloor,
      starts,
      places,
      bearing,
      push,
      left,
      yaw: yaw0,
      astride,
      over,
    });
    // Each swinging foot's turn out of the knee's plane as it leaves and as it arrives, read once.
    const twists: Partial<Record<"left" | "right", readonly [number, number]>> =
      {};
    const turnOf = (at: HumanMountFlight.IFlown): number =>
      HumanMountPush.twist(body, at.hip, at.goal)?.degrees ?? 0;
    const mounted: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "commit", share: commit / duration },
        { name: "seatContact", share: touch / duration },
        { name: "seated", share: climb / duration },
      ],
      contacts,
      contact: touch,
      base: { kind: "seated", seat },
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const frame: Frame = frameAt(t);
        const standing: IAutoMovieMotionHumanPosture["limbs"] = legged(
          frame.root,
          floor,
        );
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
        const toes: IAutoMovieMotionHumanPosture["joints"] = {};
        for (const side of ["left", "right"] as const) {
          const limb: "leftLeg" | "rightLeg" = `${side}Leg`;
          if (stays[side]) {
            limbs[limb] = HumanMount.leg(body, side, places[side].foot, true);
            continue;
          }
          const planted: IAutoMovieHumanLimbGoal = standing[limb]!;
          const [leaves, arrives]: readonly [number, number] = flight[side];
          if (onFloor[side] && t <= leaves) {
            if (side === push) {
              const rolled: HumanMountPush.IRoll = rolledAt(t);
              limbs[limb] = rolled.goal;
              toes[`${side}Toes`] = [rolled.roll, 0, 0];
            } else limbs[limb] = planted;
            continue;
          }
          const { share, hip, goal }: HumanMountFlight.IFlown = flown(side, t);
          // The foot's turn out of the knee's plane eases between its two
          // ends, so the knee keeps its own side (`HumanMountPush.twist`).
          // Once the foot is on its rest it keeps its own turn there.
          const lands: number = places[side].rests
            ? Math.min(arrives, bearing[side])
            : arrives;
          const ends: readonly [number, number] = (twists[side] ??= [
            turnOf(flown(side, leaves)),
            turnOf(flown(side, lands)),
          ]);
          const eased: number = minimumJerk.share(
            (t - leaves) / Math.max(1e-6, lands - leaves),
          );
          if (side === push && onFloor[side])
            toes[`${side}Toes`] = [left().roll * (1 - share), 0, 0];
          // A foot that bears nothing turns its toes down about its ball, so
          // the ball, not the ankle, comes onto the rest; once on it the heel
          // lowers about that ball as the seat takes the body, from the
          // contact to seated.
          limbs[limb] = HumanMountPush.tip(
            body,
            side,
            hip,
            t < lands
              ? HumanMountPush.squared(
                  body,
                  hip,
                  goal,
                  ends[0] + wrapDegrees(ends[1] - ends[0]) * eased,
                )
              : goal,
            places[side].rests && t >= bearing[side]
              ? 1 -
                  minimumJerk.share(
                    (t - bearing[side]) / Math.max(1e-6, climb - bearing[side]),
                  )
              : 1,
          );
        }
        return seated.arms(
          body,
          { ...frame, joints: { ...frame.joints, ...toes }, limbs },
          minimumJerk.share((t - 0.5 * climb) / (0.5 * climb)),
          resolution,
          projection,
        );
      },
    };

    return mounted;
  }
}
