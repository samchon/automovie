import { Vector3, AutoMovieEngineMath, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanGaze } from "../../everyday/internal/HumanGaze";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { kissCanLower } from "./kissCanLower";
import { kissHandClearance } from "./kissHandClearance";
import { kissPose } from "./kissPose";

/**
 * Fit the lips to the staged back of a hand while the feet stay planted.
 *
 * @param body The kisser's measured actor.
 * @param entry The posture before the bow.
 * @param stance The two unchanged foot placements.
 * @param hip The planted hip pivot in world metres.
 * @param at The staged back-of-hand skin point.
 * @param lifted The current anatomical candidate whose pitch seeds the bow.
 * @param heldHand The presented skin normal, shared clock and held colliders.
 * @param postureAt The same head, pelvis and legs written by the law.
 * @param mouth Read the displayed mouth from a candidate posture.
 * @param resolution The current call's FK workspace.
 * @param NEAR The law's contact tolerance, metres.
 * @param RAISE The permitted heel rise, degrees.
 * @param ROLL The permitted coronal hip lean, degrees.
 * @returns A pose admitted on the original contact and skin limits, or
 *   undefined.
 */
export function kissPresentedHand(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  hip: IAutoMovieVector3,
  at: IAutoMovieVector3,
  lifted: IAutoMovieMotionHumanKiss.ISolved,
  heldHand: kissPresentedHand.IHand,
  postureAt: ReturnType<typeof kissPose>,
  mouth: ReturnType<typeof HumanTrunk.preparePoint>,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  NEAR: number,
  RAISE: number,
  ROLL: number,
): IAutoMovieMotionHumanKiss.ISolved | undefined {
  const clearance: ReturnType<typeof kissHandClearance> = heldHand.clearance();
  const yaw: number = (entry.yaw * Math.PI) / 180;
  const corners: IAutoMovieVector3[] = (["left", "right"] as const).flatMap(
    (side) =>
      (["heel", "toe"] as const).map((socket) => {
        const p: IAutoMovieVector3 = HumanFoot.point(
          body,
          side,
          socket,
          stance[side],
        );
        return {
          x: (p.x - hip.x) * Math.cos(yaw) - (p.z - hip.z) * Math.sin(yaw),
          y: 0,
          z: (p.x - hip.x) * Math.sin(yaw) + (p.z - hip.z) * Math.cos(yaw),
        };
      }),
  );
  const support: IAutoMovieVector3[] = AutoMovieEngineMath.convexHull2D(corners);
  const phases: Set<number> = new Set([1]);
  const clock: IAutoMovieMotionClock = heldHand.clock;
  // Include all contact-entry and release instants of the original film grid.
  for (
    let k: number = Math.ceil(heldHand.start * 24);
    k <= Math.floor((heldHand.start + clock.duration) * 24);
    ++k
  ) {
    const seconds: number = k / 24 - heldHand.start;
    const phase: number = clock.envelope(
      ["start", "ready"],
      ["relax", "end"],
      seconds,
    );
    if (phase > 0) phases.add(phase);
  }
  const hipTurns: number[] = (["leftUpperLeg", "rightUpperLeg"] as const).map(
    (bone) => {
      const rotation = AutoMovieEngineKinematics.getConstraint(
        bone,
        readHumanBone(body, bone)?.constraint ?? null,
      )?.twist;
      return Math.min(Math.abs(rotation?.min ?? 0), rotation?.max ?? 0);
    },
  );
  const hipLimit: number = Math.min(...hipTurns);
  const observe = (candidate: IAutoMovieMotionHumanKiss.ISolved): ISkin => {
    const posture: IAutoMovieMotionHumanPosture = postureAt(candidate);
    const depths: number[] = clearance(posture);
    for (const phase of phases) {
      if (phase === 1) continue;
      depths.push(
        ...clearance(
          postureAt({
            ...candidate,
            pitch: candidate.pitch * phase,
            roll: candidate.roll * phase,
            raise: candidate.raise * phase,
            flexion: candidate.flexion * phase,

            twist: (candidate.twist ?? 0) * phase,
            shift: (candidate.shift ?? 0) * phase,
            sink: (candidate.sink ?? 0) * phase,
            advance: (candidate.advance ?? 0) * phase,
            bearing: (candidate.bearing ?? 0) * phase,
          }),
        ),
      );
    }
    return { point: mouth(posture, resolution), depths };
  };
  const supported = (x: number, z: number): boolean =>
    AutoMovieEngineMath.pointInHull({ x, y: 0, z }, support);
  // Cervical and pelvic turns share the heading of the actual presented
  // surface. The lip offset determines the remaining translation over the feet.
  const desired: IAutoMovieVector3 = Vector3.scale(heldHand.normal, -1);
  const to: IAutoMovieVector3 = Vector3.subtract(at, hip);
  const localYaw = (v: IAutoMovieVector3): number =>
    (Math.atan2(
      Math.cos(yaw) * v.x - Math.sin(yaw) * v.z,
      Math.sin(yaw) * v.x + Math.cos(yaw) * v.z,
    ) *
      180) /
    Math.PI;
  const aim: number = localYaw(to);
  const face: number = localYaw(desired);
  const region: ReturnType<typeof HumanTrunk.prepareRegion> =
    HumanTrunk.prepareRegion(body, "mouth");
  let best: IAutoMovieMotionHumanKiss.ISolved = lifted;
  let worst: number =
    best.miss <= NEAR ? Math.max(...observe(best).depths) : Infinity;
  for (const heading of [aim, face]) {
    const bearing: number = Math.max(-hipLimit, Math.min(hipLimit, heading));
    const turned: IAutoMovieMotionHumanKiss.ISolved = {
      ...lifted,
      roll: 0,
      flexion: 0,
      raise: RAISE,
      bearing,
      twist: Math.max(
        -HumanGaze.HEAD.yaw,
        Math.min(HumanGaze.HEAD.yaw, face - bearing),
      ),
      sink: 0,
      shift: 0,
      advance: 0,
    };
    const orient = (
      pitch: number,
      roll: number,
    ): IAutoMovieMotionHumanKiss.ISolved => {
      const c: IAutoMovieMotionHumanKiss.ISolved = {
        ...turned,
        pitch,
        roll,
        flexion: 0,
      };
      const base: IAutoMovieVector3 = region(postureAt(c), resolution).normal;
      const delta: number = Math.cbrt(Number.EPSILON);
      const changed: IAutoMovieVector3 = region(
        postureAt({ ...c, flexion: delta }),
        resolution,
      ).normal;
      const tangent: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(changed, base),
        1 / delta,
      );
      const speed: number = Vector3.length(tangent);
      if (speed > 0)
        c.flexion = Math.max(
          -30,
          Math.min(
            45,
            Math.atan2(
              Vector3.dot(desired, tangent) / speed,
              Vector3.dot(desired, base),
            ) / speed,
          ),
        );
      return c;
    };
    const offset = (
      c: IAutoMovieMotionHumanKiss.ISolved,
    ): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = mouth(postureAt(c), resolution);
      const dx: number = at.x - p.x,
        dz: number = at.z - p.z;
      return {
        x: dx * Math.cos(yaw) - dz * Math.sin(yaw),
        y: at.y - p.y,
        z: dx * Math.sin(yaw) + dz * Math.cos(yaw),
      };
    };
    let c: IAutoMovieMotionHumanKiss.ISolved = orient(
      turned.pitch,
      turned.roll,
    );
    let d: IAutoMovieVector3 = offset(c);
    // Restore the lip height and keep the hip over the middle of the two
    // supports, leaving the fore-aft translation free along the stance.
    while (Math.hypot(d.x, d.y) > NEAR) {
      const delta: number =
        Math.cbrt(Number.EPSILON) *
        Math.max(1, Math.abs(c.pitch), Math.abs(c.roll));
      const dp: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(offset(orient(c.pitch + delta, c.roll)), d),
        1 / delta,
      );
      const dr: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(offset(orient(c.pitch, c.roll + delta)), d),
        1 / delta,
      );
      const det: number = dp.x * dr.y - dp.y * dr.x;
      if (Math.abs(det) <= Number.EPSILON) break;
      const next: IAutoMovieMotionHumanKiss.ISolved = orient(
        Math.max(-10, Math.min(45, c.pitch + (dr.x * d.y - dr.y * d.x) / det)),
        Math.max(
          -ROLL,
          Math.min(ROLL, c.roll + (dp.y * d.x - dp.x * d.y) / det),
        ),
      );
      const after: IAutoMovieVector3 = offset(next);
      if (Math.hypot(after.x, after.y) >= Math.hypot(d.x, d.y)) break;
      c = next;
      d = after;
    }
    if (!supported(d.x, d.z) || d.y > NEAR) continue;
    Object.assign(turned, c, { shift: d.x, advance: d.z });
    const sink: number = Math.max(0, -d.y);
    if (
      sink > 0 &&
      !kissCanLower(body, postureAt(turned), stance, sink, resolution)
    )
      continue;
    turned.sink = sink;
    const fit: ISkin = observe(turned);
    turned.miss = Vector3.distance(at, fit.point);
    const depth: number = Math.max(...fit.depths);
    if (turned.miss <= NEAR && depth < worst) {
      best = turned;
      worst = depth;
    }
  }
  return worst <= AutoMovieMotionHumanAuditSkin.BUILT ? best : undefined;
}

/** The already displayed hand and the real timing of the recipient's bow. */
export namespace kissPresentedHand {
  /** The target normal and held geometry for this plan only. */
  export interface IHand {
    clock: IAutoMovieMotionClock;
    start: number;
    normal: IAutoMovieVector3;
    clearance: () => ReturnType<typeof kissHandClearance>;
  }
}

/** A candidate's displayed contact point and the sampled shape overlaps, metres. */
interface ISkin {
  point: IAutoMovieVector3;
  depths: number[];
}
