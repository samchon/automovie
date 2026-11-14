import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { rise } from "../everyday/rise";
import { seated } from "../everyday/seated";
import type { HumanBase } from "../law/HumanBase";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMount } from "./HumanMount";

/** Where the pelvis is at an instant of getting off: the root, the heading, the pelvis pitch and the set joints. */
type Frame = Pick<IHumanPosture, "root" | "yaw" | "pitch" | "joints">;

/**
 * Getting off a high seat onto the floor: what `rise` plans where a foot is
 * off the floor, on a rest or hanging.
 *
 * The goal is the standing posture of the stand law over two floor places:
 * ahead of the seat, the pelvis `HumanMount.AHEAD` thigh lengths ahead of
 * where it sat, or beside a seat sat astride, `HumanMount.BESIDE` thigh
 * lengths beyond where the near foot rode. The seat socket travels from the
 * seat to where it stands there, the root follows from it and the trunk's
 * pitch, and the legs and the hands are solved by inverse kinematics.
 *
 * The socket leaves the seat at 15 % of the time, the `seatOff`; sideways
 * it first rises `HumanMount.HOP` so the thigh clears the seat. Both feet
 * leave their rests before that, while the seat still bears the body: a
 * leg cannot hold a fixed rest under a pelvis that travels. The first foot
 * off, at 5 %, is the left one, or sideways the far one, whose ankle passes
 * back over the seat (`HumanMount.OVER`); the other follows at 10 %. Each
 * lands at the first instant, from 30 %, at which its leg reaches its floor
 * place from the descending hip, the second at least 20 % after it left.
 * Where no leg reaches the floor from the seat, the body slides off it
 * until the first foot lands; stepping down in a stirrup is not modelled.
 * `standing` comes at 90 %.
 *
 * The time is `2 (1 + 0.6 (r - 1))` seconds for a socket resting at `r` of
 * the popliteal height, at most 4 (provisional, as getting on). First pass:
 * the pelvis does not turn while a leg swings over, and the hands hold
 * nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, where the body ends, the order and timing of the feet with provisional values, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One planner over the action-law core's types: a context in, a plan of world-metre postures and contact windows out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, called by `rise`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads only the entry state and the entered sit's seat; no object is named.
 */
