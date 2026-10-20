import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

/** Evaluate a rational Hermite transfinite chart and its analytic first partials.
 * Four boundary functions carry position, along-edge tangent, cross derivative
 * and its along-edge derivative, in bottom/right/top/left order. Cross derivatives
 * always follow increasing chart u or v, independently of boundary walk. Corner
 * positions and first derivatives must be compatible; mixed derivatives may
 * differ. Distance-weighted Gregory twists reconcile those mixed corner values.
 * The result is rational, with removable corner limits, and is not a bicubic.
 *
 * @evidence contracts/common.md#principled-implementation Adds the two Hermite boundary interpolants and subtracts their corner tensor; each mixed corner entry is the rational distance blend of its two incident mixed derivatives, differentiated by the quotient rule.
 * @evidence contracts/common.md#clear-and-simple-design One stateless evaluator consumes boundary jets without owning anatomy, topology, sampling or rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No corner row overwrite, finite-difference normal, coefficient fit or cubic-equivalence claim replaces the rational field.
 * @evidence contracts/common.md#meaningful-documentation States side order, cross-derivative direction, caller corner compatibility, rational degree distinction and removable corner handling.
 * @evidence contracts/performance.md#efficient-algorithms Twelve boundary evaluations (four at the query coordinates and eight at endpoints) and a fixed sixteen-entry Hermite corner sum give constant work per query.
 * @evidence contracts/performance.md#reuse-equivalent-work Each boundary sample supplies all four jet values; the same blended twist supplies position and both derivatives.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All basis, corner and vector arrays are query-local; only three finite vectors escape, with no cache or external handle.
 */
export function evaluateAutoMovieHermiteGregory64(
  edges: readonly ((t: number) => {
    point: M.V;
    tangent: M.V;
    cross: M.V;
    crossTangent: M.V;
  })[],
  u: number,
  v: number,
): { point: M.V; du: M.V; dv: M.V } {
  if (
    edges.length !== 4 ||
    !Number.isFinite(u) ||
    !Number.isFinite(v) ||
    u < 0 ||
    u > 1 ||
    v < 0 ||
    v > 1
  )
    throw new Error(
      "Four compatible boundary jet fields on the unit square required",
    );
  type Jet = ReturnType<(typeof edges)[number]>;
  const atU: Jet[] = [edges[0]!(u), edges[2]!(u)];
  const atV: Jet[] = [edges[3]!(v), edges[1]!(v)];
  const horizontal: Jet[][] = [0, 2].map((side: number): Jet[] => [
    edges[side]!(0),
    edges[side]!(1),
  ]);
  const vertical: Jet[][] = [3, 1].map((side: number): Jet[] => [
    edges[side]!(0),
    edges[side]!(1),
  ]);
  const hu: number[][] = basis(u),
    hv: number[][] = basis(v);
  const result: { point: M.V; du: M.V; dv: M.V } = {
    point: [0, 0, 0],
    du: [0, 0, 0],
    dv: [0, 0, 0],
  };
  for (let end: number = 0; end < 2; ++end) {
    const i: number = 2 * end;
    add(atU[end]!.point, hv[0]![i]!, 0, hv[1]![i]!);
    add(atU[end]!.cross, hv[0]![i + 1]!, 0, hv[1]![i + 1]!);
    result.du = M.add(
      result.du,
      M.add(
        M.scale(atU[end]!.tangent, hv[0]![i]!),
        M.scale(atU[end]!.crossTangent, hv[0]![i + 1]!),
      ),
    );
    add(atV[end]!.point, hu[0]![i]!, hu[1]![i]!, 0);
    add(atV[end]!.cross, hu[0]![i + 1]!, hu[1]![i + 1]!, 0);
    result.dv = M.add(
      result.dv,
      M.add(
        M.scale(atV[end]!.tangent, hu[0]![i]!),
        M.scale(atV[end]!.crossTangent, hu[0]![i + 1]!),
      ),
    );
  }
  for (let x: number = 0; x < 2; ++x)
    for (let y: number = 0; y < 2; ++y) {
      const i: number = 2 * x,
        j: number = 2 * y;
      subtract(horizontal[y]![x]!.point, i, j);
      subtract(vertical[x]![y]!.cross, i + 1, j);
      subtract(horizontal[y]![x]!.cross, i, j + 1);
      const a: number = x === 0 ? u : 1 - u;
      const b: number = y === 0 ? v : 1 - v;
      const denominator: number = a + b;
      if (denominator === 0) continue; // Its Hermite product and both first derivatives vanish.
      const side: M.V = vertical[x]![y]!.crossTangent;
      const bottom: M.V = horizontal[y]![x]!.crossTangent;
      const twist: M.V = M.scale(
        M.add(M.scale(side, a), M.scale(bottom, b)),
        1 / denominator,
      );
      const du: M.V = M.scale(
        M.sub(side, twist),
        (x === 0 ? 1 : -1) / denominator,
      );
      const dv: M.V = M.scale(
        M.sub(bottom, twist),
        (y === 0 ? 1 : -1) / denominator,
      );
      subtract(twist, i + 1, j + 1);
      result.du = M.sub(
        result.du,
        M.scale(du, hu[0]![i + 1]! * hv[0]![j + 1]!),
      );
      result.dv = M.sub(
        result.dv,
        M.scale(dv, hu[0]![i + 1]! * hv[0]![j + 1]!),
      );
    }
  return result;

  /** Hermite endpoint position/derivative bases and their first derivatives. */
  function basis(t: number): number[][] {
    const t2: number = t * t,
      t3: number = t2 * t;
    return [
      [2 * t3 - 3 * t2 + 1, t3 - 2 * t2 + t, -2 * t3 + 3 * t2, t3 - t2],
      [6 * t2 - 6 * t, 3 * t2 - 4 * t + 1, -6 * t2 + 6 * t, 3 * t2 - 2 * t],
    ];
  }
  /** Accumulate one vector contribution and its explicit product derivatives. */
  function add(p: M.V, weight: number, du: number, dv: number): void {
    result.point = M.add(result.point, M.scale(p, weight));
    result.du = M.add(result.du, M.scale(p, du));
    result.dv = M.add(result.dv, M.scale(p, dv));
  }
  /** The corner tensor uses the same basis and derivatives as both interpolants. */
  function subtract(p: M.V, i: number, j: number): void {
    add(
      p,
      -hu[0]![i]! * hv[0]![j]!,
      -hu[1]![i]! * hv[0]![j]!,
      -hu[0]![i]! * hv[1]![j]!,
    );
  }
}
