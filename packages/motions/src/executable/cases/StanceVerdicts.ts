import {
  type IAutoMovieResolvedBone,
  closestPointsBetweenSegments,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFoot } from "../../posture/HumanFoot";

/**
 * Measures of a held stance on displayed poses, shared by the step 4
 * capture cases (stretching, dance, sport): how far the centre of mass
 * stands outside one standing foot, a joint's clinical angle, and the angle
 * between two bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each measure reads and on which poses.
 * @evidence contracts/development/implementation.md#principled-implementation The centre of mass is the engine's segment model on the displayed bones; the foot is its heel-to-toe line on the displayed sockets, widened by the foot's breadth.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three small measures.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No measure reads a law's goal or a collider's shape.
 * @evidence contracts/development/implementation.md#efficient-algorithms One centre-of-mass model per call.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per capture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace StanceVerdicts {
  /**
   * How far the centre of mass's floor point lies outside one foot, metres:
   * its distance to the foot's heel-to-toe line less half the foot's
   * breadth; negative inside.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @param body Their body.
   * @param side The standing foot.
   * @param seconds Film seconds.
   * @returns Metres.
   */
  export function outside(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
    side: "left" | "right",
    seconds: number,
  ): number {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones(subject, seconds);
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile),
      bones,
    );
    const sockets: HumanFoot.ISocket[] = HumanFoot.sockets(body, bones, side);
    const heel: IAutoMovieVector3 = { ...sockets[0]!.point, y: 0 };
    const toe: IAutoMovieVector3 = { ...sockets[2]!.point, y: 0 };
    const floor: IAutoMovieVector3 = { ...com, y: 0 };
    const near = closestPointsBetweenSegments(heel, toe, floor, floor);
    return (
      Math.hypot(near.pointA.x - floor.x, near.pointA.z - floor.z) -
      body.measure.footBreadth / 2
    );
  }

  /**
   * The worst of `outside` over a window on the 24 Hz grid.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @param body Their body.
   * @param side The standing foot.
   * @param from Film seconds.
   * @param to Film seconds.
   * @returns Metres and the second.
   */
  export function worstOutside(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
    side: "left" | "right",
    from: number,
    to: number,
  ): { value: number; at: number } {
    let worst: { value: number; at: number } = { value: -Infinity, at: from };
    for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
      const v: number = outside(performance, subject, body, side, t);
      if (v > worst.value) worst = { value: v, at: t };
    }
    return worst;
  }

  /**
   * A joint's displayed clinical angles, degrees.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @param bone The joint.
   * @param seconds Film seconds.
   * @returns Flexion, abduction and twist; zeros when the pose omits the joint.
   */
  export function joint(
    performance: HumanPerformance,
    subject: string,
    bone: AutoMovieHumanoidBone,
    seconds: number,
  ): [number, number, number] {
    for (const j of performance.pose(subject, seconds)
      .joints as IAutoMovieJointPose[])
      if (j.bone === bone)
        return [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
    return [0, 0, 0];
  }

  /**
   * The angle at a middle bone between the segments to its parent and child
   * joints, degrees: 180 for a straight limb.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @param a The proximal joint's bone.
   * @param b The middle joint's bone.
   * @param c The distal joint's bone.
   * @param seconds Film seconds.
   * @returns Degrees.
   */
  export function included(
    performance: HumanPerformance,
    subject: string,
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
    c: AutoMovieHumanoidBone,
    seconds: number,
  ): number {
    const bones = performance.bones(subject, seconds);
    const p: IAutoMovieVector3 = bones.get(a)!.worldPosition;
    const q: IAutoMovieVector3 = bones.get(b)!.worldPosition;
    const r: IAutoMovieVector3 = bones.get(c)!.worldPosition;
    const u = { x: p.x - q.x, y: p.y - q.y, z: p.z - q.z };
    const v = { x: r.x - q.x, y: r.y - q.y, z: r.z - q.z };
    const cos: number =
      (u.x * v.x + u.y * v.y + u.z * v.z) /
      (Math.hypot(u.x, u.y, u.z) * Math.hypot(v.x, v.y, v.z));
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  }
}