export namespace HumanMountOff {
  /**
   * Plan getting off a seat.
   *
   * @param context The rise's context.
   * @param start The seat socket where it rests, world metres.
   * @param r The socket's height as a share of the popliteal height.
   * @returns The plan, with the rise's events `seatOff` and `standing`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the events.
   * @evidence contracts/development/implementation.md#principled-implementation The end is the stand law's own root over the floor places, so the next action starts from a quiet stance. Every path is a minimum-jerk share (Flash and Hogan 1985). A foot lands only when its hip brings the floor place within the leg's reachable band, and keeps a rest only while it is within that band, so no plant is held by a leg that cannot reach it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Choose the side, place the standing feet, time the descent, find when each foot leaves and lands, then one posture function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The side defaults to the left only for a seat the entered sit names as astride; after any other entry the composition states it. The timing shares and the constants of `HumanMount` are provisional and named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning scans the time at 60 Hz three times, each step one forward-kinematics pass of the pelvis; a posture costs one such pass and the limb fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The floor places and the feet's instants are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
   */
  export function plan(
    context: IHumanActionContext<rise.IParams>,
    start: IAutoMovieVector3,
    r: number,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m: IHumanBody["measure"] = body.measure;
    const entry: IHumanEntryState = context.entry;
    const yaw: number = entry.posture.yaw;
    const pitch0: number = entry.posture.pitch;
    const sat: HumanBase.ISeat | undefined =
      entry.base.kind === "seated" ? entry.base.seat : undefined;
    const side: "left" | "right" | undefined =
      sat?.mount === "left" || sat?.mount === "right" ? sat.mount : undefined;
    const to: NonNullable<rise.IParams["to"]> =
      context.params.to ?? (sat?.astride === true ? (side ?? "left") : "front");

    // A seat got onto from one side only is got off on that side.
    if (sat?.astride === true && side !== undefined && to !== side)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: to,
        feasible: { kind: "alternatives", values: [side] },
        reason: `this seat is got off on its ${side}, the side it is mounted from, and the rise asks for ${to}`,
        fix: `leave \`to\` out, or give ${side}`,
      });
    const sideways: boolean = to !== "front";
    const near: "left" | "right" = to === "right" ? "right" : "left";
    const leader: "left" | "right" = sideways
      ? near === "left"
        ? "right"
        : "left"
      : "left";
    const follower: "left" | "right" = leader === "left" ? "right" : "left";

    // Where it stands afterwards: the pelvis clear of the seat, the feet at their rest places under it.
    const under: HumanFrame.IFrame = { origin: { ...start, y: 0 }, yaw };
    const stood: HumanFrame.IFrame = {
      origin: HumanFrame.point(
        under,
        sideways
          ? {
              x:
                (near === "left" ? 1 : -1) *
                (Math.abs(HumanFrame.local(under, entry.feet[near].ankle).x) +
                  HumanMount.BESIDE * m.thigh),
              y: 0,
              z: 0,
            }
          : { x: 0, y: 0, z: HumanMount.AHEAD * m.thigh },
      ),
      yaw,
    };
    const floorPlace = (side: "left" | "right"): IAutoMovieVector3 => {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      return HumanFrame.point(stood, {
        x: rest.x,
        y: m.ankleHeight,
        z: rest.z,
      });
    };
    const landing: Record<"left" | "right", IAutoMovieVector3> = {
      left: floorPlace("left"),
      right: floorPlace("right"),
    };
    const goal: IAutoMovieVector3 = seated.socket(body, {
      root: stand.root(body, landing, yaw),
      yaw,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });

    const duration: number =
      Math.min(4, 2 * (1 + 0.6 * Math.max(0, r - 1))) *
      AutoMovieMotionManner.of(context, context.params.manner).tempo;
    const seatOff: number = 0.15 * duration;
    const hop: number = sideways ? HumanMount.HOP * m.thigh : 0;
    const upright: IHumanPosture["joints"] = standUpright.of(body).joints;
    const crossing: readonly [number, number] = sideways
      ? [0.3 * duration, 0.8 * duration]
      : [seatOff, 0.8 * duration];
    const frameAt = (t: number): Frame => {
      const across: number = minimumJerk(
        (t - crossing[0]) / (crossing[1] - crossing[0]),
      ).s;
      const socket: IAutoMovieVector3 = {
        x: start.x + (goal.x - start.x) * across,
        y:
          start.y +
          hop * minimumJerk((t - seatOff) / (0.2 * duration)).s +
          (goal.y - start.y - hop) *
            minimumJerk((t - 0.35 * duration) / (0.5 * duration)).s,
        z: start.z + (goal.z - start.z) * across,
      };
      const lean: number =
        t < 0.4 * duration
          ? pitch0 +
            (HumanMount.LEAN - pitch0) * minimumJerk(t / (0.4 * duration)).s
          : HumanMount.LEAN *
            (1 - minimumJerk((t - 0.4 * duration) / (0.6 * duration)).s);
      const tilt: { pitch: number; joints: IHumanPosture["joints"] } =
        HumanTrunk.incline({ ...stand.RELAXED, ...upright }, lean);
      return {
        root: seated.root(body, socket, { yaw, pitch: tilt.pitch, roll: 0 }),
        yaw,
        pitch: tilt.pitch,
        joints: tilt.joints,
      };
    };
    const span: readonly [number, number] = HumanMount.span(body);
    const stretch = (
      t: number,
      side: "left" | "right",
      ankle: IAutoMovieVector3,
    ): number => {
      const frame: Frame = frameAt(t);
      return Vector3.length(
        Vector3.subtract(
          ankle,
          hipJoints(
            body,
            frame.root,
            resolveHumanPosture.heading({ ...frame, roll: 0 }),
            frame.joints.hips,
          )[side],
        ),
      );
    };

    // A leg reaches a place within its reachable band, or as far as it stands stretched in the quiet stance the getting off ends in, which holds it nearer straight than the band's edge.
    const reaches = (
      t: number,
      side: "left" | "right",
      ankle: IAutoMovieVector3,
    ): boolean => {
      const d: number = stretch(t, side, ankle);
      return (
        d >= span[0] &&
        d <= Math.max(span[1], stretch(duration, side, landing[side])) + 1e-6
      );
    };
    const first = (
      after: number,
      before: number,
      found: (t: number) => boolean,
    ): number => {
      for (let t: number = after; t < before; t += 1 / 60)
        if (found(t)) return t;
      return before;
    };

    // Where each foot is held until it leaves: its rest, or where it hangs.
    const holds: Record<"left" | "right", HumanMount.IFoot> = {
      left: HumanMount.held(entry, "left"),
      right: HumanMount.held(entry, "right"),
    };

    // Both feet leave their rests while the seat still bears the body, the leader first: a leg cannot hold a fixed rest under a pelvis that travels. Each lands when its leg first reaches its floor place.
    const lands: number = first(
      0.3 * duration,
      duration,
      (t: number): boolean => reaches(t, leader, landing[leader]),
    );
    const leaves: number = (2 / 3) * seatOff;
    const flight: Record<"left" | "right", readonly [number, number]> = {
      left: [0, 0],
      right: [0, 0],
    };
    flight[leader] = [seatOff / 3, lands];
    flight[follower] = [
      leaves,
      Math.min(
        duration,
        Math.max(
          leaves + 0.2 * duration,
          first(leaves, duration, (t: number): boolean =>
            reaches(t, follower, landing[follower]),
          ),
        ),
      ),
    ];
    const over: IAutoMovieVector3 = HumanFrame.point(
      { origin: start, yaw },
      {
        x: 0,
        y: HumanMount.OVER.above * m.thigh,
        z: -HumanMount.OVER.behind * m.thigh,
      },
    );

    const contacts: IHumanContactWindow[] = [
      {
        part: "seat",
        kind: "seat",
        from: 0,
        to: seatOff / duration,
        support: { kind: "ground" },
      },
    ];
    for (const side of ["left", "right"] as const) {
      const part: "leftFoot" | "rightFoot" = `${side}Foot`;
      if (entry.feet[side].planted)
        contacts.push({
          part,
          kind: "plant",
          from: 0,
          to: flight[side][0] / duration,
          support: { kind: "ground" },
        });
      contacts.push({
        part,
        kind: "plant",
        from: flight[side][1] / duration,
        to: 1,
        support: { kind: "ground" },
      });
    }
    return {
      duration,
      events: [
        { name: "seatOff", share: seatOff / duration },
        { name: "standing", share: 0.9 },
      ],
      contacts,
      base: { kind: "standing" },
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const frame: Frame = frameAt(t);
        const standing: IHumanPosture["limbs"] = stand.legs(
          body,
          frame.root,
          yaw,
          landing,
        );
        const limbs: IHumanPosture["limbs"] = {};
        for (const side of ["left", "right"] as const) {
          const limb: "leftLeg" | "rightLeg" = `${side}Leg`;
          const down: IHumanPosture.IGoal = standing[limb]!;
          const [departs, arrives]: readonly [number, number] = flight[side];
          if (t >= arrives) limbs[limb] = down;
          else if (t <= departs)
            limbs[limb] = HumanMount.leg(
              body,
              side,
              holds[side],
              entry.feet[side].planted,
            );
          else
            limbs[limb] = HumanMount.leg(
              body,
              side,
              HumanMount.between(
                holds[side],
                {
                  ankle: landing[side],
                  bend: down.bend,
                  yaw: yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
                },
                minimumJerk((t - departs) / (arrives - departs)).s,
                0.1 * m.shank,
                sideways && side === leader ? over : undefined,
              ),
              false,
            );
        }
        return seated.arms(
          body,
          { ...frame, roll: 0, limbs },
          1 - minimumJerk(t / (0.3 * duration)).s,
        );
      },
    };
  }
}
