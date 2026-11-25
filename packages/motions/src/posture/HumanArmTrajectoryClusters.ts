import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * The runs of a frame's body corners that share a part, each with the sphere
 * about its corners (`HumanArmTrajectoryOverlap.embedded`'s first level of its
 * bounding-volume hierarchy).
 *
 * @param body The frame's body corners (`HumanArmGeometry.IFrame.body`).
 * @returns The runs in the corners' order.
 */
export function HumanArmTrajectoryClusters(
  body: IAutoMovieMotionHumanArmGeometry.IFrame["body"],
): HumanArmTrajectoryClusters.ICluster[] {
  const out: HumanArmTrajectoryClusters.ICluster[] = [];
  for (let start: number = 0; start < body.length; ) {
    let end: number = start + 1;
    while (end < body.length && body[end]!.part === body[start]!.part) ++end;
    const scale: number = 1 / (end - start);
    let x: number = 0;
    let y: number = 0;
    let z: number = 0;
    for (let i: number = start; i < end; ++i) {
      x += body[i]!.point.x * scale;
      y += body[i]!.point.y * scale;
      z += body[i]!.point.z * scale;
    }
    const centre: IAutoMovieVector3 = { x, y, z };
    let radius: number = 0;
    for (let i: number = start; i < end; ++i)
      radius = Math.max(radius, Vector3.distance(body[i]!.point, centre));
    out.push({ start, end, centre, radius });
    start = end;
  }
  return out;
}

/** A run of body corners and its screen against an arm segment's sphere. */
export namespace HumanArmTrajectoryClusters {
  /**
   * A run of consecutive body corners of one part
   * (`HumanArmGeometry.IFrame.body`) and the sphere about them.
   */
  export interface ICluster {
    /** The run's first corner's index. */
    start: number;

    /** One past the run's last corner's index. */
    end: number;

    /** The corners' mean, world metres. */
    centre: IAutoMovieVector3;

    /** The farthest corner's distance from the centre, metres. */
    radius: number;
  }

  /**
   * Whether any corner of a cluster can lie within the reach of a segment's
   * sphere (`HumanArmTrajectoryOverlap.embedded`'s per-corner screen), with a
   * slack far above the rounding of the distances.
   *
   * @param cluster The cluster.
   * @param centre The segment's sphere's centre, world metres.
   * @param radius The segment's sphere's radius, metres.
   * @returns Whether a corner of the cluster can be within reach.
   */
  export function reaches(
    cluster: ICluster,
    centre: IAutoMovieVector3,
    radius: number,
  ): boolean {
    return (
      Vector3.distance(cluster.centre, centre) - cluster.radius - radius <
      T.REACH + MARGIN
    );
  }
}

/**
 * The slack of a cluster's screen over its corners', metres: far below the
 * pairs' reach, far above the rounding of a distance in metres.
 */
const MARGIN: number = 1e-9;
