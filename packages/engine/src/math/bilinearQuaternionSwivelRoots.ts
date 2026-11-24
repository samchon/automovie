import { binary64SumProductsSign } from "./binary64SumProductsSign";
import { wrapDegrees } from "./wrapDegrees";

/**
 * Propose the isolated swivels where a quaternion circle has two-axis rank one.
 * The inputs are C^T qCos and C^T qSin, in mask 0,1,2,3 order, for
 * q(psi)=qCos_cos(psi/2)+qSin_sin(psi/2). The caller supplies unit coefficient
 * columns with C1.C2=cross=-C0.C3 and all other cross-dots zero.
 *
 * Returns degrees in [-180,180), [] for a separated no-root polynomial, "all"
 * for an exactly zero rank polynomial, or null when finite arithmetic cannot
 * separate the cases or the Gram matrix is singular/ill-conditioned. These are
 * proposals: the consumer still owns angle limits, forward kinematics, goal
 * acceptance and its fallback. This does not minimize a weighted objective.
 */
export function bilinearQuaternionSwivelRoots(
  a: readonly [number, number, number, number],
  b: readonly [number, number, number, number],
  cross: number,
): readonly number[] | "all" | null {
  if (
    Math.abs(cross) >= 1
  )
    return null;

  // The Gram eigenvalues are 1 +/- cross. Refuse when coefficient rounding
  // can dominate its small eigenvalue instead of declaring a rank identity.
  if (1 - Math.abs(cross) <= 64 * Number.EPSILON * (1 + Math.abs(cross)))
    return null;

  const scale: number = Math.max(
    Math.abs(a[0]),
    Math.abs(a[1]),
    Math.abs(a[2]),
    Math.abs(a[3]),
    Math.abs(b[0]),
    Math.abs(b[1]),
    Math.abs(b[2]),
    Math.abs(b[3]),
  );
  if (scale === 0) return null;

  // G has the (0,3) off-diagonal -cross and (1,2) off-diagonal cross.
  // The map below is (1-cross^2)*G^-1, whose common nonzero factor cannot
  // change the determinant's zeros and need not be divided out.
  const A: readonly [number, number, number, number] | null = adjugate(
    a,
    scale,
    cross,
  );
  const B: readonly [number, number, number, number] | null = adjugate(
    b,
    scale,
    cross,
  );
  if (A === null || B === null) return null;

  // D(y)=y0*y3-y1*y2. With t=psi/2, D(A*cos(t)+B*sin(t)) is
  // p*cos(t)^2+r*cos(t)*sin(t)+q*sin(t)^2=u+v*cos(psi)+w*sin(psi).
  const p: number = A[0] * A[3] - A[1] * A[2];
  const q: number = B[0] * B[3] - B[1] * B[2];
  const r: number = A[0] * B[3] + B[0] * A[3] - A[1] * B[2] - B[1] * A[2];
  const u: number = (p + q) / 2;
  const v: number = (p - q) / 2;
  const w: number = r / 2;
  const maximum: number = Math.max(Math.abs(u), Math.abs(v), Math.abs(w));

  // Scaled inputs have magnitude <=1 and mapped entries <=2. A division has
  // absolute error <=epsilon, and each mapped entry's division/product/sum
  // error is <=4*epsilon. Propagating those through products <=4 and the at
  // most four determinant terms gives <48*epsilon per final coefficient;
  // 64*epsilon also encloses subnormal rounding and higher-order error terms.
  const error: number = 64 * Number.EPSILON;
  if (maximum <= error) {
    if (
      rankSign(a, a, cross) === 0 &&
      rankSign(b, b, cross) === 0 &&
      rankSign(a, b, cross) === 0
    )
      return "all";
    return null;
  }

  const U: number = u / maximum;
  const V: number = v / maximum;
  const W: number = w / maximum;
  const radius: number = Math.hypot(V, W);

  // hypot is Lipschitz in its two inputs. This outward separation includes
  // coefficient error, normalization and the final scalar operations. A case
  // that could be tangent is unresolved; acos is never clamped into a root.
  const separation: number = (4 * error) / maximum + 8 * Number.EPSILON;
  if (Math.abs(U) > radius + separation) return [];
  if (radius === 0 || Math.abs(U) >= radius - separation) return null;

  const phase: number = Math.atan2(W, V);
  const offset: number = Math.acos(-U / radius);
  const toDegrees: number = 180 / Math.PI;
  const first: number = wrapDegrees((phase - offset) * toDegrees);
  const second: number = wrapDegrees((phase + offset) * toDegrees);
  return first === second ? [first] : [first, second];
}

/** Apply the two Gram block adjugates after scaling, without their divisor. */
function adjugate(
  d: readonly [number, number, number, number],
  scale: number,
  cross: number,
): readonly [number, number, number, number] | null {
  const d0: number = d[0] / scale;
  const d1: number = d[1] / scale;
  const d2: number = d[2] / scale;
  const d3: number = d[3] / scale;

  // A common scale preserves the circle parameter. Losing a nonzero input
  // on division cannot be interpreted as an exact zero coefficient.
  if (
    (d[0] !== 0 && d0 === 0) ||
    (d[1] !== 0 && d1 === 0) ||
    (d[2] !== 0 && d2 === 0) ||
    (d[3] !== 0 && d3 === 0)
  )
    return null;

  return [d0 + cross * d3, d1 - cross * d2, d2 - cross * d1, d3 + cross * d0];
}

/**
 * Exact sign of the determinant form after the two Gram block adjugates. For
 * equal vectors this is twice D(Ta); otherwise it is the circle's mixed
 * coefficient. Expansion uses original binary64 factors, without rounding Ta.
 */
function rankSign(
  a: readonly [number, number, number, number],
  b: readonly [number, number, number, number],
  cross: number,
): -1 | 0 | 1 | undefined {
  const terms: number[][] = [
    [a[0], b[3]],
    [a[3], b[0]],
    [-a[1], b[2]],
    [-a[2], b[1]],
    [cross, cross, a[0], b[3]],
    [cross, cross, a[3], b[0]],
    [-cross, cross, a[1], b[2]],
    [-cross, cross, a[2], b[1]],
  ];
  for (let index: number = 0; index < 4; index++)
    terms.push([2, cross, a[index]!, b[index]!]);
  return binary64SumProductsSign(terms);
}
