import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";
import { seated } from "./seated";

/**
 * Standing up from a seat, in the four phases of sit-to-stand (Schenkman,
 * Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum,
 * where the trunk flexes forward while the seat still bears the weight;
 * momentum transfer at seat-off, where the hips leave the seat and the body
 * moves forward over the feet; extension of the hips and knees; and
 * stabilisation.
 *
 * The goal is the seat socket's path from where it rests to where it stands
 * over the planted feet; the root follows from it and the trunk's pitch, and
 * the legs are solved onto the unmoved feet. The trunk flexes on a
 * minimum-jerk profile over the first half of the rise to a peak of at least
 * `35 + 50 (1 - r)` degrees, so it is still flexing fast when the seat is
 * left (peak trunk flexion follows seat-off, Schenkman et al.). Seat-off
 * comes at the first frame, from 15 to 45 % of the rise, at which the
 * extrapolated centre of mass of the engine's whole-body model (Hof,
 * Gazendam and Sinke 2005) enters the feet's base of support: the forward
 * momentum of the flexing trunk then carries the body over the feet. When no
 * frame does, the peak is raised in 5 degree steps up to 70 degrees, then
 * the feet are drawn further back (below), and a rise whose feet stand too
 * far ahead even then is refused. From seat-off
 * the socket travels forward and up to standing at 85 %, the trunk returns
 * upright by the end, and the hands leave the thighs over the next 30 %. The
 * time is `2 (1 + 0.6 (1 - r))` seconds for a seat at `r` of the popliteal
 * height, the seat height being where the socket rests (provisional, as the
 * sit's).
 *
 * Before it, a body sitting deep edges forward on the seat until its hip
 * joints stand at most one thigh length behind the ankles, so the knees come
 * near over the feet, as people do before rising from a deep seat (a
 * provisional rule, kept 0.6 thigh lengths inside the front edge when the
 * entered sit names its seat); the edging takes `0.4 + 1.5 d` seconds for
 * `d` metres (provisional).
 *
 * Then each foot standing ahead of its knee is drawn back, one at a time
 * over `DRAW` seconds with a `LIFT` clearance, until the ankle stands behind
 * the knee with the shank 12 degrees forward of vertical, inside the 10 to
 * 15 degrees of a prepared sit-to-stand (moving the feet behind the knees
 * reduces the trunk lean the rise needs; Shepherd and Koh 1996, Scand J
 * Rehabil Med 28:79; values provisional). A body that cannot leave the seat
 * over feet drawn that far draws them further, 2 degrees of shank at a time,
 * up to the ankle's 20 degrees of dorsiflexion (the rig's range of motion).
 * A pelvis that stands more than 1 cm aside of the feet's middle, as after a
 * shift along the seat, has both feet set across by that distance in the
 * same draws, the foot on that side first: the body rises between its feet,
 * not over the edge of their base.
 *
 * The rise reads only the seated posture it is entered from, so it follows
 * a sit, a shift or any posture with the socket on a seat. Events `seatOff`
 * and `standing`; the seat window ends at seat-off.
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
export namespace rise {
  /** The action's name. */
  export const name: HumanActionName = "rise";

  /** Cancel table: a rise cut before seat-off returns to sitting; after standing it may become anything a stand can. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    sit: [
      { window: [0, "seatOff"], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    stand: [{ window: ["standing", 1], kind: "inertialize", entry: 0 }],
    walk: [
      { window: ["standing", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** Seconds a foot takes to be drawn back (provisional). */
  export const DRAW: number = 0.5;

  /** How high a drawn foot lifts, metres (provisional). */
  export const LIFT: number = 0.03;

  /** Shank angles forward of vertical the feet are drawn back to, tried in order, degrees (12 provisional, Shepherd and Koh 1996; 20 the ankle's dorsiflexion range). */
  export const SHANK: readonly number[] = [12, 14, 16, 18, 20];

  /** Parameters: none; the rise starts from the seated entry. */
  export type IParams = Record<string, never>;

  /**
   * Plan a rise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the feet stand too far ahead to rise over them.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const start: IAutoMovieVector3 = seated.socket(body, context.entry.posture);
    const r: number = start.y / seated.popliteal(body);
    const rising: number = 2 * (1 + 0.6 * (1 - r));
    const yaw: number = context.entry.posture.yaw;
    const pitch0: number = context.entry.posture.pitch;
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      yaw,
    );
    const upright = standUpright.of(body).joints;

    // Shallow sitting first: the pelvis edges forward on the seat until the
    // hip joints stand at most one thigh length behind the ankles, staying
    // 0.6 thigh lengths inside the front edge when the entered sit names its
    // seat.
    const forwardDir: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const along = (p: IAutoMovieVector3): number =>
      p.x * forwardDir.x + p.z * forwardDir.z;
    const hipJointAt = (socket: IAutoMovieVector3): number =>
      along(seated.root(body, socket, { yaw, pitch: pitch0, roll: 0 })) +
      body.rest.get("leftUpperLeg")!.z;
    const ankles: number = (along(feet.left) + along(feet.right)) / 2;
    let scoot: number = Math.max(
      0,
      ankles - hipJointAt(start) - body.measure.thigh,
    );
    const from = context.entry.from;
    const sat =
      from !== undefined && from.name === "sit"
        ? (from.params as { seat?: seated.ISeat }).seat
        : undefined;
    if (sat !== undefined)
      scoot = Math.min(
        scoot,
        Math.max(0, along(sat.at) - 0.6 * body.measure.thigh - along(start)),
      );
    const edging: number = scoot > 0.005 ? 0.4 + 1.5 * scoot : 0;
    const begin: IAutoMovieVector3 = Vector3.add(
      start,
      Vector3.scale(forwardDir, scoot),
    );

    // Then the feet are drawn back, one at a time, until each ankle stands
    // behind its knee with the shank at an angle forward of vertical, and
    // across, until their middle stands under the pelvis again.
    const leftDir: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 1, y: 0, z: 0 },
    );
    const across = (p: IAutoMovieVector3): number =>
      p.x * leftDir.x + p.z * leftDir.z;
    const aside: number =
      across(begin) - (across(feet.left) + across(feet.right)) / 2;
    const drawAt = (
      angle: number,
    ): Record<"left" | "right", IAutoMovieVector3> => {
      const behind: number =
        hipJointAt(begin) +
        body.measure.thigh -
        body.measure.shank * Math.sin((angle * Math.PI) / 180);
      const out: Record<"left" | "right", IAutoMovieVector3> = {
        left: feet.left,
        right: feet.right,
      };
      for (const side of ["left", "right"] as const) {
        const back: number = along(feet[side]) - behind;
        if (back > 0.01)
          out[side] = Vector3.subtract(
            out[side],
            Vector3.scale(forwardDir, back),
          );
        if (Math.abs(aside) > 0.01)
          out[side] = Vector3.add(out[side], Vector3.scale(leftDir, aside));
      }
      return out;
    };

    // Seat-off at the first frame whose extrapolated centre of mass is over
    // the feet, raising the peak flexion until one is, then drawing the feet
    // further back.
    const flex: number = 0.5 * rising;
    const pitchAt = (t: number, peak: number): number =>
      pitch0 + (peak - pitch0) * minimumJerk(t / flex).s;
    const seatedAt =
      (peak: number, feetAt: Record<"left" | "right", IAutoMovieVector3>) =>
      (t: number): IHumanPosture => {
        const tilt = HumanTrunk.incline(
          { ...stand.RELAXED, ...upright },
          pitchAt(t, peak),
          HumanTrunk.pelvisLimit(
            body,
            seated.root(body, begin, { yaw, pitch: 0, roll: 0 }),
            yaw,
            feetAt,
          ),
        );
        const root: IAutoMovieVector3 = seated.root(body, begin, {
          yaw,
          pitch: tilt.pitch,
          roll: 0,
        });
        return resolveHumanPosture.lower(body, {
          root,
          yaw,
          pitch: tilt.pitch,
          roll: 0,
          joints: tilt.joints,
          limbs: stand.legs(body, root, yaw, feetAt),
        });
      };
    let drawn: Record<"left" | "right", IAutoMovieVector3> = drawAt(SHANK[0]!);
    let peak: number = 0;
    let off: number | undefined;
    for (const angle of SHANK) {
      drawn = drawAt(angle);
      for (
        peak = 35 + 50 * (1 - r);
        peak <= 70 + 1e-9 && off === undefined;
        peak += 5
      )
        for (
          let t: number = 0.15 * rising;
          t <= 0.45 * rising + 1e-9;
          t += 1 / 24
        )
          if (HumanBalance.extrapolated(body, seatedAt(peak, drawn), t) >= 0) {
            off = t;
            break;
          }
      if (off !== undefined) break;
    }
    if (off === undefined)
      throw new Error(
        `${context.subject}: the feet stand too far ahead to rise over them; place the ankles nearer the seat`,
      );
    peak -= 5;

    const swings: Partial<Record<"left" | "right", [number, number]>> = {};
    let clock: number = edging;
    // The foot on the side the feet move to leads, so they never cross.
    for (const side of aside < 0
      ? (["right", "left"] as const)
      : (["left", "right"] as const)) {
      if (drawn[side] === feet[side]) continue;
      swings[side] = [clock, clock + DRAW];
      clock += DRAW;
    }
    const prepared: number = clock;
    const footAt = (
      side: "left" | "right",
      t: number,
    ): { ankle: IAutoMovieVector3; planted: boolean } => {
      const swing: [number, number] | undefined = swings[side];
      if (swing === undefined || t <= swing[0])
        return { ankle: feet[side], planted: true };
      if (t >= swing[1]) return { ankle: drawn[side], planted: true };
      const u: number = (t - swing[0]) / DRAW;
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        feet[side],
        drawn[side],
        minimumJerk(u).s,
      );
      return {
        ankle: { ...ankle, y: ankle.y + LIFT * Math.sin(Math.PI * u) },
        planted: false,
      };
    };
    const legsAt = (
      root: IAutoMovieVector3,
      t: number,
    ): IHumanPosture["limbs"] => {
      const legs: IHumanPosture["limbs"] = stand.legs(body, root, yaw, {
        left: footAt("left", t).ankle,
        right: footAt("right", t).ankle,
      });
      for (const side of ["left", "right"] as const) {
        const limb: "leftLeg" | "rightLeg" =
          side === "left" ? "leftLeg" : "rightLeg";
        if (!footAt(side, t).planted)
          legs[limb] = { ...legs[limb]!, planted: false };
      }
      return legs;
    };

    // The standing posture the rise ends in: the stand law's pelvis over the drawn feet.
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      {
        x: (body.rest.get("leftFoot")!.x + body.rest.get("rightFoot")!.x) / 2,
        y: 0,
        z: (body.rest.get("leftFoot")!.z + body.rest.get("rightFoot")!.z) / 2,
      },
    );
    const lean: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: standUpright.of(body).lean },
    );
    const standRoot: IAutoMovieVector3 = {
      x: (drawn.left.x + drawn.right.x) / 2 - centre.x + lean.x,
      y: -0.005,
      z: (drawn.left.z + drawn.right.z) / 2 - centre.z + lean.z,
    };
    const goal: IAutoMovieVector3 = seated.socket(body, {
      root: standRoot,
      yaw,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });
    const away: number = off;
    const seatOff: number = prepared + away;
    const duration: number = prepared + rising;
    const share = (t: number): number => t / duration;
    const contacts: IHumanContactWindow[] = [
      {
        part: "seat",
        kind: "seat",
        from: 0,
        to: share(seatOff),
        support: { kind: "ground" },
      },
    ];
    for (const side of ["left", "right"] as const) {
      const part: "leftFoot" | "rightFoot" =
        side === "left" ? "leftFoot" : "rightFoot";
      const swing: [number, number] | undefined = swings[side];
      if (swing === undefined)
        contacts.push({
          part,
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        });
      else
        contacts.push(
          {
            part,
            kind: "plant",
            from: 0,
            to: share(swing[0]),
            support: { kind: "ground" },
          },
          {
            part,
            kind: "plant",
            from: share(swing[1]),
            to: 1,
            support: { kind: "ground" },
          },
        );
    }

    return {
      duration,
      events: [
        { name: "seatOff", share: share(seatOff) },
        { name: "standing", share: share(prepared + 0.85 * rising) },
      ],
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const joints: IHumanPosture["joints"] = {
          ...stand.RELAXED,
          ...upright,
        };
        if (t < prepared) {
          const socket: IAutoMovieVector3 =
            edging > 0
              ? Vector3.lerp(start, begin, minimumJerk(t / edging).s)
              : begin;
          const root: IAutoMovieVector3 = seated.root(body, socket, {
            yaw,
            pitch: pitch0,
            roll: 0,
          });
          return seated.arms(
            body,
            resolveHumanPosture.lower(body, {
              root,
              yaw,
              pitch: pitch0,
              roll: 0,
              joints,
              limbs: legsAt(root, t),
            }),
            1,
          );
        }
        const u: number = t - prepared;
        const forward: number = minimumJerk(
          (u - away) / (0.85 * rising - away),
        ).s;
        const up: number = minimumJerk(
          (u - away - 0.03 * rising) / (0.82 * rising - away),
        ).s;
        const socket: IAutoMovieVector3 = {
          x: begin.x + (goal.x - begin.x) * forward,
          y: begin.y + (goal.y - begin.y) * up,
          z: begin.z + (goal.z - begin.z) * forward,
        };
        const pitch: number =
          u < flex
            ? pitchAt(u, peak)
            : peak * (1 - minimumJerk((u - flex) / (rising - flex)).s);
        const tilt = HumanTrunk.incline(
          joints,
          pitch,
          HumanTrunk.pelvisLimit(
            body,
            seated.root(body, socket, { yaw, pitch: 0, roll: 0 }),
            yaw,
            drawn,
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
          limbs: stand.legs(body, root, yaw, drawn),
        });
        return seated.arms(
          body,
          posture,
          1 - minimumJerk((u - away) / (0.3 * rising)).s,
        );
      },
    };
  }
}
