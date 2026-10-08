import { HumanFaceConformingMaterialArithmetic as Arithmetic } from "./HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingMaterialCut as MaterialCut } from "./structures/IHumanFaceConformingMaterialCut";
import type { IHumanFaceConformingMaterialTriangle as MaterialTriangle } from "./structures/IHumanFaceConformingMaterialTriangle";

/**
 * Own the complete exact barycentric lattice of each original material
 * triangle. Original cut edges determine shared fractions; each triangle
 * determines its interior samples. The conforming sheet owns final seats and
 * assembly, so both metric offset sheets consume the same result.
 *
 * @evidence contracts/common.md#principled-implementation Integer barycentric weights partition each complete material triangle before native common refinement; exact homogeneous coordinates retain every constructed point.
 * @evidence contracts/common.md#clear-and-simple-design One owner supplies lattice points, shared edge identities and all refined triangles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates never decide identity, and no sample is deleted or moved to satisfy an admission condition.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes original cut-edge ownership, triangle interiors and downstream metric seating.
 * @evidence contracts/modeling.md#emitted-geometry Complete material-domain barycentric cells preserve the existing cross-band sampling density before native facets introduce their own cuts.
 * @evidence contracts/modeling.md#shared-boundaries Original cut keys and integer edge fractions give incident pieces the same refinement vertices.
 * @evidence contracts/modeling.md#spatial-conventions Exact coordinates remain in the common dimensionless material frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Refines an existing tissue.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes the offset shell.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical dimension.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Changes no personal control.
 */
export class HumanFaceConformingRefinement {
  /**
   * Prepare exact triangle incidence and its exact common-unit material box.
   * The box only rejects disjoint candidates; exact points own all predicates.
   *
   * @evidence contracts/common.md#principled-implementation Original integer corners and their exact extrema supply one conservative triangle record.
   * @evidence contracts/common.md#clear-and-simple-design A single record retains construction keys, original parents and exact points.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Incidence IDs are supplied rather than inferred from nearby coordinates.
   * @evidence contracts/common.md#meaningful-documentation Separates exact coordinates from broad-phase bounds.
   * @evidence contracts/modeling.md#spatial-conventions Exact points and their bounds use the same dimensionless common integer material unit.
   * @evidence contracts/modeling.md#shared-boundaries Original construction keys survive later refinement.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Prepares an existing tissue domain.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no mesh primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes its shell.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical dimension.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Changes no personal control.
   */
  static triangle(
    corners: [number, number, number],
    point: (id: number) => MaterialCut["point"],
    key: (id: number) => string,
  ): MaterialTriangle {
    const points: MaterialTriangle["points"] = [
      point(corners[0]), point(corners[1]), point(corners[2]),
    ];
    return {
      corners,
      originalCorners: [...corners],
      keys: corners.map(key) as [string, string, string],
      points,
      bounds: this.bounds(points),
    };
  }

  /**
   * Divide the original material domain before native triangles clip it.
   * The caller's common integer unit contains the division factor, so every
   * lattice point has an exact unit-denominator representation. Keys retain
   * original edge fractions; no coordinate comparison chooses an identity.
   *
   * @evidence contracts/common.md#principled-implementation Each original triangle's complete barycentric lattice is generated once, then native common refinement can only subdivide it further.
   * @evidence contracts/common.md#clear-and-simple-design One construction-key table shares material vertices across all original triangles.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact divisibility refuses a wrong unit; no rounding, point weld or small-cell deletion occurs.
   * @evidence contracts/common.md#meaningful-documentation States the common-unit precondition, original parents and exact cell bounds.
   * @evidence contracts/modeling.md#emitted-geometry Every original triangle produces divisions-squared complete material cells before native clipping.
   * @evidence contracts/modeling.md#shared-boundaries Original edge keys and fractions provide one incidence for adjacent material cells.
   * @evidence contracts/modeling.md#spatial-conventions Coordinates remain exact integers in the caller's common material unit.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Refines an existing tissue domain.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes the shell.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical dimension.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Changes no personal control.
   */
  static compile(domain: readonly MaterialTriangle[], divisions: number): MaterialTriangle[] {
    const ordinals = new Map<string, number>();
    for (const triangle of domain)
      triangle.keys.forEach((key, at) => ordinals.set(key, triangle.corners[at]));
    let next = Math.max(-1, ...ordinals.values()) + 1;
    const result: MaterialTriangle[] = [];
    for (const parent of domain) {
      const original = parent.keys.map((key, at): MaterialCut => ({
        key, point: parent.points[at],
      })) as [MaterialCut, MaterialCut, MaterialCut];
      for (const cuts of this.refine(original, divisions, JSON.stringify(parent.originalCorners))) {
        const corners = cuts.map((cut) => {
          let ordinal = ordinals.get(cut.key);
          if (ordinal === undefined) ordinals.set(cut.key, (ordinal = next++));
          return ordinal;
        }) as [number, number, number];
        const points = cuts.map((cut): MaterialCut["point"] => {
          const [x, y, denominator] = cut.point;
          if (x % denominator !== 0n || y % denominator !== 0n)
            throw new Error("Material refinement needs its exact common integer unit.");
          return [x / denominator, y / denominator, 1n];
        }) as MaterialTriangle["points"];
        result.push({
          corners, points,
          keys: cuts.map((cut) => cut.key) as [string, string, string],
          originalCorners: [...parent.originalCorners],
          bounds: this.bounds(points),
        });
      }
    }
    return result;
  }

