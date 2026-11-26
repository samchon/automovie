import { critical as criticalImplementation } from "./internal/critical";
import { planeFrame as planeFrameImplementation } from "./internal/planeFrame";
import { sourceOrientation as sourceOrientationImplementation } from "./internal/sourceOrientation";

import { type AutoMovieVector2Tuple, type AutoMovieVector3Tuple, type IAutoMoviePlaneFrame, type IAutoMovieMeshCriticalPoints, type IAutoMoviePlaneFrameConstruction, type IAutoMovieMeshSectionOrientation } from "@automovie/interface";

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

  /**
   * Classifies generic PL height vertices by connected lower and upper links.
   * Equal heights use a private symbolic address order without perturbing
   * physical coordinates. Bremer et al. 2004, sections II.C and III.A:
   * https://web.cs.ucdavis.edu/~hamann/BremerEdelsbrunnerHamannPascucci2004TVCG.pdf
   * The returned manifold flag denotes one cycle; other links remain legacy
   * unresolved observations. The default legacy-link-cycle-v1 policy preserves
   * that classification. Opt-in boundary-regular-path-v1 additionally omits a
   * strict regular boundary fan: a connected simple path, qualified incident
   * faces and radial edge incidence, no tied neighbor height, connected nonempty
   * lower/upper links and opposite boundary-end signs. This is a sufficient local
   * half-disk chart condition, not an embedding certificate. Turner, Robins and
   * Morgan 2024, Definition 4.6: https://doi.org/10.1007/s41468-024-00175-8
   */
  export function critical(skin: Parameters<IAutoMovieMeshCriticalPoints.Operation>[0], axis?: Parameters<IAutoMovieMeshCriticalPoints.Operation>[1], scalarHeights?: Parameters<IAutoMovieMeshCriticalPoints.Operation>[2], policy?: Parameters<IAutoMovieMeshCriticalPoints.Operation>[3]): ReturnType<IAutoMovieMeshCriticalPoints.Operation> {
    return criticalImplementation(skin, axis, scalarHeights, policy);
  }

  /**
   * Builds an orthonormal cutting frame whose v follows the projected reference
   * and u cross v = n.
   */
  export function planeFrame(origin: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[0], normal: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[1], reference: Parameters<IAutoMoviePlaneFrameConstruction.Operation>[2]): ReturnType<IAutoMoviePlaneFrameConstruction.Operation> {
    return planeFrameImplementation(origin, normal, reference);
  }

  /**
   * Builds a private supporting-face orientation witness; its result
   * distinguishes outer from cavity contours. An explicit registered sign
   * bypasses global-volume inference and retains the supplied material-side
   * convention for open or independently oriented source shells.
   */
  export function sourceOrientation(skin: Parameters<IAutoMovieMeshSectionOrientation.Operation>[0], orientation?: Parameters<IAutoMovieMeshSectionOrientation.Operation>[1]): ReturnType<IAutoMovieMeshSectionOrientation.Operation> {
    return sourceOrientationImplementation(skin, orientation);
  }
}
