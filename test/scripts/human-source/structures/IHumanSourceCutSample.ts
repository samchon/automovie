/**
 * One frozen source-edge preimage: the point `(1 - t) * a + t * b` on the
 * source edge between two distinct vertices `a` and `b` (in the order the
 * owning crop recorded), or a resident source vertex when `a === b`
 * and `t === 0`. Indices address the subdivided MPFB skin; `t` is
 * dimensionless.
 *
 * @author Samchon
 */
export interface IHumanSourceCutSample {
  a: number;
  b: number;
  t: number;
}