  /**
   * Exact extrema of unit-denominator material points for broad-phase rejection.
   *
   * @evidence contracts/common.md#principled-implementation Every affine triangle point lies between its corner extrema on each coordinate axis.
   * @evidence contracts/common.md#clear-and-simple-design Four integer extrema supply the complete box.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact integer comparisons need no floating expansion or epsilon.
   * @evidence contracts/common.md#meaningful-documentation States the unit-denominator precondition and limited rejection role.
   * @evidence contracts/modeling.md#spatial-conventions Bounds retain the same dimensionless common material unit as their points.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Bounds an existing construction triangle.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no mesh primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no join.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes its shell.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical dimension.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Changes no personal control.
   */
  private static bounds(points: MaterialTriangle["points"]): MaterialTriangle["bounds"] {
    if (points.some((point) => point[2] !== 1n))
      throw new Error("Material triangle bounds need the exact common integer unit.");
    const axis = (at: number, minimum: boolean): bigint =>
      points.reduce((value, point) =>
        minimum ? (point[at] < value ? point[at] : value) :
          (point[at] > value ? point[at] : value), points[0][at]);
    return [axis(0, true), axis(1, true), axis(0, false), axis(1, false)];
  }

  /**
   * Refine one positive exact material triangle at the original cross-band density.
   * Shared edge keys use original cut incidence and integer fractions.
   *
   * @evidence contracts/common.md#principled-implementation Uniform barycentric weights partition the complete triangle, preserving exact rational points and every original corner.
   * @evidence contracts/common.md#clear-and-simple-design Original cut edges own all shared refinement points; triangle identity owns interior points.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld, discarded cell or reduction of requested sampling density occurs.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes edge identity from exact homogeneous location.
   * @evidence contracts/modeling.md#emitted-geometry The complete barycentric lattice emits all of its positive triangles.
   * @evidence contracts/modeling.md#shared-boundaries Adjacent pieces use identical original-edge fractions.
   * @evidence contracts/modeling.md#spatial-conventions Weights are dimensionless and preserve the common material frame.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Refines an existing tissue domain.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes its offset shell.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical dimension.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Changes no personal control.
   */
  static refine(
    triangle: [MaterialCut, MaterialCut, MaterialCut],
    divisions: number,
    identity: string,
  ): [MaterialCut, MaterialCut, MaterialCut][] {
    if (!Number.isSafeInteger(divisions) || divisions < 1)
      throw new Error("Material refinement needs a positive integer density.");
    if (
      triangle.some((cut) => cut.point[2] <= 0n) ||
      Arithmetic.orientation(triangle[0].point, triangle[1].point, triangle[2].point) <= 0n
    )
      throw new Error("Material refinement needs one positive exact triangle.");
    const points = new Map<string, MaterialCut>();
    const point = (i: number, j: number): MaterialCut => {
      const address = i + ":" + j;
      const prior = points.get(address);
      if (prior !== undefined) return prior;
      const weights = [divisions - i - j, i, j];
      const unit = weights.findIndex((weight) => weight === divisions);
      if (unit >= 0) return triangle[unit];
      const zero = weights.findIndex((weight) => weight === 0);
      let key: string;
      if (zero >= 0) {
        const a = (zero + 1) % 3, b = (zero + 2) % 3;
        const forward = triangle[a].key < triangle[b].key;
        key = "r:e:" + JSON.stringify([
          triangle[forward ? a : b].key, triangle[forward ? b : a].key,
          weights[forward ? b : a], divisions,
        ]);
      } else key = "r:t:" + JSON.stringify([identity, i, j, divisions]);
      const [a, b, c] = triangle.map((cut) => cut.point);
      const homogeneous: MaterialCut["point"] = [0n, 0n, BigInt(divisions) * a[2] * b[2] * c[2]];
      for (const axis of [0, 1])
        homogeneous[axis] =
          BigInt(weights[0]) * a[axis] * b[2] * c[2] +
          BigInt(weights[1]) * b[axis] * a[2] * c[2] +
          BigInt(weights[2]) * c[axis] * a[2] * b[2];
      const cut = { key, point: homogeneous };
      points.set(address, cut);
      return cut;
    };
    const result: [MaterialCut, MaterialCut, MaterialCut][] = [];
    for (let i = 0; i < divisions; i++)
      for (let j = 0; j < divisions - i; j++) {
        result.push([point(i, j), point(i + 1, j), point(i, j + 1)]);
        if (i + j < divisions - 1)
          result.push([point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)]);
      }
    return result;
  }

}
