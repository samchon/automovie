import {
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalShapeNearest,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";

import { fitSeatedAnkleCrossShape } from "./fitSeatedAnkleCrossShape";

const RAD = Math.PI / 180;

interface ISweepPlane {
  rotation: fitSeatedAnkleCrossShape.IShape["pose"]["rotation"];
  fixedMaximum: number;
  fixedScale: number;
}

/**
 * An axis from a real material witness certifies a pair only when the actual
 * projected solids are farther apart than the same swept displacement bound.
 * The exact pair distance remains authoritative whenever the plane falls
 * short.
 *
 * This uses the axial projection in Gottschalk, Lin and Manocha (1996), section
 * 5, https://www.cs.cornell.edu/courses/cs667/2005sp/readings/gottschalk96.pdf,
 * alongside a displacement bound as in Tang, Kim and Manocha (2009),
 * https://gamma-web.iacs.umd.edu/papers/documents/articles/2009/tang09.pdf.
 */
export function fitSeatedAnkleCrossSweep(
  carrying: readonly fitSeatedAnkleCrossShape.IShape[],
  contactNormal: IAutoMovieVector3,
): (
  fixed: fitSeatedAnkleCrossShape.IShape,
  moving: fitSeatedAnkleCrossShape.IShape,
  sweep: number,
) => number {
  const contact = new Map(
    carrying.map((shape) => [shape, sweepPlane(contactNormal, shape)] as const),
  );
  const witnesses = new Map<
    fitSeatedAnkleCrossShape.IShape,
    Map<IAutoMoviePhysicalShape, ISweepPlane>
  >();
  return (fixed, moving, sweep) => {
    let pair = witnesses.get(fixed);
    if (pair === undefined) {
      pair = new Map();
      witnesses.set(fixed, pair);
    }
    const retained = Math.max(
      projectedGap(contact.get(fixed), moving),
      projectedGap(pair.get(moving.shape), moving),
    );
    if (retained > sweep) return retained;

    const center = Vector3.scale(
      Vector3.add(moving.bounds.min, moving.bounds.max),
      0.5,
    );
    const witness = physicalShapeNearest(
      fixed.pose,
      fixed.shape,
      center,
      center,
    );
    const candidate = sweepPlane(witness.normal, fixed);
    const separation = projectedGap(candidate, moving);
    if (candidate !== undefined && separation > sweep) {
      pair.set(moving.shape, candidate);
      return separation;
    }
    return fitSeatedAnkleCrossShape.distance(fixed, moving);
  };
}

function sweepPlane(
  direction: IAutoMovieVector3,
  fixed: fitSeatedAnkleCrossShape.IShape,
): ISweepPlane | undefined {
  const normal = Vector3.normalize(direction);
  if (!(Vector3.length(normal) > 0)) return undefined;
  const axis = Vector3.cross(normal, { x: 0, y: 1, z: 0 });
  const sine = Vector3.length(axis);
  const rotation =
    sine > Number.EPSILON
      ? Quaternion.fromAxisAngle(axis, Math.atan2(sine, normal.y) / RAD)
      : Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, normal.y >= 0 ? 0 : 180);
  const fixedMaximum = physicalShapeBounds(
    {
      position: {
        x: 0,
        y: Quaternion.rotateVectorY(rotation, fixed.pose.position),
        z: 0,
      },
      rotation: Quaternion.multiply(rotation, fixed.pose.rotation),
    },
    fixed.shape,
  ).max.y;
  return { rotation, fixedMaximum, fixedScale: projectionScale(fixed) };
}

function projectedGap(
  plane: ISweepPlane | undefined,
  moving: fitSeatedAnkleCrossShape.IShape,
): number {
  if (plane === undefined) return -Infinity;
  const movingMinimum = physicalShapeBounds.lowestFromParent(
    Quaternion.rotateVectorY(plane.rotation, moving.pose.position),
    Quaternion.multiply(plane.rotation, moving.pose.rotation),
    moving.shape,
  );
  // Both extrema use the same rotated axis. Bound roundoff against the terms
  // before cancellation, using a 64-operation binary64 error bound for the
  // quaternion compositions, projections, normalization and subtraction.
  // Borderline projections go to the original exact pair query.
  const operations = 64 * Number.EPSILON;
  const roundoff =
    (operations / (1 - operations)) *
    (plane.fixedScale + projectionScale(moving));
  return movingMinimum - plane.fixedMaximum - roundoff;
}

function projectionScale(row: fitSeatedAnkleCrossShape.IShape): number {
  const { position } = row.pose;
  const origin = row.shape.transform.position;
  const { min, max } = row.bounds;
  return (
    1 +
    Math.abs(position.x) +
    Math.abs(position.y) +
    Math.abs(position.z) +
    Math.abs(origin.x) +
    Math.abs(origin.y) +
    Math.abs(origin.z) +
    Math.max(Math.abs(min.x - position.x), Math.abs(max.x - position.x)) +
    Math.max(Math.abs(min.y - position.y), Math.abs(max.y - position.y)) +
    Math.max(Math.abs(min.z - position.z), Math.abs(max.z - position.z))
  );
}
