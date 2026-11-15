import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  physicalShapeBounds,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "./HumanColliders";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * What a posture shows of the floor, read as the floor audit reads it: the
 * lowest point of each collider of the posed body, the lowest of the
 * colliders each bearing part bears through, and the places of the points
 * a whole-body fit (`HumanBodyFit`) brings to goals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and how.
 * @evidence contracts/development/design.md#principled-representation Heights and places on the posed colliders and bones, the quantities the fit's rows constrain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and one reading, read by the fit for every row it linearises.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The colliders are the body's own, placed by the shared placement the floor audit reads.
 */
export namespace HumanFloorReading {
  /** A posture's reading. */
  export interface IReading {
    /** Each bearing part's lowest height, metres, in the order given. */
    parts: number[];

    /** Each bearing part's colliders, as indices into `lows`, in the order given. */
    members: number[][];

    /** Each target point's place, world metres, in the order given. */
    points: IAutoMovieVector3[];

    /** Each target's bone's world rotation, in the order given. */
    turns: IAutoMovieQuaternion[];

    /** Each collider's lowest height, metres, in the colliders' order. */
    lows: number[];

    /** Each collider's bone, in the colliders' order. */
    owners: AutoMovieHumanoidBone[];

    /** Each support candidate's lowest height, metres: the heights a collider's lowest point is the least of, each a smooth function of the posture. */
    heights: number[];

    /** Each support candidate's point, world metres: a sphere's centre, each end centre of a capsule, each corner of a box, each vertex of a hull, the point the candidate's height moves with. */
    spots: IAutoMovieVector3[];

    /** Each support candidate's collider, as an index into `lows`. */
    of: number[];

    /** The posed bones read. */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * The reading of a posture.
   *
   * @param body The body.
   * @param posture The posture, written by its joint angles alone.
   * @param bearing Each bearing part, as the bones it bears through.
   * @param targets The points read: each a bone and a point in its frame, its origin when absent.
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation One forward kinematics; each collider's lowest point is its placed shape's bounds, the floor audit's reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the placed colliders.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every collider is read; none is skipped by its height.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posing and one pass over the colliders.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IHumanBody,
    posture: IHumanPosture,
    bearing: readonly RegExp[],
    targets: readonly { bone: AutoMovieHumanoidBone; point?: IAutoMovieVector3 }[],
  ): IReading {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, posture),
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
        const box: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
          physicalShapeBounds(segment.pose, shape);
        lows.push(box.min.y);
        owners.push(segment.bone);
        for (const c of candidates(segment.pose, shape)) {
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
      points: targets.map(
        (target: {
          bone: AutoMovieHumanoidBone;
          point?: IAutoMovieVector3;
        }): IAutoMovieVector3 => {
          const at: IAutoMovieResolvedBone = bones.get(target.bone)!;
          return target.point === undefined
            ? at.worldPosition
            : Vector3.add(
                at.worldPosition,
                Quaternion.rotateVector(at.worldRotation, target.point),
              );
        },
      ),
      turns: targets.map(
        (target: { bone: AutoMovieHumanoidBone }): IAutoMovieQuaternion =>
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
   * A placed collider's support candidates: the points its lowest point is
   * the least of, each with how far below it the collider reaches. A
   * collider's lowest height is the least of theirs, so each is a smooth
   * function of the posture where their least is not: a shank lying flat
   * has two, its knee end and its ankle end, and the one lowest turns from
   * one to the other as the leg turns.
   */
  function candidates(
    pose: Parameters<typeof physicalShapeBounds>[0],
    shape: Parameters<typeof physicalShapeBounds>[1],
  ): { point: IAutoMovieVector3; lift: number }[] {
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      pose.rotation,
      shape.transform.rotation,
    );
    const centre: IAutoMovieVector3 = Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, shape.transform.position),
    );
    const at = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(centre, Quaternion.rotateVector(rotation, local));
    if (shape.kind === "sphere") return [{ point: centre, lift: shape.radius }];
    if (shape.kind === "capsule")
      return [-1, 1].map((end: number): { point: IAutoMovieVector3; lift: number } => ({
        point: at({ x: 0, y: end * shape.halfLength, z: 0 }),
        lift: shape.radius,
      }));
    if (shape.kind === "box") {
      const out: { point: IAutoMovieVector3; lift: number }[] = [];
      for (const x of [-1, 1])
        for (const y of [-1, 1])
          for (const z of [-1, 1])
            out.push({
              point: at({
                x: x * shape.halfExtents.x,
                y: y * shape.halfExtents.y,
                z: z * shape.halfExtents.z,
              }),
              lift: 0,
            });
      return out;
    }
    return shape.points.map(
      (point: IAutoMovieVector3): { point: IAutoMovieVector3; lift: number } => ({
        point: at(point),
        lift: 0,
      }),
    );
  }
}