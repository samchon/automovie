/**
 * One frozen source-edge preimage: the point `(1 - t) * a + t * b` on the
 * undirected source edge `a < b`, or a resident source vertex when `a === b`
 * and `t === 0`. Indices address the subdivided MPFB skin; `t` is
 * dimensionless.
 */
export interface IHumanSourceCutSample {
  a: number;
  b: number;
  t: number;
}
