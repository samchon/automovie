import {

  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalShape,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";

/**
 * The seated ankle cross's placed shapes: the legs' colliders as placed, their
 * pair distance and the gap of their bounds.
 */
export namespace fitSeatedAnkleCrossShape {
  /** A leg's collider as placed: its bone, world pose, shape and world bounds. */
  export interface IShape {
    /** The bone the collider rides. */
    bone: AutoMovieHumanoidBone;

    /** The collider's world pose. */
    pose: IAutoMovieRigidTransform;

    /** The collider. */
    shape: IAutoMoviePhysicalShape;

    /** Its world axis-aligned bounds, metres. */
    bounds: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds>;
  }

  /**
   * Prepare the reader of a set of bones' placed colliders, each with its world
   * bounds.
   *
   * @param body The performer's body.
   * @param bones The bones whose colliders are read.
   * @returns The reader from posed bone frames.
   */
  export function readShapes(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    frames: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => IShape[] {
    const place = HumanColliders.preparePlaced(body, bones);
    return (frames) =>
      place(frames).flatMap(({ bone, pose, shapes }) =>
        shapes.map((shape) => ({
          bone,
          pose,
          shape,
          bounds: AutoMovieEnginePhysics.physicalShapeBounds(pose, shape),
        })),
      );
  }

  /**
   * The least distance between two placed colliders, metres (the engine's pair
   * query).
   *
   * @param fixed The carrying leg's collider.
   * @param moving The moving leg's collider.
   * @returns Metres; negative when they overlap.
   */
  export function distance(fixed: IShape, moving: IShape): number {
    return AutoMovieEnginePhysics.physicalShapePairDistance(
      fixed.pose,
      fixed.shape,
      moving.pose,
      moving.shape,
    );
  }

  /**
   * The gap between two axis-aligned bounds, metres: zero where they overlap.
   *
   * @param a The first bounds.
   * @param b The second bounds.
   * @returns Metres.
   */
  export function boundsGap(
    a: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds>,
    b: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds>,
  ): number {
    return Math.hypot(
      Math.max(a.min.x - b.max.x, b.min.x - a.max.x, 0),
      Math.max(a.min.y - b.max.y, b.min.y - a.max.y, 0),
      Math.max(a.min.z - b.max.z, b.min.z - a.max.z, 0),
    );
  }
}
