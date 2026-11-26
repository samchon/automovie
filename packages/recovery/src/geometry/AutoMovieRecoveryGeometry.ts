import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMoviePlaneFrame,
} from "@automovie/interface";

import { cross as crossOperation } from "../internal/mesh-observations/cross";
import { dist as distOperation } from "../internal/mesh-observations/dist";
import { dot as dotOperation } from "../internal/mesh-observations/dot";
import { len as lenOperation } from "../internal/mesh-observations/len";
import { mul as mulOperation } from "../internal/mesh-observations/mul";
import { norm as normOperation } from "../internal/mesh-observations/norm";
import { signedArea as signedAreaOperation } from "../internal/mesh-observations/signedArea";
import { sub as subOperation } from "../internal/mesh-observations/sub";
import { to2 as to2Operation } from "../internal/mesh-observations/to2";

/** Pure vector and planar-coordinate operations for Recovery geometry. */
export namespace AutoMovieRecoveryGeometry {
  /** Compute the right-handed cross product in a shared Cartesian frame. */
  export function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return crossOperation(a, b);
  }

  /** Measure Euclidean distance in the points' common frame and units. */
  export function dist(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return distOperation(a, b);
  }

  /** Compute the Euclidean inner product of two vectors. */
  export function dot(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return dotOperation(a, b);
  }

  /** Measure Euclidean vector magnitude, retaining its units. */
  export function len(a: AutoMovieVector3Tuple): number {
    return lenOperation(a);
  }

  /** Scale a vector without changing its coordinate frame. */
  export function mul(
    a: AutoMovieVector3Tuple,
    scale: number,
  ): AutoMovieVector3Tuple {
    return mulOperation(a, scale);
  }

  /** Normalize a vector; zero remains zero for explicit degeneracy handling. */
  export function norm(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    return normOperation(a);
  }

  /** Measure signed planar area; counter-clockwise contours are positive. */
  export function signedArea(points: AutoMovieVector2Tuple[]): number {
    return signedAreaOperation(points);
  }

  /** Subtract vectors expressed in the same frame and units. */
  export function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return subOperation(a, b);
  }

  /** Project a point into a plane's physical u/v coordinates. */
  export function to2(
    plane: IAutoMoviePlaneFrame,
    point: AutoMovieVector3Tuple,
  ): AutoMovieVector2Tuple {
    return to2Operation(plane, point);
  }
}
