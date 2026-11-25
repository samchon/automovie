import { Quaternion, Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { resolveHumanPosture } from "./resolveHumanPosture";

/** The record of `ICandidatesShape`'s site. */
type ICandidatesShape = { kind: "hull" };

/** The record of `IOfTarget2`'s site. */
type IOfTarget2 = { bone: AutoMovieHumanoidBone };

/** The record of `IOfTarget`'s site. */
type IOfTarget = {
  bone: AutoMovieHumanoidBone;
  point?: IAutoMovieVector3;
};

/** The record of `IOfBox`'s site. */
type IOfBox = { min: IAutoMovieVector3; max: IAutoMovieVector3 };

/** The record of `IOfTargetsItem`'s site. */
type IOfTargetsItem = {
  bone: AutoMovieHumanoidBone;
  point?: IAutoMovieVector3;
};

/** A smooth support point and the downward radius extending beneath it. */
interface ICandidate {
  /** Actual world point on the shape's rigid frame. */
  point: IAutoMovieVector3;

  /** Metres below that point; zero for a corner or hull vertex. */
  lift: number;
}

/**
 * Append a placed collider's support candidates: the points its lowest point is
 * the least of, each with how far below it the collider reaches. A collider's
 * lowest height is the least of theirs, so each is a smooth function of the
 * posture where their least is not: a shank lying flat has two, its knee end
 * and its ankle end, and the one lowest turns from one to the other as the leg
 * turns. Centre and rotation are the same freshly composed shape frame already
 * consumed by the bounds owner, so no transform is applied twice. Hull vertices
 * are transferred by that owner; this appender visits sphere, capsule and box
 * points in the original end/corner order.
 */
function candidates(
  centre: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  shape: Exclude<Parameters<typeof physicalShapeBounds>[1], ICandidatesShape>,
  out: ICandidate[],
): void {
  const at: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(centre, Quaternion.rotateVector(rotation, local));
  if (shape.kind === "sphere") {
    out.push({ point: centre, lift: shape.radius });
    return;
  }
  if (shape.kind === "capsule") {
    for (let end: number = -1; end <= 1; end += 2)
      out.push({
        point: at({ x: 0, y: end * shape.halfLength, z: 0 }),
        lift: shape.radius,
      });
    return;
  }
  for (let x: number = -1; x <= 1; x += 2)
    for (let y: number = -1; y <= 1; y += 2)
      for (let z: number = -1; z <= 1; z += 2)
        out.push({
          point: at({
            x: x * shape.halfExtents.x,
            y: y * shape.halfExtents.y,
            z: z * shape.halfExtents.z,
          }),
          lift: 0,
        });
}

/**
 * The reading of a posture.
 *
 * @param body The body.
 * @param posture The posture, written by its joint angles alone.
 * @param bearing Each bearing part, as the bones it bears through.
 * @param targets The points read: each a bone and a point in its frame, its
 *   origin when absent.
 * @param source Optional exact FK reader or lazy supplier borrowed only during
 *   this synchronous reading.
 * @returns The reading.
 */
export function HumanFloorReading(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  bearing: readonly RegExp[],
  targets: readonly IOfTargetsItem[],
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
): HumanFloorReading.IReading {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined =
    source === undefined ? undefined : prepareHumanPoseResolution(source);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolution === undefined
      ? resolveHumanPosture(body, posture)
      : resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          undefined,
          resolution,
        ).pose,
    resolution?.(),
  );
  const lows: number[] = [];
  const owners: AutoMovieHumanoidBone[] = [];
  const heights: number[] = [];
  const spots: IAutoMovieVector3[] = [];
  const of: number[] = [];
  const parts: number[] = bearing.map((): number => Infinity);
  const members: number[][] = bearing.map((): number[] => []);
  for (const segment of HumanColliders.placed(body, bones))
    for (const shape of segment.shapes) {
      const centre: IAutoMovieVector3 = Vector3.add(
        segment.pose.position,
        Quaternion.rotateVector(
          segment.pose.rotation,
          shape.transform.position,
        ),
      );
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        segment.pose.rotation,
        shape.transform.rotation,
      );
      const found: ICandidate[] = [];
      const box: IOfBox = physicalShapeBounds.fromFrame(
        centre,
        rotation,
        shape,
        shape.kind !== "hull"
          ? undefined
          : (point: IAutoMovieVector3): void => {
              point.x = centre.x + point.x;
              point.y = centre.y + point.y;
              point.z = centre.z + point.z;
              found.push({ point, lift: 0 });
            },
      );
      lows.push(box.min.y);
      owners.push(segment.bone);
      if (shape.kind !== "hull") candidates(centre, rotation, shape, found);
      for (const c of found) {
        heights.push(c.point.y - c.lift);
        spots.push(c.point);
        of.push(lows.length - 1);
      }
      bearing.forEach((bears: RegExp, k: number): void => {
        if (bears.test(segment.bone)) {
          parts[k] = Math.min(parts[k]!, box.min.y);
          members[k]!.push(lows.length - 1);
        }
      });
    }
  return {
    parts,
    members,
    points: targets.map((target: IOfTarget): IAutoMovieVector3 => {
      const at: IAutoMovieResolvedBone = bones.get(target.bone)!;
      return target.point === undefined
        ? at.worldPosition
        : Vector3.add(
            at.worldPosition,
            Quaternion.rotateVector(at.worldRotation, target.point),
          );
    }),
    turns: targets.map(
      (target: IOfTarget2): IAutoMovieQuaternion =>
        bones.get(target.bone)!.worldRotation,
    ),
    lows,
    owners,
    heights,
    spots,
    of,
    bones,
  };
}

/**
 * What a posture shows of the floor, read as the floor audit reads it: the
 * lowest point of each collider of the posed body, the lowest of the colliders
 * each bearing part bears through, and the places of the points a whole-body
 * fit (`HumanBodyFit`) brings to goals.
 */
export namespace HumanFloorReading {
  /**
   * A posture's actual collider and goal readings, with indices linking bearing
   * parts, colliders and their smooth support candidates.
   */
  export interface IReading {
    /** Each bearing part's lowest height, metres, in the order given. */
    parts: number[];

    /**
     * Each bearing part's colliders, as indices into `lows`, in the order
     * given.
     */
    members: number[][];

    /** Each target point's place, world metres, in the order given. */
    points: IAutoMovieVector3[];

    /** Each target's bone's world rotation, in the order given. */
    turns: IAutoMovieQuaternion[];

    /** Each collider's lowest height, metres, in the colliders' order. */
    lows: number[];

    /** Each collider's bone, in the colliders' order. */
    owners: AutoMovieHumanoidBone[];

    /**
     * Each support candidate's lowest height, metres: the heights a collider's
     * lowest point is the least of, each a smooth function of the posture.
     */
    heights: number[];

    /**
     * Each support candidate's point, world metres: a sphere's centre, each end
     * centre of a capsule, each corner of a box, each vertex of a hull, the
     * point the candidate's height moves with.
     */
    spots: IAutoMovieVector3[];

    /** Each support candidate's collider, as an index into `lows`. */
    of: number[];

    /** The posed bones read. */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }
}
