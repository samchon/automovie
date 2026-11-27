
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanAuditBalance } from "../../audit/internal/AutoMovieMotionHumanAuditBalance";
import { HumanFoot } from "../../posture/internal/HumanFoot";

/** The record of `IWorstOutsideWorst`'s site. */
type IWorstOutsideWorst = { value: number; at: number };

/** The record of `IWorstOutsideResult`'s site. */
type IWorstOutsideResult = { value: number; at: number };

/**
 * Measures of a held stance on displayed poses, shared by the step 4 capture
 * cases (stretching, dance, sport): how far the body's extrapolated centre of
 * mass stands outside one standing foot, a joint's clinical angle, and the
 * angle between two bones.
 */
export namespace StanceVerdicts {
  /**
   * How far the extrapolated centre of mass lies outside one standing foot's
   * bearing outline, metres: the margin of stability negated, negative inside.
   * The velocity is the central difference over the balance audit's step
   * (`AutoMovieMotionHumanAuditBalance.STEP`), clamped into the film.
   *
   * @param performance The performance.
   * @param subject The performer.
   * @param body Their body.
   * @param side The standing foot.
   * @param seconds Film seconds.
   * @returns Metres.
   */
  export function outside(
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    seconds: number,
  ): number {
    const centre: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 =>
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
        body.massModel,
        performance.bones(subject, t),
      );
    const before: number = Math.max(
      0,
      seconds - AutoMovieMotionHumanAuditBalance.STEP,
    );
    const after: number = Math.min(
      performance.duration,
      seconds + AutoMovieMotionHumanAuditBalance.STEP,
    );
    const a: IAutoMovieVector3 = centre(before);
    const b: IAutoMovieVector3 = centre(after);
    const span: number = after - before;
    const velocity: IAutoMovieVector3 =
      span > 0
        ? {
            x: (b.x - a.x) / span,
            y: (b.y - a.y) / span,
            z: (b.z - a.z) / span,
          }
        : { x: 0, y: 0, z: 0 };
    return -AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(
        centre(seconds),
        velocity,
        AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
      ),
      HumanFoot.base(body, performance.bones(subject, seconds), [side]),
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
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    from: number,
    to: number,
  ): IWorstOutsideResult {
    let worst: IWorstOutsideWorst = { value: -Infinity, at: from };
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
    performance: Pick<IAutoMovieMotionHumanPerformance, "pose">,
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
    performance: Pick<IAutoMovieMotionHumanPerformance, "bones">,
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
