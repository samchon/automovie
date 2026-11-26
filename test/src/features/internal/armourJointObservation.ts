import type { createArmour } from "@automovie/archetypes";
import { Quaternion, Vector3, physicalHullFaces, AutoMovieEngineMath, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Independent contact observations of the actual transformed armour cells.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States model-metre actual hull placement, coincident-face and horizontal cross-section observations without producer profiles or expected lattice formulas.
 * @evidence contracts/development/design.md#principled-representation Actual current hull corners provide shared boundaries; existing convex clipping and vector owners measure contact area rather than reconstructing the generating surface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Cell placement, common-face, parallel-plane gauge and horizontal-overlap observations serve the current radial-wall and bowl/brim regression unit only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source dimension, cavity formula, fixture vertex or padded contact distance substitutes for actual emitted cell geometry.
 */
export namespace armourJointObservation {
  /**
   * Actual closed hull corners after their current model-space rigid placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the public produced piece, current actual hull-only premise, stable id map and fresh metre-coordinate output.
   * @evidence contracts/development/implementation.md#principled-implementation The public actual shape record supplies local corners and its current rigid transform; engine quaternion/vector owners place each corner into one common model frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read actual shapes, refuse a nonhull representation and transform its real points once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No profile or expected generated corner is consulted and no aggregate convex hull fills the object's cavity.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V) work and fresh output for the actual selected model's hull corners.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One current-cell map serves every adjacency and brim cross-section observation in that unit case.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent scalar vectors and retains no model, collider list, completed observation or external resource.
   */
  export function cells(
    piece: ReturnType<typeof createArmour>,
  ): ReadonlyMap<string, readonly IAutoMovieVector3[]> {
    const output: Map<string, readonly IAutoMovieVector3[]> = new Map();
    for (const shape of piece.shapes()) {
      if (shape.kind !== "hull")
        throw new Error("A joint observation requires actual hull walls");
      output.set(
        shape.id,
        shape.points.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(
              shape.transform.position,
              Quaternion.rotateVector(shape.transform.rotation, point),
            ),
        ),
      );
    }
    return output;
  }

  /**
   * The least separation of actual opposing parallel hull planes, in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Takes current actual cell corners and arithmetic precision; returns the smallest positive opposite-plane separation or Infinity when no parallel wall pair exists.
   * @evidence contracts/development/implementation.md#principled-implementation Opposite unit normals identify parallel actual hull planes, whose signed support sum gives their translation-independent separation. The thin radial wall pair is the closest opposing pair in these bounded helmet/limb cases.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the canonical hull faces once, compare each pair and reduce the finite positive separations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No producer profile, generating lattice equation, expected inner scale or source gauge contributes to the measured result; missing parallel walls remain observable.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(F squared) pair comparisons over each actual cell's small face set; the existing hull owner retains its normal per-array cache.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the canonical engine hull planes and Vector3 normal comparison rather than a second plane-fitting or erosion implementation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a scalar escapes; no observed piece, corners, cache or external resource is retained here.
   */
  export function gauge(
    points: readonly IAutoMovieVector3[],
    epsilon: number,
  ): number {
    const faces: IAutoMoviePhysicalHullFaces.IFace[] =
      physicalHullFaces(points).faces;
    let minimum: number = Infinity;
    for (let i: number = 0; i < faces.length; i++)
      for (let j: number = i + 1; j < faces.length; j++) {
        const first: IAutoMoviePhysicalHullFaces.IFace = faces[i]!;
        const second: IAutoMoviePhysicalHullFaces.IFace = faces[j]!;
        const separation: number = first.offset + second.offset;
        if (
          Vector3.length(Vector3.add(first.normal, second.normal)) <= epsilon &&
          separation > 0
        )
          minimum = Math.min(minimum, separation);
      }
    return minimum;
  }

  /**
   * Shared actual corners and a noncollinear common-face witness area.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines two actual metre-coordinate corner sets, caller's unchanged positional precision and count/square-metre area output.
   * @evidence contracts/development/implementation.md#principled-implementation Match only actual coordinates within the supplied arithmetic precision, deduplicate the common set and measure the largest triangle's cross-product area to distinguish a face from a point/line contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Gather common corners once, then reduce their triangle areas using engine Vector3.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A close bounding box or duplicated source lattice equation cannot establish a seam; fewer than four shared wall corners or zero area remains distinguishable to the caller.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(A B+C cubed) work for small actual cell sets of A/B corners and C common corners; no mesh regeneration or global search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same actual corner match serves row seams and the brim's required matching inner edge.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only scalar observations escape; common-point references are call-local and no cache or resource remains.
   */
  export function shared(
    first: readonly IAutoMovieVector3[],
    second: readonly IAutoMovieVector3[],
    epsilon: number,
  ): { count: number; area: number } {
    const common: IAutoMovieVector3[] = [];
    for (const point of first)
      if (
        second.some(
          (other: IAutoMovieVector3): boolean =>
            distance(point, other) <= epsilon,
        ) &&
        !common.some(
          (other: IAutoMovieVector3): boolean =>
            distance(point, other) <= epsilon,
        )
      )
        common.push(point);
    let area: number = 0;
    for (let i: number = 0; i < common.length; i++)
      for (let j: number = i + 1; j < common.length; j++)
        for (let k: number = j + 1; k < common.length; k++) {
          const cross: IAutoMovieVector3 = Vector3.cross(
            Vector3.subtract(common[j]!, common[i]!),
            Vector3.subtract(common[k]!, common[i]!),
          );
          area = Math.max(area, Math.hypot(cross.x, cross.y, cross.z) / 2);
        }
    return { count: common.length, area };
  }

  /**
   * Positive intersection area of two actual horizontal contact sections.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual current corners, observed contact Y in metres, unchanged positional precision and square-metre overlap; missing/line sections yield zero area.
   * @evidence contracts/development/implementation.md#principled-implementation Select real corners on the observed plane, order their XZ sections with the existing convex hull owner and intersect those actual polygons through the existing clipping owner; signedArea measures the retained polygon.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Make each observed section once, clip them and return its absolute analytic polygon area.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No expected bowl/brim radius, source topology ratio, inflated epsilon polygon or invented connecting cell can supply a positive area.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V log V) section ordering plus the clipping owner's small convex-polygon work; all sections have only actual wall-cell corner populations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses canonical engine hull, clipping and polygon-area owners instead of implementing a second intersection or solver.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Section/intersection arrays are call-local; only a scalar escapes and no caller state or resource is retained.
   */
  export function overlap(
    first: readonly IAutoMovieVector3[],
    second: readonly IAutoMovieVector3[],
    level: number,
    epsilon: number,
  ): number {
    const one: [number, number][] = section(first);
    const two: [number, number][] = section(second);
    const intersection: [number, number][] = AutoMovieEngineGeometry.intersectConvexPolygons(
      one,
      two,
    );
    return Math.abs(
      AutoMovieEngineGeometry.signedArea(
        intersection.map(
          (point: [number, number]): { x: number; y: number } => ({
            x: point[0],
            y: point[1],
          }),
        ),
      ),
    );

    /** Observed coplanar corners supply the section; no expected course is sampled. */
    function section(points: readonly IAutoMovieVector3[]): [number, number][] {
      return AutoMovieEngineMath.convexHull2D(
        points.filter(
          (point: IAutoMovieVector3): boolean =>
            Math.abs(point.y - level) <= epsilon,
        ),
      ).map((point: IAutoMovieVector3): [number, number] => [point.x, point.z]);
    }
  }

  /** The same Euclidean positional comparison owns matching and deduplication. */
  function distance(
    first: IAutoMovieVector3,
    second: IAutoMovieVector3,
  ): number {
    return Math.hypot(
      first.x - second.x,
      first.y - second.y,
      first.z - second.z,
    );
  }
}
