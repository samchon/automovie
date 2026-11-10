import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { seated } from "./seated";

/**
 * Sitting down on a chair, bench or stool from standing in front of it:
 * the body's seat socket is lowered onto the seat while the trunk leans
 * forward and the feet stay where they stand.
 *
 * Stand-to-sit is the rise reversed under eccentric control (Kralj, Jaeger
 * and Munih 1990, J Biomech 23:1123): the hips travel back and down, the
 * trunk flexes forward to keep the weight over the feet until the seat takes
 * it, then the trunk settles into the seated posture. The goal is the seat
 * socket on its point on the seat ({@link seated}); the root follows from
 * that goal and the trunk's pitch, the planted legs and the hands are solved
 * by inverse kinematics. The socket moves back over the first 70 % of the
 * descent and down from 10 % to its end, so it reaches the seat from above;
 * the trunk pitches forward to its peak by 45 % of the descent and settles
 * after contact; the hands move from hanging to the thighs over the second
 * half.
 *
 * Peak trunk flexion `35 + 50 (1 - r)` degrees and descent time
 * `2 (1 + 0.6 (1 - r))` seconds for a seat at `r` of the popliteal height
 * (provisional coefficients; a lower seat needs more trunk flexion and more
 * time, Janssen, Bussmann and Stam 2002, and sit-to-stand takes about 1.5 to
 * 2.5 s in healthy adults). Contact comes at 75 % of the descent. The seated
 * back is `upright` (pitch 0), `lean` (12 degrees back onto a backrest, which
 * the seat must have) or `slump` (pelvis 10 degrees back, chest 12 and spine
 * 8 flexed), all provisional.
 *
 * The performer must stand facing within 20 degrees of the seat's heading
 * with feet the legs can reach from the seat; otherwise the sit is refused
 * with the range of foot distances that work. Events `seatContact` and
 * `seated`; the seat window starts at contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Effector goals (sockets, footprints, the gaze line) solved by the shared inverse kinematics, with balance and timing from the cited laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans once, then evaluates each posture in closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond a few forward-kinematics passes and limb fits.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance and every posture reads it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
 */
