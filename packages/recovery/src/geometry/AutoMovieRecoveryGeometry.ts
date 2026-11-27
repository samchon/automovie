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
   * Intersect a triangle surface with a plane without epsilon displacement or
   * branch loss. Equal signed zero vertices retain exact source positions.
   * Coplanar triangles contribute only qualified patch-boundary edges; binary64
   * signs are not exact predicates. Every graph edge is visited once in maximal
   * degree-two chains, so junctions terminate separate open chains. Isolated
   * tangent contacts return one-point open polylines instead of disappearing. A
   * supplied scalar chart shares the exact height samples used for PL topology;
   * its signs and edge fractions use height minus level without reprojecting an
   * origin.
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
   * Reusable admission for deterministic source-plane observations. Prepared
   * queries consume one immutable source and scalar chart, with optional complete
   * face candidates.
   *
   * Admit immutable source positions, incidence and scalar heights once. The
   * caller keeps every supplied array unchanged until all queries finish. Each
   * query accepts original face IDs in strictly increasing order; candidates
   * must include every face whose scalar interval contains level, including
   * ties. Omitting candidates scans every face. The optional filter sees
   * original IDs. The supplied plane retains the physical chart, while heights
   * minus level own predicates. retainSourceFaces copies actual emitting faces,
   * excluding endpoint-star neighbors. retainOrderedSource additionally
   * preserves directed segments and original edge alias witnesses. Both default
   * false; omitted mode retains original properties and numeric paths. Binary64
   * predicates are not certified exact arithmetic.
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
