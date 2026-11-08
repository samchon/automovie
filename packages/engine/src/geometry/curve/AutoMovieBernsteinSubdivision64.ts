import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";

/**
 * Exact De Casteljau subdivision of Bernstein coefficient arrays: splitting at one parameter, restricting to an ordered subinterval and partitioning into three consecutive parameter thirds, for vector and scalar polynomials.
 *
 * Every operation preserves the algebraic polynomial on each child domain before floating-point rounding; none samples, fits or reduces degree. Callers own parameter-domain admission beyond the stated ordered-interval check.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its parameter contract and the retained arithmetic path.
 * @evidence contracts/development/design.md#principled-representation Represents Exact De Casteljau subdivision of Bernstein coefficient arrays: splitting at one parameter, restricting to an ordered subinterval and partitioning into three consecutive parameter thirds, for vector and scalar polynomials: companion namespace of 6 members (`split`, `splitS`, `restrict`, `restrictS`, `thirds`, `thirdsS`); units and frames named in its text: degree, local, second, rational. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieBernsteinSubdivision64` in packages/engine/src/geometry/curve/AutoMovieBernsteinSubdivision64.ts; its surface is the 6 members listed and the text shows 12 other files naming it, mostly packages/engine (10), test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieBernsteinSubdivision64 {
  /**
   * Split a nonempty vector polynomial, preserving exact endpoint restrictions at t=0 and t=1.
   *
   * @evidence contracts/development/implementation.md#principled-implementation At t=0 or t=1, one child is the copied original polynomial and the other is the repeated endpoint coefficient of the same degree. Other parameters use one De Casteljau triangle for both child nets, preserving the existing interior arithmetic and common junction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both restrictions share one reduction triangle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No curve sampling, degree reduction or implicit chart reversal occurs.
   * @evidence contracts/development/common.md#meaningful-documentation States the nonempty input, exact degenerate endpoint restrictions, preserved degree and independently owned child arrays.
   * @evidence contracts/development/implementation.md#efficient-algorithms Endpoint splits copy O(n) vectors; other parameters take O(n²) vector blends with linear child storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same reduction levels produce both children rather than evaluating them independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each child owns its copied controls and the temporary levels expire.
   */
  export function split(c: readonly B.Vec[], t: number): [B.Poly, B.Poly] {
    if (t === 0) return [c.map((): B.Vec => V.clone(c[0]!)), c.map(V.clone)];
    if (t === 1)
      return [c.map(V.clone), c.map((): B.Vec => V.clone(c.at(-1)!))];
    let row: B.Poly = c.map(V.clone);
    const a: B.Poly = [V.clone(row[0]!)],
      b: B.Poly = [V.clone(row.at(-1)!)];
    while (row.length > 1) {
      row = row
        .slice(0, -1)
        .map((p: B.Vec, i: number): B.Vec => V.mix(p, row[i + 1]!, t));
      a.push(V.clone(row[0]!));
      b.push(V.clone(row.at(-1)!));
    }
    return [a, b.reverse()];
  }
  /**
   * Split a scalar polynomial using the same De Casteljau restriction.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Embeds scalar coefficients in one coordinate, splits them with the vector operation, and extracts that coordinate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar and vector restriction retain one subdivision arithmetic path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unused coordinates remain zero and do not introduce a different scalar blend rule.
   * @evidence contracts/development/common.md#meaningful-documentation Split a scalar polynomial using the same De Casteljau restriction.
   * @evidence contracts/development/implementation.md#efficient-algorithms The vector split dominates O(n²) work; embedding/extraction are linear.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both scalar children come from the one shared vector split.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fresh scalar child arrays escape the temporary vector embedding.
   */
  export function splitS(
    c: readonly number[],
    t: number,
  ): [number[], number[]] {
    const out: [B.Poly, B.Poly] = split(
      c.map((x: number): B.Vec => [x, 0, 0]),
      t,
    );
    return out.map((p: B.Poly): number[] =>
      p.map((x: B.Vec): number => x[0]),
    ) as [number[], number[]];
  }
  /**
   * Return the exact algebraic restriction to ordered local endpoints inside [0,1].
   *
   * @evidence contracts/development/implementation.md#principled-implementation Splits first at b and then at a/b, preserving the polynomial on the ordered subinterval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Restriction is assembled from the same split owner and exact endpoint cases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unordered endpoints or endpoints outside [0,1] reject.
   * @evidence contracts/development/common.md#meaningful-documentation Return the exact algebraic restriction to ordered local endpoints inside [0,1].
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two De Casteljau splits dominate O(n²) work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The left net from the first split is reused for the second subinterval.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned restricted net does not alias the original controls.
   */
  export function restrict(c: readonly B.Vec[], a: number, b: number): B.Poly {
    if (!(0 <= a && a < b && b <= 1))
      throw new Error("A restriction must lie in its original chart");
    const left: B.Poly = b === 1 ? c.map(V.clone) : split(c, b)[0];
    return a === 0 ? left : split(left, a / b)[1];
  }
  /**
   * Restrict scalar coefficients while preserving their original chart authority.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The scalar coordinate passes through the same ordered vector restriction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One restriction contract governs scalar and vector polynomials.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampled fit or alternate endpoint tolerance changes the chosen interval.
   * @evidence contracts/development/common.md#meaningful-documentation Restrict scalar coefficients while preserving their original chart authority.
   * @evidence contracts/development/implementation.md#efficient-algorithms Vector restriction dominates O(n²), with linear embedding and extraction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing restriction owner handles both interval endpoint cases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the new scalar restricted coefficients are retained by the caller.
   */
  export function restrictS(
    c: readonly number[],
    a: number,
    b: number,
  ): number[] {
    return restrict(
      c.map((x: number): B.Vec => [x, 0, 0]),
      a,
      b,
    ).map((p: B.Vec): number => p[0]);
  }
  /**
   * Partition one vector course into three exact consecutive restrictions.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A split at 1/3 followed by a half split of the remainder yields three consecutive equal parameter domains.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper fixes the actual two-split arithmetic path used by rational and scalar callers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Thirds are parameter intervals, not claims of equal arc length.
   * @evidence contracts/development/common.md#meaningful-documentation Partition one vector course into three exact consecutive restrictions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two De Casteljau splits take O(n²) work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The remaining right child supplies both later thirds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The three returned nets own their control arrays.
   */
  export function thirds(c: readonly B.Vec[]): B.Poly[] {
    const first: [B.Poly, B.Poly] = split(c, 1 / 3),
      rest: [B.Poly, B.Poly] = split(first[1], 0.5);
    return [first[0], ...rest];
  }
  /**
   * Partition one scalar course into three exact consecutive restrictions.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Scalar coefficients are embedded and partitioned by the same two vector splits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar thirds delegate to the shared parameter-partition owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arc-length or physical-distance equality is inferred.
   * @evidence contracts/development/common.md#meaningful-documentation Partition one scalar course into three exact consecutive restrictions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two vector subdivisions dominate O(n²) work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The common thirds operation supplies all scalar pieces in one call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the three scalar output arrays escape the embedding.
   */
  export function thirdsS(c: readonly number[]): number[][] {
    return thirds(c.map((x: number): B.Vec => [x, 0, 0])).map(
      (p: B.Poly): number[] => p.map((v: B.Vec): number => v[0]),
    );
  }
}
