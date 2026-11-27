import {
  DEFAULT_HUMANOID_ROM,
  Transform,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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
import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { turnHumanPosture } from "../posture/internal/turnHumanPosture";
import { addHumanTrunkInclination } from "./internal/addHumanTrunkInclination";
import { authoredHumanTrunkPose } from "./internal/authoredHumanTrunkPose";

/** The record of `IRHYTHMItem`'s site. */
type IRHYTHMItem = {
  pelvis: number;
  lumbar: number;
  thorax: number;
};

/**
 * The trunk and head of a posture placed in the world without solving its
 * limbs: forward kinematics of the root and the directly set joints only.
 *
 * The pelvis, spine, chest, neck, head, eyes, shoulder girdles and the regions
 * they carry (the face, the chest, the back, the hips' pockets) depend only on
 * the root and the joints a posture sets, never on its limb goals, because
 * inverse kinematics moves the limbs alone. So a gaze, a self-touch or a hand
 * rest can read where the face or the hip is from the posture directly, at the
 * cost of one forward-kinematics pass and none of the limb fits. Other limb
 * frames stand at authored or clinical-zero angles, rather than fitted goals. A
 * limb root's position (a shoulder joint) is valid when every ancestor is
 * goal-independent; its own articulation remains raw.
 */
export namespace HumanTrunk {
  /**
   * World bones of a posture's trunk and head.
   *
   * @param body The body with topology indexed from its same, unchanged
   *   skeleton.
   * @param posture The posture; its limb goals are ignored.
   * @param joints Joints to use instead of the posture's; the posture's when
   *   absent.
   * @param resolution Optional exact reader or lazy supplier borrowed only by
   *   this synchronous evaluation.
   * @param requested Bones whose transforms the caller reads; all bones when
   *   absent. Every authored joint is still admitted.
   * @returns Resolved bones, restricted to requested names when supplied;
   *   trunk/head/eye/girdle frames are valid and limb goals remain ignored.
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
      prepareHumanPoseResolution.read(resolution),
      requested,
    );
  }

  /**
   * Prepare fixed raw trunk-bone demand for changing authored postures.
   *
   * @param body The unchanged canonical body.
   * @param requested Actual names to snapshot; inspect goal-independent frames
   *   or origins such as shoulder joint positions, rather than fitted limb
   *   articulation.
   * @returns Fresh demanded frames per actual posture, optionally borrowing
   *   that synchronous query's exact FK workspace and admitting an explicit
   *   current joint override as resolve does.
   */
  export function prepareResolve(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    joints?: IAutoMovieMotionHumanPosture["joints"],
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const read: ReturnType<typeof poseBones.prepareTuples> =
      poseBones.prepareTuples(body, requested);
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const staged: ReturnType<typeof read> = read(joints);
      const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
        turnHumanPosture({ ...posture, limbs: {} });
      return staged(
        {
          skeleton: body.skeleton.id,
          root: Transform.of(turned.position, turned.rotation),
        },
        prepareHumanPoseResolution.read(resolution),
      );
    };
  }

  /**
   * Shares of a forward trunk inclination taken by the pelvis, the lumbar spine
   * and the thorax: at full forward bending about 40 degrees of lumbar flexion
   * against 70 of hip flexion (Esola et al. 1996, Spine 21:71), so the pelvis
   * takes 0.64 and the spine 0.36, split 0.28 lumbar and 0.08 thoracic.
   */
  export const RHYTHM: Readonly<IRHYTHMItem> = {
    pelvis: 0.64,
    lumbar: 0.28,
    thorax: 0.08,
  };

  /**
   * A trunk inclined forward by an angle shared by the lumbopelvic rhythm: the
   * pelvis pitch it takes and the spine and chest flexion added to the given
   * joints. A backward inclination is the pelvis alone, since leaning back is a
   * pelvic tilt.
   *
   * @param joints The posture's joints.
   * @param inclination Forward inclination of the trunk, degrees.
   * @param pelvisLimit The most the pelvis may take, degrees (`pelvisLimit`);
   *   the spine takes the rest.
   * @returns The pelvis pitch, degrees, and the joints with the flexion added.
   */
  export function incline(
    joints: IAutoMovieMotionHumanPosture["joints"],
    inclination: number,
    pelvisLimit: number = Infinity,
  ): IAutoMovieMotionHumanTrunk.IInclineResult {
    if (inclination <= 0) return { pitch: inclination, joints };
    const pelvis: number = pelvisPitch(inclination, pelvisLimit);
    const spine: number = inclination - pelvis;
    const out: IAutoMovieMotionHumanPosture["joints"] = { ...joints };
    const share: number = RHYTHM.lumbar / (RHYTHM.lumbar + RHYTHM.thorax);
    addHumanTrunkInclination(out, "spine", share, spine);
    addHumanTrunkInclination(out, "chest", 1 - share, spine);
    return { pitch: pelvis, joints: out };
  }

  /** The pelvis's share of a trunk inclination, in degrees. */
  export function pelvisPitch(
    inclination: number,
    pelvisLimit: number = Infinity,
  ): number {
    return inclination <= 0
      ? inclination
      : Math.max(0, Math.min(RHYTHM.pelvis * inclination, pelvisLimit));
  }

  /**
   * How far short of the hip's flexion range a tilted pelvis stops, degrees
   * (provisional: a margin off the joint's end stop, read from no measured
   * source).
   */
  export const HIP_MARGIN: number = 10;

  /**
   * The hip flexion a forward-tilted pelvis leaves room for, degrees:
   * `HIP_MARGIN` short of the hip's flexion range in `DEFAULT_HUMANOID_ROM`.
   */
  export const HIP_FLEXION: number =
    DEFAULT_HUMANOID_ROM.leftUpperLeg!.flexion!.max - HIP_MARGIN;

  /**
   * The most the pelvis may tilt forward before a planted leg's hip flexion
   * passes `HIP_FLEXION`: each thigh's angle from vertical, with the knee
   * bending forward, from the law of cosines on the hip-to-ankle distance,
   * subtracted from that limit. Squatting and sitting fold the thighs, so the
   * trunk's inclination then comes more from the spine than from the pelvis, as
   * it does when the hips are already flexed.
   *
   * @param body The body.
   * @param root The rig origin with the pelvis level, world metres.
   * @param yaw The heading, degrees.
   * @param ankles The planted ankles, world metres.
   * @returns Degrees, at least 0.
   */
  export function pelvisLimit(
    body: Pick<IAutoMovieMotionHumanBody, "rest"> & {
      measure: Pick<IAutoMovieMotionHumanBody["measure"], "thigh" | "shank">;
    },
    root: IAutoMovieVector3,
    yaw: number,
    ankles: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  ): number {
    const m: Pick<IAutoMovieMotionHumanBody["measure"], "thigh" | "shank"> =
      body.measure;
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
   * @param region A region riding the trunk, the head or the hips (not a limb
   *   below the hip or shoulder).
   * @param resolution Optional exact reader or supplier borrowed from this
   *   synchronous parent evaluation.
   * @returns The point (metres) and the unit normal.
   */
  export function region(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    region: AutoMovieHumanoidRegion,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanTrunk.IRegionResult {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[region];
    return surfaceOf(
      frame,
      resolve(body, posture, undefined, resolution, new Set([frame.bone])).get(
        frame.bone,
      )!,
    );
  }

  /**
   * Prepare one fixed anatomical region for changing authored postures.
   *
   * @param body The unchanged body owning the region and canonical rig.
   * @param region The fixed trunk/head/hip region; limb goals remain ignored.
   * @returns Its actual world point and normal reader, optionally borrowing the
   *   current operation's exact FK workspace.
   */
  export function prepareRegion(
    body: IAutoMovieMotionHumanBody,
    region: AutoMovieHumanoidRegion,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => HumanTrunk.ISurface {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[region];
    const read: ReturnType<typeof prepareResolve> = prepareResolve(
      body,
      new Set([frame.bone]),
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): HumanTrunk.ISurface => {
      return surfaceOf(frame, read(posture, resolution).get(frame.bone)!);
    };
  }

  /**
   * Prepare one fixed region's world point for changing authored postures.
   *
   * @param body The unchanged body owning the actual region and canonical rig.
   * @param region The fixed trunk/head/hip region; limb goals remain ignored.
   * @returns A fresh world-metre point reader, optionally borrowing its current
   *   synchronous operation's exact FK workspace.
   */
  export function preparePoint(
    body: IAutoMovieMotionHumanBody,
    region: AutoMovieHumanoidRegion,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieVector3 {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[region];
    const read: ReturnType<typeof prepareResolve> = prepareResolve(
      body,
      new Set([frame.bone]),
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieVector3 => {
      const bones: ReturnType<typeof read> = read(posture, resolution);
      return resolveAutoMovieHumanoidSurfaces.point(
        frame,
        bones.get(frame.bone)!,
      );
    };
  }

  /**
   * Where a ray meets the trunk or the head of a posture: the point on their
   * colliders and the outward normal there (`HumanColliders.cast`). Only the
   * midline segments are tested (the pelvis, spine, chest, neck and head),
   * since the limbs are not placed here, so a hand already lying on the trunk
   * does not hide it. A hand rest takes a place between two named regions from
   * this, on the surface itself.
   *
   * @param body The body.
   * @param posture The posture; its limb goals are ignored.
   * @param from The ray's start, world metres, outside the trunk.
   * @param toward Where it runs; any non-zero vector.
   * @returns The point (metres) and the unit normal.
   * @throws {Error} When the ray misses the trunk within two statures.
   */
  export function surface(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    from: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): IAutoMovieMotionHumanTrunk.ISurfaceResult {
    const midline: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = resolve(
      body,
      posture,
      undefined,
      undefined,
      MIDLINE,
    );
    return cast(body, HumanColliders.reading(body, midline), from, toward);
  }

  /**
   * Read several regions or ray hits against one unchanged authored trunk. The
   * reading belongs to one synchronous operation and must be released before
   * its posture, body, skeleton or profile changes.
   *
   * @param body The unchanged body.
   * @param posture The unchanged authored posture; limb goals remain ignored.
   * @param requested Bones used by the operation; all when absent. Include
   *   every region bone and, for rays, all midline collider bones the reading
   *   will use.
   * @param resolution Optional exact FK source borrowed only during the
   *   immediate constructor resolve; the returned reader never captures it.
   * @returns The resolved bones and region/ray readers borrowing them.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IReading {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = resolve(
      body,
      posture,
      undefined,
      resolution,
      requested,
    );
    return reading(body, bones);
  }

  /**
   * Bind actual resolved frames in a scope that cannot retain the parent FK
   * loan.
   */
  function reading(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IReading {
    let colliders: ReturnType<typeof HumanColliders.reading> | undefined;
    return {
      bones,
      region: (region: AutoMovieHumanoidRegion): HumanTrunk.ISurface => {
        const frame: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions[region];
        return surfaceOf(frame, bones.get(frame.bone)!);
      },
      surface: (
        from: IAutoMovieVector3,
        toward: IAutoMovieVector3,
      ): HumanTrunk.ISurface => {
        if (colliders === undefined) {
          const midline: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            new Map();
          for (const [bone, resolved] of bones)
            if (MIDLINE.has(bone)) midline.set(bone, resolved);
          colliders = HumanColliders.reading(body, midline);
        }
        return cast(body, colliders, from, toward);
      },
    };
  }

  /** Operation-owned trunk frames for several region or ray queries. */
  export interface IReading {
    /**
     * Demanded bone frames, with limb goals ignored; caller must not mutate
     * them.
     */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** A demanded region's world-metre point and unit outward normal. */
    region(region: AutoMovieHumanoidRegion): HumanTrunk.ISurface;

    /**
     * A world ray's hit on midline colliders, throwing when it misses within
     * two statures.
     */
    surface(
      from: IAutoMovieVector3,
      toward: IAutoMovieVector3,
    ): HumanTrunk.ISurface;
  }

  /** A point and normal on an actual trunk surface. */
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
const MIDLINE: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "jaw",
  ]);

/**
 * A region's world point and unit normal, placed on its resolved bone by the
 * engine's surface placement.
 */
function surfaceOf(
  frame: IAutoMovieHumanoidSurfaces.IFrame,
  bone: IAutoMovieResolvedBone,
): HumanTrunk.ISurface {
  const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
    resolveAutoMovieHumanoidSurfaces.place(frame, bone);
  return { point: placed.point, normal: placed.normal };
}
