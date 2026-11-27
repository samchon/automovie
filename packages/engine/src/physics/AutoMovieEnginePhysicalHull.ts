import type {
  IAutoMoviePhysicalHullNearest,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createPhysicalHullShape } from "./internal/createPhysicalHullShape";
import { readPhysicalHullPoint } from "./internal/readPhysicalHullPoint";

/** Queries a convex hull in its shape-local frame. */
export namespace AutoMovieEnginePhysicalHull {
  /**
   * Read only signed metres from the same hull query. Every plane/edge test,
   * first-winner comparison and volume refusal still runs; only unobserved final
   * contact records are omitted. The implementation below owns both modes.
   */
  export function nearest(
    points: readonly IAutoMovieVector3[],
    p: IAutoMovieVector3,
    details: false,
  ): number;

  /**
   * Preserve the original two-argument full-contact signature and its result
   * type. It remains the last overload for Parameters/ReturnType consumers.
   */
  export function nearest(
    points: readonly IAutoMovieVector3[],
    p: IAutoMovieVector3,
  ): IAutoMoviePhysicalHullNearest.IResult;

  /**
   * The nearest surface point of a convex hull to a point in the hull's own
   * frame, with the outward normal there and the signed distance, negative
   * inside.
   *
   * Inside, the nearest surface point is the projection onto the face whose plane
   * is closest, and the normal is that face's. Outside, it is the projection onto
   * a facing face when that projection falls within the face's loop, and
   * otherwise the nearest point on the edges of the facing faces; the normal then
   * points from the surface point to the query point.
   *
   * The planes and the edges are read from flat arrays built once per hull: a
   * projection falls within a face's loop when it lies on the inner side of each
   * edge, which is the sign of one product with the edge's inward direction in
   * the face (the face normal crossed with the edge), as the query point and its
   * projection differ along the normal only.
   *
   * @param points The hull's shape-local points, metres, spanning a volume.
   * @param p The query point in the same frame.
   * @param details False for the distance alone; omitted for the original full
   *   contact.
   * @returns Signed metres in scalar mode; otherwise that distance with the
   *   original surface point and outward unit normal in the points' frame.
   * @throws {Error} When the points span no volume.
   */
  export function nearest(
    points: readonly IAutoMovieVector3[],
    p: IAutoMovieVector3,
    details: boolean = true,
  ): IAutoMoviePhysicalHullNearest.IResult | number {
    return readPhysicalHullPoint(points, p, details);
  }

  /** Opens a group of hulls with a shared identity rotation. */
  export function createShapeFactory(): IShapeFactory {
    return createPhysicalHullShape();
  }

  /** One profile construction owns a shared rotation and its placed hulls. */
  export interface IShapeFactory {
    /** The identity rotation every hull of the group shares. */
    rotation: IAutoMovieQuaternion;

    /** The offset from one point to another, the hull's placement. */
    offset(
      a: () => IAutoMovieVector3,
      b: () => IAutoMovieVector3,
    ): IAutoMovieVector3;

    /** A hull shape placed at a position with the shared rotation. */
    shape(
      id: string,
      material: string,
      position: IAutoMovieVector3,
      points: IAutoMovieVector3[],
    ): IAutoMoviePhysicalShape;
  }
}
