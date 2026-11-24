import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftWorldJetLocal,
  IAutoMovieLoftWorldJetWorld,
} from "@automovie/interface";


/**
 * Apply the existing frame product rule to a complete local total2.
 *
 * The caller supplies all six local pairs and three complete nine-number frame
 * rows: origin/u/v value, first and second station derivatives. Station
 * derivatives share physical millimetres; phase units stay with the caller's
 * original or exactly mapped clock. Missing input is not zero. Input getters
 * and malformed-array exceptions propagate; a nonfinite computed world reading
 * raises the existing numeric admission error.
 */
export function AutoMovieLoftWorldJet(
  local: IAutoMovieLoftWorldJetLocal,
  f: number[][],
): IAutoMovieLoftWorldJetWorld {
  const [f0, f1, f2] = f as [number[], number[], number[]];
  const o: AutoMovieVector3Tuple[] = [
    [f0[0]!, f0[1]!, f0[2]!],
    [f1[0]!, f1[1]!, f1[2]!],
    [f2[0]!, f2[1]!, f2[2]!],
  ];
  const U: AutoMovieVector3Tuple[] = [
    [f0[3]!, f0[4]!, f0[5]!],
    [f1[3]!, f1[4]!, f1[5]!],
    [f2[3]!, f2[4]!, f2[5]!],
  ];
  const W: AutoMovieVector3Tuple[] = [
    [f0[6]!, f0[7]!, f0[8]!],
    [f1[6]!, f1[7]!, f1[8]!],
    [f2[6]!, f2[7]!, f2[8]!],
  ];
  const p: AutoMovieVector3Tuple = [0, 0, 0];
  const ds: AutoMovieVector3Tuple = [0, 0, 0];
  const dt: AutoMovieVector3Tuple = [0, 0, 0];
  const dss: AutoMovieVector3Tuple = [0, 0, 0];
  const dst: AutoMovieVector3Tuple = [0, 0, 0];
  const dtt: AutoMovieVector3Tuple = [0, 0, 0];
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
  const out: IAutoMovieLoftWorldJetWorld = {
    p,
    s: ds,
    t: dt,
    ss: dss,
    st: dst,
    tt: dtt,
  };
  return out;
}
