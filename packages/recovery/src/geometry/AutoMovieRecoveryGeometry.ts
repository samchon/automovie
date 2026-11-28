import { critical as criticalImplementation } from "./internal/critical";
import { planeFrame as planeFrameImplementation } from "./internal/planeFrame";
import { sourceOrientation as sourceOrientationImplementation } from "./internal/sourceOrientation";

import { type AutoMovieVector2Tuple, type AutoMovieVector3Tuple, type IAutoMoviePlaneFrame, type IAutoMovieMeshPlaneCut, type IAutoMovieMeshCriticalPoints, type IAutoMoviePlaneFrameConstruction, type IAutoMovieMeshSectionOrientation } from "@automovie/interface";

import { cross as crossOperation } from "../internal/mesh-observations/cross";
import { dist as distOperation } from "../internal/mesh-observations/dist";
import { dot as dotOperation } from "../internal/mesh-observations/dot";
import { len as lenOperation } from "../internal/mesh-observations/len";
import { mul as mulOperation } from "../internal/mesh-observations/mul";
import { norm as normOperation } from "../internal/mesh-observations/norm";
import { signedArea as signedAreaOperation } from "../internal/mesh-observations/signedArea";
import { sub as subOperation } from "../internal/mesh-observations/sub";
import { to2 as to2Operation } from "../internal/mesh-observations/to2";
import { cutExact as cutExactImplementation } from "../internal/mesh-observations/cutExact";
import { prepareCutExact as prepareCutExactImplementation } from "../internal/mesh-observations/prepareCutExact";

/** Pure vector and planar-coordinate operations for Recovery geometry. */
export namespace AutoMovieRecoveryGeometry {
  /**
   * Return the right-handed cross product of two vectors in the same Cartesian
   * frame. Reversing the argument order reverses the direction.
   */
  export function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return crossOperation(a, b);
  }

  /**
   * Measure Euclidean distance between two points in the same frame. The
   * result uses their coordinate units.
   */
  export function dist(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return distOperation(a, b);
  }

  /**
   * Return the Euclidean inner product of two vectors in the same frame.
   */
  export function dot(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return dotOperation(a, b);
  }

  /**
   * Measure the Euclidean magnitude in the vector's coordinate units.
   */
  export function len(a: AutoMovieVector3Tuple): number {
    return lenOperation(a);
  }

  /**
   * Scale a Cartesian vector by the supplied multiplier. Return a new tuple in
   * its original frame.
   */
  export function mul(
    a: AutoMovieVector3Tuple,
    scale: number,
  ): AutoMovieVector3Tuple {
    return mulOperation(a, scale);
  }

  /**
   * Normalize a nonzero Cartesian vector to a unit direction. A zero vector
   * returns zero.
   */
  export function norm(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    return normOperation(a);
  }

  /**
   * Measure a polygon's signed area in its planar coordinate units squared.
   * Counterclockwise order is positive. A contour with fewer than three
   * vertices has zero area.
   */
  export function signedArea(points: AutoMovieVector2Tuple[]): number {
    return signedAreaOperation(points);
  }

  /**
   * Subtract the second Cartesian tuple from the first. Both use the same
   * frame and units.
   */
  export function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return subOperation(a, b);
  }

  /**
   * Project a point onto a cutting plane's `u` and `v` directions from its
   * origin. Return physical coordinates in the point's units.
   */
  export function to2(
    plane: IAutoMoviePlaneFrame,
    point: AutoMovieVector3Tuple,
  ): AutoMovieVector2Tuple {
    return to2Operation(plane, point);
  }

  /**
   * Intersect indexed triangles with a physical plane using binary64 cut
   * predicates. An optional supplied scalar chart determines signs and edge
   * fractions from height minus level. Keep isolated tangent contacts as
   * one-point open contours and split at graph junctions. An optional filter
   * receives original face IDs.
   */
  export function cutExact(
    skin: Parameters<IAutoMovieMeshPlaneCut.Operation>[0],
    plane: Parameters<IAutoMovieMeshPlaneCut.Operation>[1],
    select?: Parameters<IAutoMovieMeshPlaneCut.Operation>[2],
    chart?: Parameters<IAutoMovieMeshPlaneCut.Operation>[3],
  ): ReturnType<IAutoMovieMeshPlaneCut.Operation> {
    return cutExactImplementation(skin, plane, select, chart);
  }

  /**
   * Prepare reusable triangle cut queries. Keep source positions, incidence
   * and scalar heights unchanged while querying. Omit candidates to scan every
   * face. An explicit strictly increasing candidate list must include all
   * faces covering the level, including exact endpoints. Both provenance
   * switches default false. Enable them to retain exact emitting faces or
   * ordered edge ancestry.
   */
  export function prepareCutExact(
    skin: Parameters<IAutoMovieMeshPlaneCut.Prepare>[0],
    heights: Parameters<IAutoMovieMeshPlaneCut.Prepare>[1],
    retainSourceFaces: Parameters<IAutoMovieMeshPlaneCut.Prepare>[2] = false,
    retainOrderedSource: Parameters<IAutoMovieMeshPlaneCut.Prepare>[3] = false,
  ): ReturnType<IAutoMovieMeshPlaneCut.Prepare> {
    return prepareCutExactImplementation(
      skin,
      heights,
      retainSourceFaces,
      retainOrderedSource,
    );
  }
  /**
   * Classify critical vertices of a piecewise-linear height function. The
   * default `legacy-link-cycle-v1` qualifies a single cycle. Select
   * `boundary-regular-path-v1` to also recognize a qualifying regular boundary
   * fan. Equal heights are ordered by original vertex identity and physical
   * levels stay unchanged.
   */
  export function critical(skin: Parameters<IAutoMovieMeshCriticalPoints.Operation>[0], axis?: Parameters<IAutoMovieMeshCriticalPoints.Operation>[1], scalarHeights?: Parameters<IAutoMovieMeshCriticalPoints.Operation>[2], policy?: Parameters<IAutoMovieMeshCriticalPoints.Operation>[3]): ReturnType<IAutoMovieMeshCriticalPoints.Operation> {
    return criticalImplementation(skin, axis, scalarHeights, policy);
  }

  /**
   * Build a right-handed orthonormal cutting frame from finite Cartesian
   * tuples. The supplied origin is retained by reference. The normal sets
   * `n`, and `v` follows the projected reference. A zero normal or projected
   * reference length below 1e-6 throws.
   */
  export function planeFrame(origin: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[0], normal: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[1], reference: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[2]): ReturnType<IAutoMoviePlaneFrameConstruction.Operation> {
    return planeFrameImplementation(origin, normal, reference);
  }

  /**
   * Prepare a supporting-face orientation witness for classifying section
   * contours. Supply the registered material-side sign when known. Omit it to
   * infer orientation from the source's signed volume. Zero inferred volume
   * throws.
   */
  export function sourceOrientation(skin: Parameters<IAutoMovieMeshSectionOrientation.Operation>[0], orientation?: Parameters<IAutoMovieMeshSectionOrientation.Operation>[1]): ReturnType<IAutoMovieMeshSectionOrientation.Operation> {
    return sourceOrientationImplementation(skin, orientation);
  }
}
