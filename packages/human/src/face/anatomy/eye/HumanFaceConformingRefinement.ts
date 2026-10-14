import { HumanFaceConformingMaterialArithmetic as Arithmetic } from "./HumanFaceConformingMaterialArithmetic";
import type { IHumanFaceConformingMaterialCut as MaterialCut } from "./structures/IHumanFaceConformingMaterialCut";
import type { IHumanFaceConformingMaterialTriangle as MaterialTriangle } from "./structures/IHumanFaceConformingMaterialTriangle";

/**
 * Own the complete exact barycentric lattice of each original material
 * triangle. Original cut edges determine shared fractions; each triangle
 * determines its interior samples. The conforming sheet owns final seats and
 * assembly, so both metric offset sheets consume the same result.
 *
 * @evidence contracts/common.md#principled-implementation Exact barycentric lattices refine original material-domain triangles before source clipping, with original-edge fraction keys shared across adjacent parents.
 * @evidence contracts/common.md#clear-and-simple-design Refinement owns canonical integer material coordinates/incidence; the sheet owner retains native seating, coverage and final metric offset assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fractional points that are not divisible by the caller's common integer unit refuse rather than rounding coordinates or adding density after native clipping.
 * @evidence contracts/common.md#meaningful-documentation The class and members state pre-overlay original-domain refinement, shared edge fractions and downstream seat/assembly ownership.
 * @evidence contracts/performance.md#efficient-algorithms For T original triangles and D divisions, lattice generation/output is O(T*D squared) exact arithmetic and storage; the helper admits positive safe D but has no independent upper cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared original-edge keys retain common incidence and each triangle reuses a local point map across its emitted cells; both metric sheets consume the same compiled result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned material triangles are caller-owned; ordinal/point maps are call-local and grow with the requested lattice, without global resources.
 */