export namespace sit {
  /** The action's name. */
  export const name: HumanActionName = "sit";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: [0, "seatContact"], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    rise: [
      { window: ["seatContact", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    shift: [{ window: ["seated", 1], kind: "inertialize", entry: 0 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The seat. */
    seat: seated.ISeat;

    /** The seated back; `upright` when absent. */
    back?: "upright" | "lean" | "slump";

    /** Seconds to stay seated after `seated`; 1 when absent. */
    seconds?: number;
  }

  /** Seated pitch and trunk angles of each back, degrees. */
  export const BACKS: Readonly<
    Record<
      NonNullable<IParams["back"]>,
      {
        pitch: number;
        joints: Partial<
          Record<AutoMovieHumanoidBone, readonly [number, number, number]>
        >;
      }
    >
  > = {
    upright: { pitch: 0, joints: {} },
    lean: { pitch: -12, joints: {} },
    slump: { pitch: -10, joints: { chest: [12, 0, 0], spine: [8, 0, 0] } },
  };

  /**
   * Plan a sit.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the seat does not suit the body, the performer does not face away from it, the feet are out of reach, or `lean` has no backrest.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const seat: seated.ISeat = context.params.seat;
    seated.check(body, seat);
    const back = context.params.back ?? "upright";
    if (back === "lean" && seat.back === undefined)
      throw new Error(
        `${context.subject}: leaning back needs a seat with a backrest`,
      );
    const turn: number = angle(seat.yaw - context.entry.posture.yaw);
    if (Math.abs(turn) > 20)
      throw new Error(
        `${context.subject}: stands ${turn.toFixed(1)} degrees off the seat's heading; turn to within 20 degrees of facing away from the seat first`,
      );
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      context.entry.posture.yaw,
    );
    const goal: IAutoMovieVector3 = seated.point(body, seat);
    reach(body, seat, goal, feet, BACKS[back].pitch);

    const r: number = seated.ratio(body, seat);
    const descent: number = 2 * (1 + 0.6 * (1 - r));
    const peak: number = 35 + 50 * (1 - r);
    const contact: number = 0.75 * descent;
    const hold: number = context.params.seconds ?? 1;
    if (!(hold >= 0)) throw new Error("A sit's hold is not negative");
    const duration: number = descent + hold;
    const yaw0: number = context.entry.posture.yaw;
    const start: IAutoMovieVector3 = seated.socket(body, context.entry.posture);
    const final = BACKS[back];
    const upright = standUpright.of(body).joints;

    const contacts: IHumanContactWindow[] = [
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
      {
        part: "seat",
        kind: "seat",
        from: contact / duration,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    return {
      duration,
      events: [
        { name: "seatContact", share: contact / duration },
        { name: "seated", share: descent / duration },
      ],
      contacts,
      contact,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const across: number = minimumJerk(t / (0.7 * descent)).s;
        const down: number = minimumJerk(
          (t - 0.1 * descent) / (contact - 0.1 * descent),
        ).s;
        const socket: IAutoMovieVector3 = {
          x: start.x + (goal.x - start.x) * across,
          y: start.y + (goal.y - start.y) * down,
          z: start.z + (goal.z - start.z) * across,
        };
        const settle: number = minimumJerk(
          (t - 0.6 * descent) / (0.4 * descent),
        ).s;
        const pitch: number =
          t < 0.6 * descent
            ? peak * minimumJerk(t / (0.45 * descent)).s
            : peak + (final.pitch - peak) * settle;
        const yaw: number = yaw0 + turn * across;
        const joints: IHumanPosture["joints"] = {
          ...stand.RELAXED,
          ...upright,
        };
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
        const tilt = HumanTrunk.incline(
          joints,
          pitch,
          HumanTrunk.pelvisLimit(
            body,
            seated.root(body, socket, { yaw, pitch: 0, roll: 0 }),
            yaw,
            feet,
          ),
        );
        const root: IAutoMovieVector3 = seated.root(body, socket, {
          yaw,
          pitch: tilt.pitch,
          roll: 0,
        });
        const posture: IHumanPosture = resolveHumanPosture.lower(body, {
          root,
          yaw,
          pitch: tilt.pitch,
          roll: 0,
          joints: tilt.joints,
          limbs: stand.legs(body, root, yaw, feet),
        });
        return seated.arms(
          body,
          posture,
          minimumJerk((t - 0.5 * descent) / (0.5 * descent)).s,
        );
      },
    };
  }

  /**
   * Refuse feet the legs cannot reach from the seated hips: each ankle must
   * lie within 0.995 of the leg's length from its hip joint and beyond the
   * distance a knee flexed to its 150 degree limit leaves.
   *
   * @param body The body.
   * @param seat The seat.
   * @param goal The socket's point on the seat.
   * @param feet The planted ankles.
   * @param pitch The seated pitch, degrees.
   * @throws {Error} When a foot is out of reach, with the reachable distances ahead of the front edge.
   */
  export function reach(
    body: IHumanBody,
    seat: seated.ISeat,
    goal: IAutoMovieVector3,
    feet: Record<"left" | "right", IAutoMovieVector3>,
    pitch: number,
  ): void {
    const m = body.measure;
    const root: IAutoMovieVector3 = seated.root(body, goal, {
      yaw: seat.yaw,
      pitch,
      roll: 0,
    });
    const longest: number = 0.995 * (m.thigh + m.shank);
    const shortest: number = Math.sqrt(
      m.thigh * m.thigh +
        m.shank * m.shank -
        2 * m.thigh * m.shank * Math.cos((30 * Math.PI) / 180),
    );
    for (const side of ["left", "right"] as const) {
      const hipRest: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
      const hip: IAutoMovieVector3 = Vector3.add(
        root,
        Quaternion.rotateVector(
          resolveHumanPosture.heading({ yaw: seat.yaw, pitch, roll: 0 }),
          hipRest,
        ),
      );
      const d: number = Vector3.length(Vector3.subtract(feet[side], hip));
      if (d > longest || d < shortest) {
        const dy: number = hip.y - m.ankleHeight;
        const near: number = Math.sqrt(
          Math.max(0, shortest * shortest - dy * dy),
        );
        const far: number = Math.sqrt(Math.max(0, longest * longest - dy * dy));
        const edge: number = Math.hypot(hip.x - seat.at.x, hip.z - seat.at.z);
        throw new Error(
          `The ${side} ankle is ${d.toFixed(3)} m from its seated hip; stand with the ankles ${Math.max(0, near - edge).toFixed(3)} to ${(far - edge).toFixed(3)} m ahead of the seat's front edge`,
        );
      }
    }
  }
}

/** An angle wrapped into (-180, 180]. */
function angle(degrees: number): number {
  let a: number = degrees % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}
