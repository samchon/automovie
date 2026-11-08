import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";

/** Exactly the Cartesian local total2, independent of its generating basis. */
type Local = ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.jet>>;

/** World coordinates and physical station derivatives. */
type V = [number, number, number];

/** The same six world vectors consumed by either a loft or an original view. */
type World = { p: V; s: V; t: V; ss: V; st: V; tt: V };

/**
 * Apply the existing frame product rule to a complete local total2.
 *
 * The caller supplies all six local pairs and three complete nine-number
 * frame rows: origin/u/v value, first and second station derivatives.
 * Station derivatives share physical millimetres; phase units stay with the
 * caller's original or exactly mapped clock. Missing input is not zero.
 * Input getters and malformed-array exceptions propagate; a nonfinite
 * computed world reading raises the existing numeric admission error.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Differentiates P=o+xU+zW by the product rule using actual local and frame derivatives in the same physical station coordinate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The one unchanged arithmetic owner accepts local total2 from either the legacy basis or native source.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No missing derivative is supplied and no phase or station finite difference is used; lift and relief remain their separate owners.
 * @evidence contracts/development/common.md#meaningful-documentation f has three complete nine-component rows for value/first/second frame data; local station uses mm and phase follows the caller's clock, with unavailable inputs and numeric/getter failure semantics explicit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed arithmetic on two local coordinates and three world components, independent of layer/order counts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One product-rule pass supplies all six world vectors from the caller's prepared frame and local reading.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Six fresh output vectors and local frame slices belong to the call; no input is mutated or retained globally.
 */
export function AutoMovieLoftWorldJet(local: Local, f: number[][]): World {
  const [f0, f1, f2] = f as [number[], number[], number[]];
  const o: V[] = [
    [f0[0]!, f0[1]!, f0[2]!],
    [f1[0]!, f1[1]!, f1[2]!],
    [f2[0]!, f2[1]!, f2[2]!],
  ];
  const U: V[] = [
    [f0[3]!, f0[4]!, f0[5]!],
    [f1[3]!, f1[4]!, f1[5]!],
    [f2[3]!, f2[4]!, f2[5]!],
  ];
  const W: V[] = [
    [f0[6]!, f0[7]!, f0[8]!],
    [f1[6]!, f1[7]!, f1[8]!],
    [f2[6]!, f2[7]!, f2[8]!],
  ];
  const p: V = [0, 0, 0];
  const ds: V = [0, 0, 0];
  const dt: V = [0, 0, 0];
  const dss: V = [0, 0, 0];
  const dst: V = [0, 0, 0];
  const dtt: V = [0, 0, 0];
  for (let k: number = 0; k < 3; k++) {
    const u0: number = U[0]![k]!;
    const u1: number = U[1]![k]!;
    const u2: number = U[2]![k]!;
    const w0: number = W[0]![k]!;
    const w1: number = W[1]![k]!;
    const w2: number = W[2]![k]!;
    p[k] = o[0]![k]! + u0 * local.p[0] + w0 * local.p[1];
    ds[k] =
      o[1]![k]! +
      u0 * local.s[0] +
      u1 * local.p[0] +
      w0 * local.s[1] +
      w1 * local.p[1];
    dt[k] = u0 * local.t[0] + w0 * local.t[1];
    dss[k] =
      o[2]![k]! +
      u0 * local.ss[0] +
      2 * u1 * local.s[0] +
      u2 * local.p[0] +
      w0 * local.ss[1] +
      2 * w1 * local.s[1] +
      w2 * local.p[1];
    dst[k] =
      u0 * local.st[0] + u1 * local.t[0] + w0 * local.st[1] + w1 * local.t[1];
    dtt[k] = u0 * local.tt[0] + w0 * local.tt[1];
  }
  const out: World = {
    p,
    s: ds,
    t: dt,
    ss: dss,
    st: dst,
    tt: dtt,
  };
  if (
    !Object.values(out).every((row: V): boolean => row.every(Number.isFinite))
  )
    throw new AutoMovieLoftAdmissionError(
      "The actual frame/local product has no finite required world total2.",
    );
  return out;
}
