import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalHullEdges } from "./internal/physicalHullEdges";
import { physicalHullFlat } from "./internal/physicalHullFlat";
import { physicalHullLoop } from "./internal/physicalHullLoop";
import { physicalHullPlanes } from "./internal/physicalHullPlanes";
import { physicalHullTriangles } from "./internal/physicalHullTriangles";

/**
 * The faces of the convex hull of a point set: each face's outward unit normal,
 * its plane offset along that normal and its vertex loop, counter clockwise
 * seen from outside.
 *
 * A plane through three points is a face when no point lies in front of it;
 * every point on that plane then belongs to the face, and their planar convex
 * hull (Andrew's monotone chain) orders the loop. Points within `tolerance` of
 * a plane count as on it, so a flat ring of many points yields one face rather
 * than a fan of slivers. A point set that spans no volume has no face.
 *
 * Every call searches afresh; a shape that is queried repeatedly carries its
 * hull on its record (`createPhysicalHullShape`) instead of calling this
 * again.
 *
 * @param points Shape-local points, metres.
 * @returns The hull's faces, its vertices, the mean of its vertices, the radii
 *   about that mean of a sphere containing the hull and of one inside it, and
 *   how deep any input point lies below the surface.
 */
export function physicalHullFaces(
  points: readonly IAutoMovieVector3[],
): IAutoMoviePhysicalHullFaces.IHull {
  const count: number = points.length;
  let extent: number = 0;
  for (let i: number = 0; i < count; i++)
    for (let j: number = i + 1; j < count; j++)
      extent = Math.max(extent, Vector3.distance(points[i]!, points[j]!));
  const tolerance: number = 1e-9 * extent;

  const planes: physicalHullPlanes.IResult = physicalHullPlanes(
    points,
    extent,
    tolerance,
    physicalHullTriangles(points, tolerance),
    false,
  )!;
  const used: boolean[] = points.map((): boolean => false);
  const faces: IAutoMoviePhysicalHullFaces.IFace[] = planes.faces.map(
    (face: physicalHullPlanes.IFace): IAutoMoviePhysicalHullFaces.IFace => {
      for (const index of face.loop) used[index] = true;
      return {
        normal: face.normal,
        offset: face.offset,
        loop: face.loop.map(
          (index: number): IAutoMovieVector3 => points[index]!,
        ),
      };
    },
  );
  return summarize(points, faces, used, tolerance);
}

/** The hull record and its face. */
export namespace physicalHullFaces {
  /**
   * Produce fresh points reflected in X, the isometry M=diag(-1,1,1).
   *
   * @param points Shape-local points, metres.
   * @returns The reflected points, owned by the caller.
   */
  export function mirrorX(
    points: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3[] {
    const reflected: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: -point.x,
        y: point.y,
        z: point.z,
      }),
    );
    return reflected;
  }

  /**
   * Produce fresh points translated by `-by`.
   *
   * @param points Shape-local points, metres.
   * @param by The offset subtracted from every point, metres.
   * @returns The translated points, each `point - by` by component.
   */
  export function shift(
    points: readonly IAutoMovieVector3[],
    by: IAutoMovieVector3,
  ): IAutoMovieVector3[] {
    const moved: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: point.x - by.x,
        y: point.y - by.y,
        z: point.z - by.z,
      }),
    );
    return moved;
  }

  /**
   * The hull of reflected points from the hull of their source: face order and
   * tolerance stay the source's, each normal is reflected with the points, and
   * each loop is ordered again on the reflected coordinates.
   *
   * @param points The source's points reflected by `mirrorX`.
   * @param source The hull of the source points.
   * @returns The hull of `points`.
   */
  export function mirrorHull(
    points: readonly IAutoMovieVector3[],
    source: IAutoMoviePhysicalHullFaces.IHull,
  ): IAutoMoviePhysicalHullFaces.IHull {
    return reflectedHull(points, source);
  }

  /** One supporting plane of the hull with its boundary. */
  export interface IFace {
    /** Outward unit normal, shape-local. */ normal: IAutoMovieVector3;
    /** The plane's distance from the origin along the normal, metres. */ offset: number;
    /** Boundary vertices, counter clockwise seen from outside. */ loop: IAutoMovieVector3[];
  }

  /** The hull of one point set. */
  export interface IHull {
    /** Every face; empty when the points span no volume. */ faces: IFace[];
    /** The points that are corners of some face. */ vertices: IAutoMovieVector3[];
    /** Mean of the vertices, shape-local metres. */ centre: IAutoMovieVector3;
    /** Radius about `centre` of a sphere containing the hull, metres. */ radius: number;
    /**
     * Least distance from `centre` to a face plane, metres: a sphere of this
     * radius about `centre` lies inside the hull. Zero without faces.
     */ depth: number;
    /**
     * Greatest depth of any input point below the surface, metres: at most
     * `tolerance` when every point lies on the surface.
     */ buried: number;
    /** The coplanarity tolerance used, metres: 1e-9 of the extent. */ tolerance: number;
    /** The flat form of the faces the proximity read walks; built with the hull. */ flat?: IAutoMoviePhysicalHullFaces.IFlat;
    /** Every distinct edge as its two corner points; built with the hull. */ edges?: [
      IAutoMovieVector3,
      IAutoMovieVector3,
    ][];
  }
}

