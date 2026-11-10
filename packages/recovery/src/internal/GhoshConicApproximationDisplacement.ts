/**
 * Intersect a Euclidean unit normal with a compactified bitangent conic family.
 * The barycentric point and normal use the endpoint tangent triangle; normal
 * coordinates have inverse-millimetre units. For rho=w/(1+w), the implicit
 * conic is (1-rho)^2*l1^2-4*rho^2*l0*l2=0. At rho=1 this is the union of the
 * triangle's two tangent edges, used only as a boundary search limit.
 *
 * A finite normal displacement is returned only for a unique intersection in
 * the positive tangent triangle. Two distinct valid roots remain unsupported;
 * a double algebraic root is one geometric intersection. No shape is emitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States barycentric units, compactified conic equation, degenerate search limit, unique-root contract and absent geometry output.
 * @evidence contracts/development/implementation.md#principled-implementation The rational quadratic's barycentric implicit equation is divided by (1+w)^2 before taking its w-to-infinity limit. Stable quadratic roots and determinant-roundoff bounds evaluate the original normal intersection without moving source points.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns only normal/conic arithmetic so the public fitter owns differential admission, search and coverage.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source fallback, artificial displacement, tangent replacement or merged distinct normal intersections is used. Roundoff tolerances scale with their actual arithmetic terms.
 * @evidence contracts/development/implementation.md#efficient-algorithms One quadratic, at most two candidate roots and three barycentric tests have constant time and space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Compactified factors and normalized coefficients are computed once and reused for root and triangle admission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous scalar operation retains no coordinates, callback, state or resources after return.
 */
export function GhoshConicApproximationDisplacement(
  coordinate: { value: readonly number[]; normal: readonly number[] },
  rho: number,
): number | undefined {
  const l: readonly number[] = coordinate.value;
  const n: readonly number[] = coordinate.normal;
  const conic: number = (1 - rho) ** 2;
  const triangle: number = 4 * rho ** 2;
  const normalScale: number = Math.max(
    Math.abs(n[0]!),
    Math.abs(n[1]!),
    Math.abs(n[2]!),
  );
  if (normalScale === 0 || !Number.isFinite(normalScale)) return undefined;

  // Scale d=L*t so all quadratic coefficients are dimensionless. This keeps
  // coefficient admission unchanged when the caller changes physical units.
  const length: number = 1 / normalScale;
  const m0: number = n[0]! * length;
  const m1: number = n[1]! * length;
  const m2: number = n[2]! * length;
  const a1: number = conic * m1 ** 2;
  const a2: number = triangle * m0 * m2;
  const b1: number = 2 * conic * l[1]! * m1;
  const b2: number = triangle * (l[0]! * m2 + l[2]! * m0);
  const c1: number = conic * l[1]! ** 2;
  const c2: number = triangle * l[0]! * l[2]!;
  const a: number = a1 - a2;
  const b: number = b1 - b2;
  const c: number = c1 - c2;
  const roundoff: number = 128 * Number.EPSILON;
  let roots: number[];
  if (Math.abs(a) <= roundoff * (Math.abs(a1) + Math.abs(a2))) {
    if (Math.abs(b) <= roundoff * (Math.abs(b1) + Math.abs(b2)))
      return Math.abs(c) <= roundoff * (Math.abs(c1) + Math.abs(c2))
        ? 0
        : undefined;
    roots = [-c / b];
  } else {
    const discriminant: number = b * b - 4 * a * c;
    const uncertainty: number = roundoff * (b * b + 4 * Math.abs(a * c));
    if (discriminant < -uncertainty) return undefined;
    if (discriminant <= 0) roots = [-b / (2 * a)];
    else {
      const stable: number =
        -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
      roots = stable === 0 ? [-b / (2 * a)] : [stable / a, c / stable];
    }
  }
  const valid: number[] = roots.filter(
    (t: number): boolean =>
      Number.isFinite(t) &&
      l.every((value: number, index: number): boolean => {
        const displacement: number =
          t * (index === 0 ? m0 : index === 1 ? m1 : m2);
        return (
          value + displacement >=
          -roundoff * (1 + Math.abs(value) + Math.abs(displacement))
        );
      }),
  );
  if (valid.length === 2 && valid[0] === valid[1]) valid.pop();
  return valid.length === 1 ? valid[0]! * length : undefined;
}
