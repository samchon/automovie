import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Transform,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { turnHumanPosture } from "../posture/turnHumanPosture";

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
 * @evidence contracts/development/common.md#meaningful-documentation States which bones and carried regions are valid, why limb goals are skipped, and each helper's world-metre or degree convention and caller premises.
 * @evidence contracts/development/design.md#principled-representation Groups canonical trunk FK, lumbopelvic inclination and trunk-surface readings over the existing body and posture types; points use world metres, angles use degrees and normals are unit directions. Positive limb lengths, valid trunk regions and nonzero ray directions remain caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five operations and two published inclination constants serve posture composition, bending, gaze and self-touch; engine FK and surface placement and HumanColliders own their underlying transforms and geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the shared body, posture, bone and region types without a second rig or surface representation; the region union also permits limb regions, so this namespace's documented trunk-only region restriction is not enforced by its parameter type.
 */
export namespace HumanTrunk {
  /**
   * World bones of a posture's trunk and head.
   *
   * @param body The body with topology indexed from its same, unchanged skeleton.
   * @param posture The posture; its limb goals are ignored.
   * @param joints Joints to use instead of the posture's; the posture's when absent.
   * @returns Resolved bones; the trunk, head, eyes and shoulder girdles are valid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States valid bones, ignored limb goals, the optional joint override and the body's unchanged-skeleton topology premise.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the posture's root through turnHumanPosture and resolves the directly set clinical angles with the canonical mappings and the body's parent-first topology; no limb goal is solved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint-list conversion, one root construction and one engine FK call whose fresh records are keyed by bone.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every supplied joint is read unchanged, the canonical axes and rest frames are preserved, and the returned limb bones remain outside this trunk-only reading's contract.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the supplied joints plus the rig's bones, with full FK for each call and no rebuild of the body's existing topology.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only the topology createHumanBody indexed from this same skeleton, which the caller keeps unchanged; each root and joint list is still resolved anew.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state; the body owns its existing topology and the caller owns the fresh map and resolved records.
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
          // A whole-body rotation turns the root as the resolver turns it
          // (`turnHumanPosture`); the limb goals are not read here.
          root: ((): IAutoMovieTransform => {
            const turned: turnHumanPosture.ITurned = turnHumanPosture({
              ...posture,
              limbs: {},
            });
            return Transform.of(turned.position, turned.rotation);
          })(),
          joints: list,
        },
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
        body.topology,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States forward/backward handling, degrees, the optional pelvis cap and the returned pitch and modified joint angles.
   * @evidence contracts/development/implementation.md#principled-implementation Positive inclination takes the capped RHYTHM pelvis share, then splits the remainder between spine and chest by the published lumbar/thorax ratio; nonpositive inclination stays in the pelvis. RHYTHM documents the lumbopelvic study behind these shares.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pelvis cap followed by one shallow joint copy and the two spinal additions exposes where the requested angle is distributed.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds flexion to the authored starting angles without replacing abduction or twist; the study-based shares and optional pelvis cap do not establish final joint-ROM admission, which the posture resolver owns.
   * @evidence contracts/development/implementation.md#efficient-algorithms Nonpositive inclination costs constant work; positive inclination copies J supplied joint entries and changes two triples, requiring O(J) time and output space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the published RHYTHM shares and borrows untouched joint triples; each different inclination, cap or starting pose is calculated afresh without a result cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state; the caller owns the returned wrapper and positive-inclination joint copy, while nonpositive inclination borrows the original joint map and untouched triples stay borrowed.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the level-pelvis origin, world ankle positions, heading and output degrees, with HIP_FLEXION documenting the provisional hip margin.
   * @evidence contracts/development/implementation.md#principled-implementation Yaw rotates each rest hip into the world; the law of cosines supplies thigh opening from positive thigh/shank lengths and a nonzero hip-to-ankle distance capped at full extension, and its forward direction supplies the thigh angle subtracted from HIP_FLEXION.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One two-leg loop retains the larger thigh flexion before one nonnegative pelvis-limit subtraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses this body's measured lengths and rest hips with the published provisional HIP_FLEXION margin; it is a planar knee-forward estimate, not a full ROM solve, and does not admit coincident hip/ankle or invalid body measurements.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two rest-map lookups and fixed scalar/vector arithmetic cost constant time and space, without FK or a limb search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the body's prepared measures and rest joints, while each requested root, heading and ankle arrangement is evaluated afresh.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state and returns one scalar; temporary world hip and heading vectors die with the call.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world point and unit normal and restricts the requested region to bones that trunk-only FK places correctly.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the posture's directly authored trunk, then the engine's surface placement rotates the prepared bone-local region point and unit normal by that bone's unit world rotation and translates the point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared region lookup, one shared trunk resolution and one engine placement keep surface-frame mathematics with its existing owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the body's actual prepared region frame instead of an anatomical point estimate; the requested frame must ride a resolved trunk/head/hip bone, and the broad region union does not enforce that caller premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+J) trunk FK for B bones and J set joints, followed by constant-time map lookup and frame placement; no limb fit or surface rebuild occurs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the body's prepared surfaces and unchanged-skeleton topology through resolve; world point and normal are recomputed for each posture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state; the temporary FK map is released after placement and the caller owns the returned point and normal.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the trunk-only collider subset, nonzero ray direction, world units, two-stature reach and miss failure.
   * @evidence contracts/development/implementation.md#principled-implementation Filters trunk FK to canonical bones without a left/right prefix, then delegates the first ray hit to HumanColliders.cast's signed-distance sphere tracing and central-difference normal with a reach of twice the body's stature.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One FK/filter/map step and one shared collider cast keep hierarchy placement and shape intersection with their existing owners; this adapter converts an absent hit into its caller-facing error.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tests the body's prepared collider geometry without fitting limbs or inventing a hit; cast retains its 1e-5 m surface tolerance, 1e-4 m normal probe and 64-step grazing limit, and a tested subset with no shape still throws through its distance owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+J) FK/filter work precedes at most 64 tracing and six normal-distance queries, each scanning the profile segments and tested shapes with the engine's existing per-shape distance cost; hull geometry uses its prepared face data.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the body's unchanged topology and HumanColliders' body/profile geometry preparation; each posed map and ray are evaluated anew because the hit depends on both.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources FK and filtered maps are local and released on return or throw; the caller owns returned vectors, while delegated weak geometry caches are bounded by the body's profile segments, shapes and hull records and released with those owners.
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