/**
 * Use actual reflected coordinates in the same face membership, loop and
 * summary owners.
 */
function reflectedHull(
  points: readonly IAutoMovieVector3[],
  source: IAutoMoviePhysicalHullFaces.IHull,
): IAutoMoviePhysicalHullFaces.IHull {
  const used: boolean[] = points.map((): boolean => false);
  const faces: IAutoMoviePhysicalHullFaces.IFace[] = source.faces.map(
    (
      face: IAutoMoviePhysicalHullFaces.IFace,
    ): IAutoMoviePhysicalHullFaces.IFace => {
      const normal: IAutoMovieVector3 = {
        x: -face.normal.x,
        y: face.normal.y,
        z: face.normal.z,
      };
      const member: boolean[] = points.map(
        (point: IAutoMovieVector3): boolean =>
          Vector3.dot(normal, point) - face.offset >= -source.tolerance,
      );
      const loop: number[] = physicalHullLoop(points, member, normal);
      for (const index of loop) used[index] = true;
      return {
        normal,
        offset: face.offset,
        loop: loop.map((index: number): IAutoMovieVector3 => points[index]!),
      };
    },
  );
  return summarize(points, faces, used, source.tolerance);
}

/**
 * Preserve the same ordered vertex, sphere and face-distance reductions for
 * both producers.
 */
function summarize(
  points: readonly IAutoMovieVector3[],
  faces: IAutoMoviePhysicalHullFaces.IFace[],
  used: readonly boolean[],
  tolerance: number,
): IAutoMoviePhysicalHullFaces.IHull {
  const vertices: IAutoMovieVector3[] = points.filter(
    (_: IAutoMovieVector3, index: number): boolean => used[index]!,
  );
  const centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const vertex of vertices) {
    // Preserve scale's three reads/products before the original ordered sums.
    const share: number = 1 / vertices.length;
    const x: number = vertex.x * share;
    const y: number = vertex.y * share;
    const z: number = vertex.z * share;
    centre.x += x;
    centre.y += y;
    centre.z += z;
  }
  let radius: number = 0;
  for (const vertex of vertices)
    radius = Math.max(radius, Vector3.distance(vertex, centre));
  let depth: number = faces.length ? Infinity : 0;
  for (const face of faces)
    depth = Math.min(depth, face.offset - Vector3.dot(face.normal, centre));
  let buried: number = 0;
  if (faces.length)
    for (const p of points) {
      let outermost: number = -Infinity;
      for (const face of faces)
        outermost = Math.max(
          outermost,
          Vector3.dot(face.normal, p) - face.offset,
        );
      buried = Math.max(buried, -outermost);
    }
  return {
    faces,
    vertices,
    centre,
    radius,
    depth,
    buried,
    tolerance,
    flat: physicalHullFlat({ faces }),
    edges: physicalHullEdges({ faces }),
  };
}
