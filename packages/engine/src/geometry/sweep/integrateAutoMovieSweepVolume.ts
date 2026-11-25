/**
 * Sum the volume a sweep encloses from its section moments, its scale at the
 * step midpoints and its frames at every half step.
 *
 * Step `i` of `n` contributes `s^2 A <N, dC> + s^3 (M_x <N, dX> + M_y <N,
 * dY>)`: the area and moments from `momentAutoMovieSweepSections`, the scale
 * `s` and normal `N` at its midpoint, and the changes `dC`, `dX`, `dY` of the
 * origin and plane axes from its start to its end. This is the flux of every
 * section point's velocity through its plane, the swept-volume formula of
 * sweep-based deformation with the first-moment terms of an off-centre section.
 * It counts a region twice where neighbouring sections cross, so it measures
 * the sweep's own volume only while the surface has no self-intersection.
 *
 * @param moments Area, `M_x`, `M_y` per step, `3 n` numbers; only read.
 * @param scales Scale at each step's midpoint, `n` numbers; only read.
 * @param frames Frames at `u = j / (2 n)` for `j` from 0 to `2 n`, twelve
 *   numbers each as `IAutoMovieSweepTransport.frame` writes them; only read.
 * @returns Cubic metres.
 */
export const integrateAutoMovieSweepVolume: (
  moments: Float64Array,
  scales: Float64Array,
  frames: Float64Array,
) => number = (
  moments: Float64Array,
  scales: Float64Array,
  frames: Float64Array,
): number => {
  const steps: number = scales.length;
  let volume: number = 0;
  for (let i: number = 0; i < steps; ++i) {
    const a: number = 24 * i;
    const m: number = a + 12;
    const b: number = a + 24;
    const s: number = scales[i]!;
    volume +=
      s * s * moments[3 * i]! * change(frames, a, b, m, 0) +
      s *
        s *
        s *
        (moments[3 * i + 1]! * change(frames, a, b, m, 3) +
          moments[3 * i + 2]! * change(frames, a, b, m, 6));
  }
  return volume;
};

/**
 * The change from frame `a` to frame `b` of the vector at offset `k`, the
 * origin or an axis, against frame `m`'s normal.
 */
const change = (
  frames: Float64Array,
  a: number,
  b: number,
  m: number,
  k: number,
): number =>
  frames[m + 9]! * (frames[b + k]! - frames[a + k]!) +
  frames[m + 10]! * (frames[b + k + 1]! - frames[a + k + 1]!) +
  frames[m + 11]! * (frames[b + k + 2]! - frames[a + k + 2]!);
