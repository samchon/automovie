import {
  AutoMovieStationHermite,
  type IAutoMovieResolvedBone,
  Quaternion,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";
import { standUpright } from "./standUpright";

/**
 * A jump to a floor point: a push-off from a planted foot, a ballistic flight
 * and a two-footed landing that absorbs and rises to standing.
 *
 * The push-off starts from the entry exactly, so a walk cut while a stance
 * foot is planted continues without a jump in position or velocity: the root
 * follows a quintic Hermite path from the entry root and velocity to the
 * take-off root and velocity over `PUSH` seconds. The take-off foot is the
 * planted one (the front one when both are, the rear being about to leave),
 * held on the floor while it comes down about its heel if it was still in its
 * heel rocker and then rises about the toes' joint from its entry pitch to
 * 40°, its toes extending, the stance rockers in order and the forefoot rocker of a
 * push-off; the other leg, the reaching leg, leaves the floor at the cut and
 * withdraws under the body, its
 * ankle drawn under the hip and raised to 0.3 hip heights, the free-leg tuck
 * of a one-foot take-off, its foot turning from its entry rotation. The arms
 * swing forward and up from their entry angles with the push (shoulder
 * flexion to 60°), the arm action that adds to take-off velocity
 * (Ashby and Heegaard 2002, "Role of arm motion in the standing long jump",
 * J. Biomech. 35).
 *
 * Flight is ballistic in the centre of mass, the one point gravity alone
 * moves while airborne: from the apex height `apex` above take-off (0.06 hip
 * heights plus a tenth of the jump's length when absent, provisional), the
 * vertical take-off speed is `sqrt(2 g apex)`, the flight time solves the
 * centre's landing height, and the horizontal speed covers its distance in
 * that time, the closed form of a drag-free projectile (`v = d / T - g T /
 * 2`, as the engine's ballistic solvers). At each airborne instant the root
 * is placed so the body's centre of mass, read by the engine's mass model
 * from the posture there, lies on that parabola, so moving the limbs in
 * flight shifts the trunk the way it would. The legs travel in the body's frame from their
 * take-off placements to their landing footprints, lifted at mid-flight.
 * Both feet land flat on footprints at the destination, at the body's rest
 * separation, turned out by the stance angle; the root lands 0.03 hip
 * heights low with the flight's velocity, absorbs to 0.12 hip heights low on
 * a quintic path that brings that velocity to rest over `ABSORB` seconds,
 * then rises to the upright stand ({@link standUpright}) over `RISE` seconds.
 * Planted legs are kept reachable by `resolveHumanPosture.lower`.
 */
export namespace jump {
  /** The action's name. */
  export const name: HumanActionName = "jump";

  /** Cancel table: once landed and settled, a jump gives way to standing or walking. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The floor point to land on, world metres. */
    to: IAutoMovieVector3;

    /** Apex height of the flight above take-off, metres; positive. */
    apex?: number;
  }

  /** Push-off duration, seconds (provisional; take-off contact of a one-foot jump from walking). */
  export const PUSH: number = 0.3;

  /** Landing absorption duration, seconds (provisional). */
  export const ABSORB: number = 0.3;

  /** Rise to standing after the absorption, seconds (provisional). */
  export const RISE: number = 0.45;

  /** Gravity, m/s². */
  const G: number = 9.81;

  /**
   * Plan a jump.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When no foot is planted to push off from, or the apex is not positive.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const l: number = m.hipHeight;
    const entry = context.entry;
    const root0: IAutoMovieVector3 = entry.posture.root;
    const v0: IAutoMovieVector3 = entry.velocity.linear;
    const to: IAutoMovieVector3 = {
      x: context.params.to.x,
      y: 0,
      z: context.params.to.z,
    };
    const heading: number = unwrap(
      (Math.atan2(to.x - root0.x, to.z - root0.z) * 180) / Math.PI,
      entry.posture.yaw,
    );
    const frame = (origin: IAutoMovieVector3): HumanFrame.IFrame => ({
      origin: { ...origin, y: 0 },
      yaw: heading,
    });
    const planted: ("left" | "right")[] = (["left", "right"] as const).filter(
      (s) => entry.feet[s].planted,
    );
    if (planted.length === 0)
      throw new Error(
        `${context.subject}: a jump takes off from a planted foot, and neither is planted`,
      );
    // In double support the front foot bears the body forward; the rear one is the reaching leg.
    const ahead = (s: "left" | "right"): number =>
      HumanFrame.local(frame(root0), entry.feet[s].ankle).z;
    const takeoff: "left" | "right" =
      planted.length === 1
        ? planted[0]!
        : ahead("left") >= ahead("right")
          ? "left"
          : "right";
    const reaching: "left" | "right" = takeoff === "left" ? "right" : "left";
    const support: HumanFoot.IPlacement = {
      ankle: entry.feet[takeoff].ankle,
      rotation: entry.feet[takeoff].rotation,
    };
    const supportHeading: number = HumanFrame.heading(support.rotation);
    const supportPitch: number =
      (Math.asin(
        Math.max(
          -1,
          Math.min(
            1,
            Quaternion.rotateVector(support.rotation, { x: 0, y: 0, z: 1 }).y,
          ),
        ),
      ) *
        180) /
      Math.PI;
    const arm = (side: "left" | "right"): number =>
      entry.posture.joints[`${side}UpperArm`]?.[0] ?? 0;
    // A foot still in its heel rocker comes down about its heel first; the
    // push then rises about the toes' joint of the flat foot.
    const heel: IAutoMovieVector3 = HumanFoot.point(
      body,
      takeoff,
      "heel",
      support,
    );
    const flat: HumanFoot.IPlacement =
      supportPitch > 0
        ? HumanFoot.pivot(body, takeoff, "heel", heel, supportHeading, 0)
        : support;
    const ball: IAutoMovieVector3 = HumanFoot.point(body, takeoff, "mtp", flat);
    const upright: standUpright.IAlignment = standUpright.of(body);
    const model = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const offset = (posture: IHumanPosture): IAutoMovieVector3 => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, posture));
      const c: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
        model,
        bones,
      );
      return {
        x: c.x - posture.root.x,
        y: c.y - posture.root.y,
        z: c.z - posture.root.z,
      };
    };

    // Take-off and touchdown roots.
    const rootT: IAutoMovieVector3 = HumanFrame.point(frame(ball), {
      x: 0,
      y: root0.y + 0.03 * l,
      z: 0.25 * l,
    });
    const footprint = (s: "left" | "right"): HumanFoot.IPlacement => ({
      ankle: HumanFrame.point(frame(to), {
        x: (s === "left" ? 1 : -1) * Math.abs(body.rest.get(`${s}Foot`)!.x),
        y: m.ankleHeight,
        z: 0,
      }),
      rotation: HumanFoot.rotation(
        heading + (s === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
        0,
      ),
    });
    const landing: Record<"left" | "right", HumanFoot.IPlacement> = {
      left: footprint("left"),
      right: footprint("right"),
    };
    const rootL: IAutoMovieVector3 = HumanFrame.point(frame(to), {
      x: 0,
      y: -0.005 - 0.03 * l,
      z: -0.1 * l,
    });
    const rootS: IAutoMovieVector3 = HumanFrame.point(frame(to), {
      x: 0,
      y: -0.005,
      z: upright.lean,
    });
    const rootA: IAutoMovieVector3 = HumanFrame.point(frame(to), {
      x: 0,
      y: -0.005 - 0.12 * l,
      z: 0.3 * upright.lean,
    });

    // Body-frame placements at take-off and touchdown, for the flight.
    const tuck: IAutoMovieVector3 = {
      x:
        (reaching === "left" ? 1 : -1) *
        Math.abs(body.rest.get(`${reaching}Foot`)!.x),
      y: 0.3 * l,
      z: 0.1 * l,
    };
    const pushed: HumanFoot.IPlacement = HumanFoot.pivot(
      body,
      takeoff,
      "mtp",
      ball,
      supportHeading,
      -40,
    );
    const local = (
      root: IAutoMovieVector3,
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 => HumanFrame.local({ origin: root, yaw: heading }, p);
    const startLocal: Record<"left" | "right", IAutoMovieVector3> = {
      left: takeoff === "left" ? local(rootT, pushed.ankle) : tuck,
      right: takeoff === "right" ? local(rootT, pushed.ankle) : tuck,
    };
    const endLocal: Record<"left" | "right", IAutoMovieVector3> = {
      left: local(rootL, landing.left.ankle),
      right: local(rootL, landing.right.ankle),
    };

    const knee = (
      root: IAutoMovieVector3,
      side: "left" | "right",
      yaw: number,
    ): IAutoMovieVector3 =>
      HumanFrame.point(
        {
          origin: HumanFrame.point(
            { origin: root, yaw: heading },
            body.rest.get(`${side}LowerLeg`)!,
          ),
          yaw,
        },
        { x: 0, y: 0, z: 1 },
      );

    // The ballistic flight of the centre of mass, from its take-off to its touchdown place.
    const flightPosture = (root: IAutoMovieVector3, u: number): IHumanPosture =>
      airborne(root, u);
    const offT: IAutoMovieVector3 = offset(flightPosture(rootT, 0));
    const offL: IAutoMovieVector3 = offset(flightPosture(rootL, 1));
    const comT: IAutoMovieVector3 = {
      x: rootT.x + offT.x,
      y: rootT.y + offT.y,
      z: rootT.z + offT.z,
    };
    const comL: IAutoMovieVector3 = {
      x: rootL.x + offL.x,
      y: rootL.y + offL.y,
      z: rootL.z + offL.z,
    };
    const length: number = Math.hypot(comL.x - comT.x, comL.z - comT.z);
    const apex: number = context.params.apex ?? 0.06 * l + 0.1 * length;
    if (!(apex > 0)) throw new Error(`jump.apex must be positive, got ${apex}`);
    const vy: number = Math.sqrt(2 * G * apex);
    const T: number =
      (vy + Math.sqrt(Math.max(0, vy * vy - 2 * G * (comL.y - comT.y)))) / G;
    const launch: IAutoMovieVector3 = {
      x: (comL.x - comT.x) / T,
      y: vy,
      z: (comL.z - comT.z) / T,
    };
    const land: IAutoMovieVector3 = { x: launch.x, y: vy - G * T, z: launch.z };

    const P: number = PUSH;
    const touchdown: number = P + T;
    const settled: number = touchdown + ABSORB;
    const duration: number = settled + RISE;
    const events: IAutoMovieMotionEvent[] = [
      { name: "takeoff", share: P / duration },
      { name: "apex", share: (P + vy / G) / duration },
      { name: "touchdown", share: touchdown / duration },
      { name: "settled", share: settled / duration },
    ];
    const contacts: IHumanContactWindow[] = [
      {
        part: `${takeoff}Foot`,
        kind: "plant",
        from: 0,
        to: P / duration,
        support: { kind: "ground" },
      },
      {
        part: "leftFoot",
        kind: "plant",
        from: touchdown / duration,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: "rightFoot",
        kind: "plant",
        from: touchdown / duration,
        to: 1,
        support: { kind: "ground" },
      },
    ];

    const rootAt = (t: number): IAutoMovieVector3 => {
      if (t <= P) return hermite(root0, v0, rootT, launch, P, t);
      if (t <= touchdown) {
        const u: number = t - P;
        const c: IAutoMovieVector3 = {
          x: comT.x + launch.x * u,
          y: comT.y + launch.y * u - 0.5 * G * u * u,
          z: comT.z + launch.z * u,
        };
        const o: IAutoMovieVector3 = offset(flightPosture(rootT, u / T));
        return { x: c.x - o.x, y: c.y - o.y, z: c.z - o.z };
      }
      if (t <= settled)
        return hermite(
          rootL,
          land,
          rootA,
          { x: 0, y: 0, z: 0 },
          ABSORB,
          t - touchdown,
        );
      return hermite(
        rootA,
        { x: 0, y: 0, z: 0 },
        rootS,
        { x: 0, y: 0, z: 0 },
        RISE,
        t - settled,
      );
    };

    /** The airborne posture at a root and a share of the flight. */
    function airborne(root: IAutoMovieVector3, u: number): IHumanPosture {
      const s: number = minimumJerk(u).s;
      const arms: number = 60 - 30 * s;
      const joints: Partial<
        Record<AutoMovieHumanoidBone, readonly [number, number, number]>
      > = {
        ...stand.RELAXED,
        ...upright.joints,
        leftUpperArm: [arms, 5, 0],
        rightUpperArm: [arms, 5, 0],
        leftLowerArm: [12 + arms / 3, 0, 0],
        rightLowerArm: [12 + arms / 3, 0, 0],
        [`${takeoff}Toes`]: [40 * (1 - s), 0, 0],
      };
      const limbs: IHumanPosture["limbs"] = {};
      for (const side of ["left", "right"] as const) {
        const p: IAutoMovieVector3 = lerp(startLocal[side], endLocal[side], s);
        const point: IAutoMovieVector3 = HumanFrame.point(
          { origin: root, yaw: heading },
          { ...p, y: p.y + 0.1 * l * Math.sin(Math.PI * u) },
        );
        const pitch: number = side === takeoff ? -40 * (1 - s) : 0;
        limbs[`${side}Leg`] = {
          point,
          rotation: HumanFoot.rotation(
            heading + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT) * s,
            pitch,
          ),
          bend: knee(root, side, heading),
        };
      }
      return { root, yaw: heading, pitch: 0, roll: 0, joints, limbs };
    }

    return {
      duration,
      events,
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const root: IAutoMovieVector3 = rootAt(t);
        const yaw: number =
          entry.posture.yaw +
          (heading - entry.posture.yaw) * minimumJerk(t / P).s;
        // Arms: forward and up with the push, held through flight, lowered as the landing absorbs.
        const raise = (side: "left" | "right"): number =>
          t <= P
            ? arm(side) + (60 - arm(side)) * minimumJerk(t / P).s
            : t <= touchdown
              ? 60 - 30 * minimumJerk((t - P) / T).s
              : 30 * (1 - minimumJerk((t - touchdown) / (ABSORB + RISE)).s);
        const arms: number = raise("left");
        const joints: Partial<
          Record<AutoMovieHumanoidBone, readonly [number, number, number]>
        > = {
          ...stand.RELAXED,
          ...upright.joints,
          leftUpperArm: [arms, 5, 0],
          rightUpperArm: [raise("right"), 5, 0],
          leftLowerArm: [12 + arms / 3, 0, 0],
          rightLowerArm: [12 + raise("right") / 3, 0, 0],
        };
        const limbs: IHumanPosture["limbs"] = {};
        if (t <= P) {
          // Push-off: the take-off foot rolls over its ball; the reaching leg withdraws under the body.
          // From the entry's own pitch, so a heel already rising keeps rising.
          const pitch: number =
            supportPitch +
            (Math.min(supportPitch, -40) - supportPitch) * minimumJerk(t / P).s;
          const foot: HumanFoot.IPlacement = HumanFoot.pivot(
            body,
            takeoff,
            pitch > 0 ? "heel" : "mtp",
            pitch > 0 ? heel : ball,
            supportHeading,
            pitch,
          );
          limbs[`${takeoff}Leg`] = {
            point: foot.ankle,
            rotation: foot.rotation,
            bend: knee(root, takeoff, supportHeading),
            planted: true,
            contact: HumanFoot.offset(body, takeoff, "mtp"),
          };
          joints[`${takeoff}Toes`] = [-pitch, 0, 0];
          // The reaching foot leaves at once, from rest on a minimum-jerk path.
          const s: number = minimumJerk(t / P).s;
          const from: IAutoMovieVector3 = entry.feet[reaching].ankle;
          const into: IAutoMovieVector3 = HumanFrame.point(
            { origin: root, yaw: heading },
            tuck,
          );
          limbs[`${reaching}Leg`] = {
            point: lerp(from, into, s),
            rotation: Quaternion.slerp(
              entry.feet[reaching].rotation,
              HumanFoot.rotation(heading, 0),
              s,
            ),
            bend: knee(root, reaching, heading),
          };
        } else if (t <= touchdown) {
          return airborne(root, (t - P) / T);
        } else {
          for (const side of ["left", "right"] as const)
            limbs[`${side}Leg`] = {
              point: landing[side].ankle,
              rotation: landing[side].rotation,
              bend: knee(
                root,
                side,
                HumanFrame.heading(landing[side].rotation),
              ),
              planted: true,
              contact: HumanFoot.offset(body, side, "mtp"),
            };
        }
        return resolveHumanPosture.lower(body, {
          root,
          yaw,
          pitch: 0,
          roll: 0,
          joints,
          limbs,
        });
      },
    };
  }

  /** The equivalent of a heading nearest another, so a turn takes the shorter way. */
  function unwrap(angle: number, near: number): number {
    return near + wrapDegrees(angle - near);
  }

  /** A quintic Hermite path from a point and velocity to a point and velocity over a duration, at rest acceleration at both ends. */
  function hermite(
    p0: IAutoMovieVector3,
    v0: IAutoMovieVector3,
    p1: IAutoMovieVector3,
    v1: IAutoMovieVector3,
    duration: number,
    t: number,
  ): IAutoMovieVector3 {
    // The engine's quintic Hermite rule over seconds: values and velocities at
    // both ends, zero acceleration at both (curvature [0, 0, 0]), so the root
    // leaves the entry and reaches take-off at rest acceleration.
    const u: number = Math.min(1, Math.max(0, t / duration));
    const rest: readonly number[] = [0, 0, 0];
    const [x, y, z] = AutoMovieStationHermite.combine(
      { value: [p0.x, p0.y, p0.z], slope: [v0.x, v0.y, v0.z], curvature: rest },
      { value: [p1.x, p1.y, p1.z], slope: [v1.x, v1.y, v1.z], curvature: rest },
      AutoMovieStationHermite.weights(u, duration, 0, true),
    );
    // combine maps the three-entry value array entry by entry, so all three exist.
    return { x: x!, y: y!, z: z! };
  }

  /** A straight interpolation. */
  function lerp(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 {
    return {
      x: a.x + (b.x - a.x) * s,
      y: a.y + (b.y - a.y) * s,
      z: a.z + (b.z - a.z) * s,
    };
  }
}
