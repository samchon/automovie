import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The trunk and head of a posture placed in the world without solving its
 * limbs: forward kinematics of the root and the directly set joints only.
 *
 * The pelvis, spine, chest, neck, head, eyes, shoulder girdles and the
 * regions they carry (the face, the chest, the back, the hips' pockets)
 * depend only on the root and the joints a posture sets, never on its limb
 * goals, because inverse kinematics moves the limbs alone. So a gaze, a
 * self-touch or a hand rest can read where the face or the hip is from the
 * posture directly, at the cost of one forward-kinematics pass and none of
 * the limb fits. Limb bones in the result stand at their set or clinical-zero
 * angles and must not be read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which bones are valid and why limbs are skipped.
 * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the canonical rig with the posture's root rotation, as `resolveHumanPosture` builds it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One resolvePose pass, linear in bones.
 */
export namespace HumanTrunk {
  /**
   * World bones of a posture's trunk and head.
   *
   * @param body The body.
   * @param posture The posture; its limb goals are ignored.
   * @param joints Joints to use instead of the posture's; the posture's when absent.
   * @returns Resolved bones; the trunk, head, eyes and shoulder girdles are valid.
   */
  export function resolve(
    body: IHumanBody,
    posture: IHumanPosture,
    joints: IHumanPosture["joints"] = posture.joints,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const list: IAutoMovieJointPose[] = (
      Object.entries(joints) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]
    ).map(
      ([bone, a]): IAutoMovieJointPose => ({
        bone,
        flexion: a[0],
        abduction: a[1],
        twist: a[2],
      }),
    );
    return new Map(
      resolvePose(
        {
          skeleton: body.skeleton.id,
          root: {
            translation: posture.root,
            rotation: resolveHumanPosture.heading(posture),
            scale: { x: 1, y: 1, z: 1 },
          },
          joints: list,
        },
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  }

  /**
   * Shares of a forward trunk inclination taken by the pelvis, the lumbar
   * spine and the thorax: at full forward bending about 40 degrees of lumbar
   * flexion against 70 of hip flexion (Esola et al. 1996, Spine 21:71), so
   * the pelvis takes 0.64 and the spine 0.36, split 0.28 lumbar and 0.08
   * thoracic.
   */
  export const RHYTHM: Readonly<{
    pelvis: number;
    lumbar: number;
    thorax: number;
  }> = { pelvis: 0.64, lumbar: 0.28, thorax: 0.08 };

  /**
   * A trunk inclined forward by an angle shared by the lumbopelvic rhythm:
   * the pelvis pitch it takes and the spine and chest flexion added to the
   * given joints. A backward inclination is the pelvis alone, since leaning
   * back is a pelvic tilt.
   *
   * @param joints The posture's joints.
   * @param inclination Forward inclination of the trunk, degrees.
   * @param pelvisLimit The most the pelvis may take, degrees (`pelvisLimit`); the spine takes the rest.
   * @returns The pelvis pitch, degrees, and the joints with the flexion added.
   */
  export function incline(
    joints: IHumanPosture["joints"],
    inclination: number,
    pelvisLimit: number = Infinity,
  ): { pitch: number; joints: IHumanPosture["joints"] } {
    if (inclination <= 0) return { pitch: inclination, joints };
    const pelvis: number = Math.max(
      0,
      Math.min(RHYTHM.pelvis * inclination, pelvisLimit),
    );
    const spine: number = inclination - pelvis;
    const out: IHumanPosture["joints"] = { ...joints };
    const share: number = RHYTHM.lumbar / (RHYTHM.lumbar + RHYTHM.thorax);
    for (const [bone, part] of [
      ["spine", share],
      ["chest", 1 - share],
    ] as const) {
      const was: readonly [number, number, number] = out[bone] ?? [0, 0, 0];
      out[bone] = [was[0] + part * spine, was[1], was[2]];
    }
    return { pitch: pelvis, joints: out };
  }

  /** The hip flexion a forward-tilted pelvis leaves room for, degrees: 10 short of the 120 degree range (provisional margin). */
  export const HIP_FLEXION: number = 110;

  /**
   * The most the pelvis may tilt forward before a planted leg's hip flexion
   * passes `HIP_FLEXION`: each thigh's angle from vertical, with the knee
   * bending forward, from the law of cosines on the hip-to-ankle distance,
   * subtracted from that limit. Squatting and sitting fold the thighs, so
   * the trunk's inclination then comes more from the spine than from the
   * pelvis, as it does when the hips are already flexed.
   *
   * @param body The body.
   * @param root The rig origin with the pelvis level, world metres.
   * @param yaw The heading, degrees.
   * @param ankles The planted ankles, world metres.
   * @returns Degrees, at least 0.
   */
  export function pelvisLimit(
    body: IHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    ankles: Record<"left" | "right", IAutoMovieVector3>,
  ): number {
    const m = body.measure;
    const turn: number = (yaw * Math.PI) / 180;
    const forward: IAutoMovieVector3 = {
      x: Math.sin(turn),
      y: 0,
      z: Math.cos(turn),
    };
    let thighs: number = 0;
    for (const side of ["left", "right"] as const) {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
      const hip: IAutoMovieVector3 = {
        x: root.x + rest.x * Math.cos(turn) + rest.z * Math.sin(turn),
        y: root.y + rest.y,
        z: root.z - rest.x * Math.sin(turn) + rest.z * Math.cos(turn),
      };
      const ankle: IAutoMovieVector3 = ankles[side];
      const d: number = Math.min(
        m.thigh + m.shank,
        Math.hypot(ankle.x - hip.x, ankle.y - hip.y, ankle.z - hip.z),
      );
      const opening: number = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (m.thigh * m.thigh + d * d - m.shank * m.shank) / (2 * m.thigh * d),
          ),
        ),
      );
      const along: number =
        (ankle.x - hip.x) * forward.x + (ankle.z - hip.z) * forward.z;
      const toward: number = Math.atan2(along, hip.y - ankle.y);
      thighs = Math.max(thighs, ((toward + opening) * 180) / Math.PI);
    }
    return Math.max(0, HIP_FLEXION - thighs);
  }

  /**
   * A trunk or head region's world point and outward normal on a posture.
   *
   * @param body The body.
   * @param posture The posture.
   * @param region A region riding the trunk, the head or the hips (not a limb below the hip or shoulder).
   * @returns The point (metres) and the unit normal.
   */
  export function region(
    body: IHumanBody,
    posture: IHumanPosture,
    region: AutoMovieHumanoidRegion,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const frame = body.surfaces.regions[region];
    const placed = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      resolve(body, posture).get(frame.bone)!,
    );
    return { point: placed.point, normal: placed.normal };
  }

  /**
   * Where a ray meets the trunk or the head of a posture: the point on their
   * colliders and the outward normal there (`HumanColliders.cast`). Only the
   * midline segments are tested (the pelvis, spine, chest, neck and head),
   * since the limbs are not placed here, so a hand already lying on the trunk
   * does not hide it. A hand rest takes a place between two named regions
   * from this, on the surface itself.
   *
   * @param body The body.
   * @param posture The posture; its limb goals are ignored.
   * @param from The ray's start, world metres, outside the trunk.
   * @param toward Where it runs; any non-zero vector.
   * @returns The point (metres) and the unit normal.
   * @throws {Error} When the ray misses the trunk within two statures.
   */
  export function surface(
    body: IHumanBody,
    posture: IHumanPosture,
    from: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const midline: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      [...resolve(body, posture)].filter(
        ([bone]): boolean => !/^(left|right)/.test(bone),
      ),
    );
    const hit: HumanColliders.IHit | undefined = HumanColliders.cast(
      body,
      midline,
      from,
      toward,
      2 * body.measure.stature,
    );
    if (hit === undefined)
      throw new Error(
        `No trunk surface lies along the ray from (${from.x.toFixed(3)}, ${from.y.toFixed(3)}, ${from.z.toFixed(3)}) m`,
      );
    return { point: hit.point, normal: hit.normal };
  }
}