export class HumanFaceConformingRefinement {
  /**
   * Prepare exact triangle incidence and its exact common-unit material box.
   * The box only rejects disjoint candidates; exact points own all predicates.
   *
   * @evidence contracts/common.md#principled-implementation Three supplied original corner IDs are paired with their canonical keys/exact points and a unit-denominator broad-phase box.
   * @evidence contracts/common.md#clear-and-simple-design The adapter constructs one material triangle while the bounds helper owns exact common-unit extrema and caller callbacks own point/key lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The box only rejects disjoint candidates and cannot replace exact predicates or choose identity by coordinate equality.
   * @evidence contracts/common.md#meaningful-documentation The member states exact incidence, common-unit box and its conservative rejection role.
   * @evidence contracts/performance.md#efficient-algorithms Three callback lookups and four extrema over three points require bounded work, with exact integer comparison cost determined by bit widths.
   * @evidence contracts/performance.md#reuse-equivalent-work The same exact points and original corner copy serve later bounds, predicates and parent correspondence without rereading geometry.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns its key, original-corner copy, point container and bounds arrays; corners and callback-supplied exact point tuples remain borrowed. No callback lookup state or live resource is retained.
   */
  static triangle(
    corners: [number, number, number],
    point: (id: number) => MaterialCut["point"],
    key: (id: number) => string,
  ): MaterialTriangle {
    const points: MaterialTriangle["points"] = [
      point(corners[0]),
      point(corners[1]),
      point(corners[2]),
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
   * @evidence contracts/common.md#principled-implementation Original material triangles are subdivided under a caller-provided common integer unit containing D, retaining exact original-parent and shared fraction incidence.
   * @evidence contracts/common.md#clear-and-simple-design One key-to-ordinal map coordinates all refined parents while per-parent refinement supplies exact cuts and the result owns compiled triangles.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonintegral common-unit coordinates refuse instead of binary64 rounding; no native-clipped polygon gets a second refinement factor.
   * @evidence contracts/common.md#meaningful-documentation The member states pre-clipping density, unit-denominator output and original edge-based identity.
   * @evidence contracts/performance.md#efficient-algorithms T parents at D divisions produce T*D squared triangles and proportional key/ordinal work; exact integer arithmetic adds operand-bit-width cost.
   * @evidence contracts/performance.md#reuse-equivalent-work One compile-local canonical-key map reuses shared edge residents across parents and each parent's supplied points are reused for its lattice.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Result triangles are caller-owned; ordinal maps and per-parent cuts expire while output memory grows with actual requested refinement, without an independent D cap.
   */
  static compile(
    domain: readonly MaterialTriangle[],
    divisions: number,
  ): MaterialTriangle[] {
    const ordinals: Map<string, number> = new Map<string, number>();
    for (const triangle of domain)
      triangle.keys.forEach(
        (key: string, at: number): Map<string, number> =>
          ordinals.set(key, triangle.corners[at]),
      );
    let next: number = Math.max(-1, ...ordinals.values()) + 1;
    const result: MaterialTriangle[] = [];
    for (const parent of domain) {
      const original: [MaterialCut, MaterialCut, MaterialCut] = parent.keys.map(
        (key: string, at: number): MaterialCut => ({
          key,
          point: parent.points[at],
        }),
      ) as [MaterialCut, MaterialCut, MaterialCut];
      for (const cuts of this.refine(
        original,
        divisions,
        JSON.stringify(parent.originalCorners),
      )) {
        const corners: [number, number, number] = cuts.map(
          (cut: MaterialCut): number => {
            let ordinal: number | undefined = ordinals.get(cut.key);
            if (ordinal === undefined)
              ordinals.set(cut.key, (ordinal = next++));
            return ordinal;
          },
        ) as [number, number, number];
        const points: [
          [bigint, bigint, bigint],
          [bigint, bigint, bigint],
          [bigint, bigint, bigint],
        ] = cuts.map((cut: MaterialCut): MaterialCut["point"] => {
          const [x, y, denominator]: [bigint, bigint, bigint] = cut.point;
          if (x % denominator !== 0n || y % denominator !== 0n)
            throw new Error(
              "Material refinement needs its exact common integer unit.",
            );
          return [x / denominator, y / denominator, 1n];
        }) as MaterialTriangle["points"];
        result.push({
          corners,
          points,
          keys: cuts.map((cut: MaterialCut): string => cut.key) as [
            string,
            string,
            string,
          ],
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
   * Three unit-denominator points supply exact minima/maxima before intersection predicates; a non-unit denominator refuses. The box rejects disjoint candidates without certifying overlap or rounding the exact points.
   *
   * Four three-coordinate scans have fixed BigInt comparison count. The triangle retains their four-extrema tuple for source/grid candidates; this helper retains no point array or resource.
   */
  private static bounds(
    points: MaterialTriangle["points"],
  ): MaterialTriangle["bounds"] {
    if (
      points.some((point: [bigint, bigint, bigint]): boolean => point[2] !== 1n)
    )
      throw new Error(
        "Material triangle bounds need the exact common integer unit.",
      );
    const axis: (at: number, minimum: boolean) => bigint = (
      at: number,
      minimum: boolean,
    ): bigint =>
      points.reduce(
        (value: bigint, point: [bigint, bigint, bigint]): bigint =>
          minimum
            ? point[at] < value
              ? point[at]
              : value
            : point[at] > value
              ? point[at]
              : value,
        points[0][at],
      );
    return [axis(0, true), axis(1, true), axis(0, false), axis(1, false)];
  }

  /**
   * Refine one positive exact material triangle at the original cross-band density.
   * Shared edge keys use original cut incidence and integer fractions.
   *
   * @evidence contracts/common.md#principled-implementation Positive exact parent orientation and barycentric integer weights construct the complete D-division lattice with canonical original-edge fraction and parent-interior identities.
   * @evidence contracts/common.md#clear-and-simple-design A call-local point map shares lattice vertices between adjacent child cells before returning the exact cut triples.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid D/nonpositive denominators/orientation refuse; boundary keys come from original incidence rather than coordinate coincidence or tolerance welding.
   * @evidence contracts/common.md#meaningful-documentation The member states positive exact triangle, original density and shared fraction keys.
   * @evidence contracts/performance.md#efficient-algorithms D squared child triangles and O(D squared) lattice points dominate time/space; BigInt interpolation cost depends on coordinate/denominator sizes and no independent D upper cap is enforced here.
   * @evidence contracts/performance.md#reuse-equivalent-work The address-keyed point map reuses each barycentric station for all child cells that reference it, including original corner identity reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned cut triples share their caller-owned point records; the local map expires and no source/refinement cache or handle survives.
   */
  static refine(
    triangle: [MaterialCut, MaterialCut, MaterialCut],
    divisions: number,
    identity: string,
  ): [MaterialCut, MaterialCut, MaterialCut][] {
    if (!Number.isSafeInteger(divisions) || divisions < 1)
      throw new Error("Material refinement needs a positive integer density.");
    if (
      triangle.some((cut: MaterialCut): boolean => cut.point[2] <= 0n) ||
      Arithmetic.orientation(
        triangle[0].point,
        triangle[1].point,
        triangle[2].point,
      ) <= 0n
    )
      throw new Error("Material refinement needs one positive exact triangle.");
    const points: Map<string, MaterialCut> = new Map<string, MaterialCut>();
    const point: (i: number, j: number) => MaterialCut = (
      i: number,
      j: number,
    ): MaterialCut => {
      const address: string = i + ":" + j;
      const prior: MaterialCut | undefined = points.get(address);
      if (prior !== undefined) return prior;
      const weights: number[] = [divisions - i - j, i, j];
      const unit: number = weights.findIndex(
        (weight: number): boolean => weight === divisions,
      );
      if (unit >= 0) return triangle[unit];
      const zero: number = weights.findIndex(
        (weight: number): boolean => weight === 0,
      );
      let key: string;
      if (zero >= 0) {
        const a: number = (zero + 1) % 3,
          b: number = (zero + 2) % 3;
        const forward: boolean = triangle[a].key < triangle[b].key;
        key =
          "r:e:" +
          JSON.stringify([
            triangle[forward ? a : b].key,
            triangle[forward ? b : a].key,
            weights[forward ? b : a],
            divisions,
          ]);
      } else key = "r:t:" + JSON.stringify([identity, i, j, divisions]);
      const [a, b, c]: [bigint, bigint, bigint][] = triangle.map(
        (cut: MaterialCut): [bigint, bigint, bigint] => cut.point,
      );
      const homogeneous: MaterialCut["point"] = [
        0n,
        0n,
        BigInt(divisions) * a[2] * b[2] * c[2],
      ];
      for (const axis of [0, 1])
        homogeneous[axis] =
          BigInt(weights[0]) * a[axis] * b[2] * c[2] +
          BigInt(weights[1]) * b[axis] * a[2] * c[2] +
          BigInt(weights[2]) * c[axis] * a[2] * b[2];
      const cut: { key: string; point: [bigint, bigint, bigint] } = {
        key,
        point: homogeneous,
      };
      points.set(address, cut);
      return cut;
    };
    const result: [MaterialCut, MaterialCut, MaterialCut][] = [];
    for (let i: number = 0; i < divisions; i++)
      for (let j: number = 0; j < divisions - i; j++) {
        result.push([point(i, j), point(i + 1, j), point(i, j + 1)]);
        if (i + j < divisions - 1)
          result.push([point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)]);
      }
    return result;
  }
}
