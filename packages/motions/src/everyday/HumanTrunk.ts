import {
  type IAutoMovieResolvedBone,
  Transform,
  resolveAutoMovieHumanoidSurfaces,
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
import { poseBones } from "../posture/poseBones";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Authored FK, inclination/limit helpers and actual region/ray readers serve posture composition, bending, gaze and self-touch; explicit synchronous preparation shares only their fixed frame geometry. Engine FK, surface placement and HumanColliders keep the numerical owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the shared body, posture, bone and region types without a second rig or surface representation; the region union also permits limb regions, so this namespace's documented trunk-only region restriction is not enforced by its parameter type.
 */
export namespace HumanTrunk {
  /**
   * World bones of a posture's trunk and head.
   *
   * @param body The body with topology indexed from its same, unchanged skeleton.
   * @param posture The posture; its limb goals are ignored.
   * @param joints Joints to use instead of the posture's; the posture's when absent.
   * @param resolution Optional exact reader or lazy supplier borrowed only by this synchronous evaluation.
   * @param requested Bones whose transforms the caller reads; all bones when absent. Every authored joint is still admitted.
   * @returns Resolved bones, restricted to requested names when supplied; trunk/head/eye/girdle frames are valid and limb goals remain ignored.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States valid bones, ignored limb goals, optional joint override and demanded outputs, unchanged-skeleton premise and optional synchronous borrowed reader.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the posture's root through turnHumanPosture and resolves the directly set clinical angles with the canonical mappings and the body's parent-first topology; no limb goal is solved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint-list conversion and root construction feed the canonical poseBones adapter, whose engine owner inserts fresh FK records directly by bone.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every supplied joint is read unchanged, the canonical axes and rest frames are preserved, and the returned limb bones remain outside this trunk-only reading's contract.
   * @evidence contracts/development/implementation.md#efficient-algorithms Converts and admits all J authored joints, then the engine evaluates demanded bones and their ancestors, or the complete rig without a demand set. The body's immutable FK preparation removes repeated rig setup, an optional operation reader shares exactly unchanged transform math, and each returned record remains fresh; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the body's immutable rig preparation and optional parent-owned exact scalar reader; every root and authored joint list reaches the same ordered FK admission, including overrides and joints outside the demanded transforms.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores no reader or result. The caller owns fresh map/records, the body owns topology, and an optional borrowed reader/supplier belongs only to its parent's synchronous evaluation and is demanded at this actual FK call.
   */
  export function resolve(
    body: IHumanBody,
    posture: IHumanPosture,
    joints: IHumanPosture["joints"] = posture.joints,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const list: IAutoMovieJointPose[] = [];
    for (const bone of Object.keys(joints) as AutoMovieHumanoidBone[]) {
      const angles: readonly [number, number, number] = joints[bone]!;
      list.push({
        bone,
        flexion: angles[0],
        abduction: angles[1],
        twist: angles[2],
      });
    }

    // A whole-body turn changes the same root as full posture resolution;
    // no limb goal participates in this authored-trunk observation.
    const turned: turnHumanPosture.ITurned = turnHumanPosture({
      ...posture,
      limbs: {},
    });
    return poseBones(
      body,
      {
        skeleton: body.skeleton.id,

        root: Transform.of(turned.position, turned.rotation),
        joints: list,
      },
      typeof resolution === "function" ? resolution() : resolution,
      requested,
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
   * @param resolution Optional exact reader or supplier borrowed from this synchronous parent evaluation.
   * @returns The point (metres) and the unit normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world point/unit normal, the trunk-only region restriction and optional synchronous borrowed FK workspace.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the posture's directly authored trunk, then the engine's surface placement rotates the prepared bone-local region point and unit normal by that bone's unit world rotation and translates the point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared region lookup, one shared trunk resolution and one engine placement keep surface-frame mathematics with its existing owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the body's actual prepared region frame instead of an anatomical point estimate; the requested frame must ride a resolved trunk/head/hip bone, and the broad region union does not enforce that caller premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Admits the J authored joints and evaluates only this region bone's ancestor chain before constant-time frame placement; no unrelated limb transform, limb fit or surface rebuild is requested.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows prepared surfaces and unchanged-skeleton topology, forwarding only an explicit parent's exact FK workspace through resolve; every posture still recomputes the actual world point and normal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary FK map is released after placement and the caller owns point/normal; the optional reader/supplier remains parent-owned and never enters either returned vector or persistent state.
   */
  export function region(
    body: IHumanBody,
    posture: IHumanPosture,
    region: AutoMovieHumanoidRegion,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const frame: resolveAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[region];
    const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      resolve(body, posture, undefined, resolution, new Set([frame.bone])).get(frame.bone)!,
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
   * @evidence contracts/development/implementation.md#principled-implementation Demands the canonical bones without a left/right prefix, the same midline subset the original full-map filter selected, then delegates the first ray hit to HumanColliders.cast's signed-distance sphere tracing and central-difference normal within twice the body's stature.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One FK/filter/map step and one shared collider cast keep hierarchy placement and shape intersection with their existing owners; this adapter converts an absent hit into its caller-facing error.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tests the body's prepared collider geometry without fitting limbs or inventing a hit; cast retains its 1e-5 m surface tolerance, 1e-4 m normal probe and 64-step grazing limit, and a tested subset with no shape still throws through its distance owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms Ordered joint admission and demanded midline FK precede at most 64 tracing and six normal-distance queries, each scanning the profile segments and tested shapes with the engine's existing per-shape cost; unrelated limb transforms and the full-map filter allocation are avoided.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the body's unchanged topology and HumanColliders' body/profile geometry preparation; each posed map and ray are evaluated anew because the hit depends on both.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources FK and filtered maps are local and released on return or throw; the caller owns returned vectors, while delegated weak geometry caches are bounded by the body's profile segments, shapes and hull records and released with those owners.
   */
  export function surface(
    body: IHumanBody,
    posture: IHumanPosture,
    from: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const midline: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      resolve(body, posture, undefined, undefined, MIDLINE);
    return cast(body, HumanColliders.reading(body, midline), from, toward);
  }

  /**
   * Read several regions or ray hits against one unchanged authored trunk.
   * The reading belongs to one synchronous operation and must be released
   * before its posture, body, skeleton or profile changes.
   *
   * @param body The unchanged body.
   * @param posture The unchanged authored posture; limb goals remain ignored.
   * @param requested Bones used by the operation; all when absent. Include every region bone and, for rays, all midline collider bones the reading will use.
   * @returns The resolved bones and region/ray readers borrowing them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States immutable operation scope, demanded-bone premise, ignored limbs and ownership of the returned readers.
   * @evidence contracts/development/implementation.md#principled-implementation Runs the canonical authored-joint FK once, then places each actual requested region and casts each actual ray against that same unchanged frame; ray queries retain the original midline collider subset and numerical policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolved map feeds existing region placement; only the first ray demands its midline subset and a bound collider reader, shared by the same cast adapter used by surface.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All authored joints still receive engine admission; no limb goal, region result, ray result, contact threshold or time sample is replaced or cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays one ordered joint admission and demanded FK; ray-free readers allocate no subset or collider preparation. Repeated rays pay one subset scan and one lazy collider placement/frame preparation while retaining every actual ray-distance and normal query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller establishes one unchanged body/posture/profile, so completed FK and collider frames are shared; each different region, ray, march point and normal probe is still evaluated by the original numerical owners without result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reading holds one FK map and, only after first ray demand, a subset plus one bound collider reader until synchronous return or throw. Its population is bounded by that rig/profile; no global or sampled-frame history retains it.
   */
  export function prepare(
    body: IHumanBody,
    posture: IHumanPosture,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): IReading {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      resolve(body, posture, undefined, undefined, requested);
    let colliders: ReturnType<typeof HumanColliders.reading> | undefined;
    return {
      bones,
      region: (region: AutoMovieHumanoidRegion): ISurface => {
        const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions[region];
        const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
          resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!);
        return { point: placed.point, normal: placed.normal };
      },
      surface: (from: IAutoMovieVector3, toward: IAutoMovieVector3): ISurface => {
        if (colliders === undefined) {
          const midline: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
          for (const [bone, resolved] of bones)
            if (MIDLINE.has(bone)) midline.set(bone, resolved);
          colliders = HumanColliders.reading(body, midline);
        }
        return cast(body, colliders, from, toward);
      },
    };
  }

  /**
   * Operation-owned trunk frames for several region or ray queries.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents resolved frame ownership, region/ray units and the operation lifetime shared with prepare.
   * @evidence contracts/development/design.md#principled-representation Borrows the canonical resolved-bone map and exposes existing region/ray operations over it, without another skeleton or surface representation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Rest goals use bones for shoulder positions, region for anatomical points and surface for their height search; each member reads one prepared trunk.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores actual FK frames rather than guessed anatomical points; callers must retain the unchanged inputs only for their synchronous operation.
   */
  export interface IReading {
    /** Demanded bone frames, with limb goals ignored; caller must not mutate them. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * A demanded region's world-metre point and unit outward normal.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States actual region placement and world point/unit normal output on the prepared frame.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepare supplies the engine surface placement implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Declares one region query whose body is owned by prepare.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature cannot replace the requested anatomical region or its surface frame.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Prepare documents this actual query's fixed placement cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration coordinates no computation; prepare owns fixed FK sharing.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature retains no query or frame; prepare owns the reader lifetime.
     */
    region(region: AutoMovieHumanoidRegion): ISurface;

    /**
     * A world ray's hit on midline colliders, throwing when it misses within two statures.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines world ray inputs, midline subset, reach and inherited miss failure.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepare and its cast adapter supply the original ray policy.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Declares one ray query; the numerical loop lives in HumanColliders.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration cannot alter ray thresholds or invent a hit.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Prepare and HumanColliders.reading document ray and geometry costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature shares no ray result; prepare owns only immutable frame preparation.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature holds no collider or hit; prepare owns its synchronous readers.
     */
    surface(from: IAutoMovieVector3, toward: IAutoMovieVector3): ISurface;
  }

  /**
   * A point and normal on an actual trunk surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world-metre position and unit outward normal for both anatomical and ray-hit readings.
   * @evidence contracts/development/design.md#principled-representation Keeps the existing region/ray result's two interface vectors and coordinate convention.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared trunk's region and ray methods return only the point and normal their callers need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Adds no estimated frame, contact tolerance or precomputed query result.
   */
  export interface ISurface {
    /** Point on the surface, world metres. */
    point: IAutoMovieVector3;

    /** Unit outward normal in the world frame. */
    normal: IAutoMovieVector3;
  }

  /** Apply the existing ray policy to a fixed midline frame map. */
  function cast(
    body: IHumanBody,
    colliders: ReturnType<typeof HumanColliders.reading>,
    from: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): ISurface {
    const hit: HumanColliders.IHit | undefined = colliders.cast(
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

/** The existing trunk-ray subset: every canonical name without a side prefix. */
const MIDLINE: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
  "hips", "spine", "chest", "upperChest", "neck", "head", "jaw",
]);
