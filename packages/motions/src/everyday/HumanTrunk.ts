import {
  DEFAULT_HUMANOID_ROM,
  Transform,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTrunk,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { turnHumanPosture } from "../posture/turnHumanPosture";
import { authoredHumanTrunkPose } from "./authoredHumanTrunkPose";

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
 * the limb fits. Other limb frames stand at authored or clinical-zero angles,
 * rather than fitted goals. A limb root's position (a shoulder joint) is valid
 * when every ancestor is goal-independent; its own articulation remains raw.
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(
      body,
      authoredHumanTrunkPose(body, posture, joints),
      typeof resolution === "function" ? resolution() : resolution,
      requested,
    );
  }

  /**
   * Prepare fixed raw trunk-bone demand for changing authored postures.
   *
   * @param body The unchanged canonical body.
   * @param requested Actual names to snapshot; inspect goal-independent frames or origins such as shoulder joint positions, rather than fitted limb articulation.
   * @returns Fresh demanded frames per actual posture, optionally borrowing that synchronous query's exact FK workspace and admitting an explicit current joint override as resolve does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/name demand, changing raw authored posture, valid-frame boundary, ignored limb goals and fresh map/frame ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Each query snapshots Object.entries and every tuple F/A/T scalar before the unchanged whole-body root turn, skeleton/root carrier and optional workspace supplier. Genuine poseBones.prepareTuples admits the same values through the private FK owner; no limb goal or ROM clamp is introduced.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed-name tuple producer separates complete current scalar staging from the original root-carrier construction; region, point and gaze preparations share this raw-bone reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current authored joint receives original ordered admission, including unrequested/stray records. No canonical-name guess, external indices, resolved flag, pose answer or changed raw policy bypasses FK.
   * @evidence contracts/development/implementation.md#efficient-algorithms Name lookup/sorting prepares once across Q probes; every probe retains O(J) tuple staging/admission, demanded ancestor FK and fresh returned records while one packed scalar array replaces J temporary joint records. Unrequested transforms remain omitted and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body and captured actual name membership establish fixed demand; each current posture/root/joint value is assembled and resolved normally. An optional synchronous workspace shares only exact checked dynamic dependencies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning operation/plan retains body and bounded name metadata until release. No posture, world frame, query result, borrowed dynamic workspace or time history enters the closure; every map/frame is caller-owned.
   */
  export function prepareResolve(body: IAutoMovieMotionHumanBody, requested: ReadonlySet<AutoMovieHumanoidBone>):
    (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], joints?: IAutoMovieMotionHumanPosture["joints"]) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const read: ReturnType<typeof poseBones.prepareTuples> = poseBones.prepareTuples(body, requested);
    return (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const staged: ReturnType<typeof read> = read(joints);
      const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture({ ...posture, limbs: {} });
      return staged({ skeleton: body.skeleton.id, root: Transform.of(turned.position, turned.rotation) },
        typeof resolution === "function" ? resolution() : resolution);
    };
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pelvis cap followed by one shallow joint copy and two ordered scalar writes exposes where the requested angle is distributed, without an intermediate pair table.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds flexion to the authored starting angles without replacing abduction or twist; the study-based shares and optional pelvis cap do not establish final joint-ROM admission, which the posture resolver owns.
   * @evidence contracts/development/implementation.md#efficient-algorithms Nonpositive inclination costs constant work; positive inclination copies J supplied joint entries and changes two triples, requiring O(J) time and output space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the published RHYTHM shares and borrows untouched joint triples; each different inclination, cap or starting pose is calculated afresh without a result cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state; the caller owns the returned wrapper and positive-inclination joint copy, while nonpositive inclination borrows the original joint map and untouched triples stay borrowed.
   */
  export function incline(
    joints: IAutoMovieMotionHumanPosture["joints"],
    inclination: number,
    pelvisLimit: number = Infinity,
  ): IAutoMovieMotionHumanTrunk.IInclineResult {
    if (inclination <= 0) return { pitch: inclination, joints };
    const pelvis: number = Math.max(
      0,
      Math.min(RHYTHM.pelvis * inclination, pelvisLimit),
    );
    const spine: number = inclination - pelvis;
    const out: IAutoMovieMotionHumanPosture["joints"] = { ...joints };
    const share: number = RHYTHM.lumbar / (RHYTHM.lumbar + RHYTHM.thorax);
    addInclination(out, "spine", share, spine);
    addInclination(out, "chest", 1 - share, spine);
    return { pitch: pelvis, joints: out };
  }

  /** How far short of the hip's flexion range a tilted pelvis stops, degrees (provisional: a margin off the joint's end stop, read from no measured source). */
  export const HIP_MARGIN: number = 10;

  /** The hip flexion a forward-tilted pelvis leaves room for, degrees: `HIP_MARGIN` short of the hip's flexion range in `DEFAULT_HUMANOID_ROM`. */
  export const HIP_FLEXION: number =
    DEFAULT_HUMANOID_ROM.leftUpperLeg!.flexion!.max - HIP_MARGIN;

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
   * @evidence contracts/development/implementation.md#efficient-algorithms Two rest-map lookups and fixed scalar arithmetic cost constant time and space, without FK or a limb search; heading and each hip feed the original distance/angle expressions directly without three discarded vector records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the body's prepared measures and rest joints, while each requested root, heading and ankle arrangement is evaluated afresh.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state and returns one scalar; temporary world hip and heading scalars die with the call.
   */
  export function pelvisLimit(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    ankles: Record<"left" | "right", IAutoMovieVector3>,
  ): number {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const turn: number = (yaw * Math.PI) / 180;
    const forwardX: number = Math.sin(turn);
    const forwardZ: number = Math.cos(turn);
    let thighs: number = 0;
    for (const side of ["left", "right"] as const) {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
      const hipX: number = root.x + rest.x * forwardZ + rest.z * forwardX;
      const hipY: number = root.y + rest.y;
      const hipZ: number = root.z - rest.x * forwardX + rest.z * forwardZ;
      const ankle: IAutoMovieVector3 = ankles[side];
      const d: number = Math.min(
        m.thigh + m.shank,
        Math.hypot(ankle.x - hipX, ankle.y - hipY, ankle.z - hipZ),
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
        (ankle.x - hipX) * forwardX + (ankle.z - hipZ) * forwardZ;
      const toward: number = Math.atan2(along, hipY - ankle.y);
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    region: AutoMovieHumanoidRegion,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanTrunk.IRegionResult {
    const frame: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[region];
    return surfaceOf(
      frame,
      resolve(body, posture, undefined, resolution, new Set([frame.bone])).get(frame.bone)!,
    );
  }

  /**
   * Prepare one fixed anatomical region for changing authored postures.
   *
   * @param body The unchanged body owning the region and canonical rig.
   * @param region The fixed trunk/head/hip region; limb goals remain ignored.
   * @returns Its actual world point and normal reader, optionally borrowing the current operation's exact FK workspace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/region, changing raw authored posture, ignored limbs, world-metre point/unit normal and optional current-operation workspace.
   * @evidence contracts/development/implementation.md#principled-implementation The same authored-pose conversion, canonical FK admission and engine region placement as region run for every actual posture, while poseBones.prepare binds the actual region bone once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One immutable region lookup and bound bone reader precede the returned posture-to-surface function; authored owns the pose conversion shared with resolve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current authored joint still reaches ordered engine admission; the raw trunk policy, root turn, actual region frame and numerical placement remain, with no limb fit, target proxy, pose sample or contact verdict reuse.
   * @evidence contracts/development/implementation.md#efficient-algorithms Resolves and sorts the one region-bone demand once rather than constructing a Set and sorting names in every repeated probe. Each probe retains O(J) authored admission, current ancestor FK and fresh surface placement; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body fixes its actual region frame and rig demand. Every changed posture is converted and resolved afresh, and an optional borrowed workspace shares only exact unchanged dynamic dependencies within its current synchronous operation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller retains the unchanged body, region frame and bounded name reader until its plan/operation ends. No posture, output, time history or current operation workspace is stored across calls; outputs are fresh.
   */
  export function prepareRegion(
    body: IAutoMovieMotionHumanBody,
    region: AutoMovieHumanoidRegion,
  ): (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => HumanTrunk.ISurface {
    const frame: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[region];
    const read: ReturnType<typeof prepareResolve> = prepareResolve(body, new Set([frame.bone]));
    return (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): HumanTrunk.ISurface => {
      return surfaceOf(frame, read(posture, resolution).get(frame.bone)!);
    };
  }

  /**
   * Prepare one fixed region's world point for changing authored postures.
   *
   * @param body The unchanged body owning the actual region and canonical rig.
   * @param region The fixed trunk/head/hip region; limb goals remain ignored.
   * @returns A fresh world-metre point reader, optionally borrowing its current synchronous operation's exact FK workspace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/region, changing raw authored posture, ignored limb goals, fresh world-metre point and optional synchronous FK borrowing.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same actual region frame, raw authored pose and canonical demanded FK as prepareRegion, then the engine's point observation shared with full surface placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed frame and poseBones.prepare reader feed current authored admission and the engine's single local-to-world point owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current authored joint remains admitted in order; root turn, region bone/point and original arithmetic stay unchanged. No normal, target proxy, guessed head point, cached posture or acceptance value is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares actual bone-name indexing once, retains O(J) current joint admission and demanded ancestor FK, and omits unused normal/forward rotations plus the full surface wrapper on every point-only probe. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the unchanged body, region frame and actual bone demand are shared. Every current posture is assembled and resolved normally; optional borrowed FK rows reuse only exact checked dynamic dependencies within the current operation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns fixed frame/body/name metadata until plan/operation release; each current map/workspace ends with its synchronous query and only the fresh point escapes, without pose, target or time history.
   */
  export function preparePoint(
    body: IAutoMovieMotionHumanBody,
    region: AutoMovieHumanoidRegion,
  ): (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IAutoMovieVector3 {
    const frame: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[region];
    const read: ReturnType<typeof prepareResolve> = prepareResolve(body, new Set([frame.bone]));
    return (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieVector3 => {
      const bones: ReturnType<typeof read> = read(posture, resolution);
      return resolveAutoMovieHumanoidSurfaces.point(frame, bones.get(frame.bone)!);
    };
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    from: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): IAutoMovieMotionHumanTrunk.ISurfaceResult {
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
   * @param resolution Optional exact FK source borrowed only during the immediate constructor resolve; the returned reader never captures it.
   * @returns The resolved bones and region/ray readers borrowing them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States immutable operation scope, demanded-bone premise, ignored limbs and ownership of the returned readers.
   * @evidence contracts/development/implementation.md#principled-implementation Runs the canonical authored-joint FK once, then places each actual requested region and casts each actual ray against that same unchanged frame; ray queries retain the original midline collider subset and numerical policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolved map feeds existing region placement; only the first ray demands its midline subset and a bound collider reader, shared by the same cast adapter used by surface.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All authored joints still receive engine admission; no limb goal, region result, ray result, contact threshold or time sample is replaced or cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays one ordered joint admission and demanded FK; ray-free readers allocate no subset or collider preparation. Repeated rays pay one subset scan and one lazy collider placement/frame preparation while retaining every actual ray-distance and normal query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller establishes one unchanged body/posture/profile, so completed FK and collider frames are shared; each different region, ray, march point and normal probe is still evaluated by the original numerical owners without result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reading holds one FK map and, only after first ray demand, a subset plus one bound collider reader until synchronous return or throw. A separate reading factory captures no posture or optional FK loan. Population is bounded by that rig/profile; no global or sampled-frame history retains it.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IReading {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      resolve(body, posture, undefined, resolution, requested);
    return reading(body, bones);
  }

  /** Bind actual resolved frames in a scope that cannot retain the parent FK loan. */
  function reading(body: IAutoMovieMotionHumanBody, bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): IReading {
    let colliders: ReturnType<typeof HumanColliders.reading> | undefined;
    return {
      bones,
      region: (region: AutoMovieHumanoidRegion): HumanTrunk.ISurface => {
        const frame: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions[region];
        return surfaceOf(frame, bones.get(frame.bone)!);
      },
      surface: (from: IAutoMovieVector3, toward: IAutoMovieVector3): HumanTrunk.ISurface => {
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
    region(region: AutoMovieHumanoidRegion): HumanTrunk.ISurface;

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
    surface(from: IAutoMovieVector3, toward: IAutoMovieVector3): HumanTrunk.ISurface;
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
    body: IAutoMovieMotionHumanBody,
    colliders: ReturnType<typeof HumanColliders.reading>,
    from: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): HumanTrunk.ISurface {
    const hit: IAutoMovieMotionHumanColliders.IHit | undefined = colliders.cast(
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

/** The bones a trunk ray is tested against: the midline ones, none with a side. */
const MIDLINE: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
  "hips", "spine", "chest", "upperChest", "neck", "head", "jaw",
]);

/** A region's world point and unit normal, placed on its resolved bone by the engine's surface placement. */
function surfaceOf(
  frame: IAutoMovieHumanoidSurfaces.IFrame,
  bone: IAutoMovieResolvedBone,
): HumanTrunk.ISurface {
  const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
    resolveAutoMovieHumanoidSurfaces.place(frame, bone);
  return { point: placed.point, normal: placed.normal };
}

/** Add a share of the spine's flexion to one bone, keeping its other angles. */
function addInclination(joints: IAutoMovieMotionHumanPosture["joints"], bone: "spine" | "chest",
  part: number, spine: number): void {
  const was: readonly [number, number, number] = joints[bone] ?? ZERO;
  joints[bone] = [was[0] + part * spine, was[1], was[2]];
}

/** The angles of a bone the record holds none for. */
const ZERO: readonly [number, number, number] = [0, 0, 0];
