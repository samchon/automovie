import { AutoMovieSpline } from "./AutoMovieSpline";
import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepOrientation } from "./IAutoMovieSweepOrientation";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import { integrateAutoMovieSweepVolume } from "./integrateAutoMovieSweepVolume";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";
import { momentAutoMovieSweepSections } from "./momentAutoMovieSweepSections";
import { settleAutoMovieSweepVolume } from "./settleAutoMovieSweepVolume";

/**
 * Compile the volume-settled joint-scale update of a sealed sweep rig.
 *
 * Section moments and the authored sweep's rest-volume target are computed once. Each pose updates the shared orientation first, then this writer settles the joint factor and writes every registered scale slot. The network's separate girth multipliers apply after that settlement, matching the rig's existing ordering; the target is the authored sweep's volume before girth correction.
 *
 * @param props.surface The immutable compiled authored sweep, metre units
 * @param props.orientation Current shared pose frames, updated before this writer
 * @param props.joints Which authored station indices are joints
 * @param props.scaleU Sealed registered scale parameters along u
 * @param props.girth Shared radial correction factors, refreshed in place by the owning rig
 * @param props.scales Receives the final scale per registered slot
 * @param props.writeFrame The rig's packed-frame serializer used during compilation
 * @returns A pose writer that updates the supplied scale buffer in place
 *
 * @evidence contracts/common.md#principled-implementation The pose-invariant section moments and posed flux integral used by the existing sweep-volume operator, with the shared secant method settling the same authored rest-volume target.
 * @evidence contracts/common.md#clear-and-simple-design Owns the volume buffers and scale profile separately from the sweep's frame registration, bone resweep and girth setter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps the existing quadrature, spline, secant and girth ordering unchanged; no fixture, geometry or consumer case is introduced.
 * @evidence contracts/common.md#meaningful-documentation States the target's scope, caller update order, in-place result and shared buffer ownership.
 * @evidence contracts/performance.md#efficient-algorithms Compile uses 400 by 256 section-profile queries and 801 rest planes plus O(K) knot preparation for K combined scale/station knots. Each pose reads 801 planes and at most ten volume trials; a trial fits the K-knot spline and sums 400 volume samples. It allocates nothing per pose.
 * @evidence contracts/performance.md#reuse-equivalent-work Section moments, authored rest target and knot layout are immutable per compiled sweep and computed once. The returned writer reads the current shared orientation and current girth multipliers on each pose, so it never reuses an old pose's scale output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owning rig retains 1200 moment numbers, 801 packed planes, 400 midpoint scales and O(K) profile/work arrays with this closure. The supplied scale/girth buffers and orientation are shared with that same rig and released with it; caller registration is sealed before these references are captured.
 */
export function preserveAutoMovieSweepVolume(props: {
  surface: IAutoMovieSweepSurface;
  orientation: IAutoMovieSweepOrientation;
  joints: readonly boolean[];
  scaleU: readonly number[];
  girth: Float64Array;
  scales: Float64Array;
  writeFrame: (
    frame: IAutoMovieSweepFrame,
    out: Float64Array,
    at: number,
  ) => void;
}): () => void {
  const {
    surface,
    orientation,
    joints,
    scaleU,
    girth,
    scales,
    writeFrame,
  }: typeof props = props;
  const sweep: IAutoMovieSweep = surface.sweep;
  const moments: Float64Array = momentAutoMovieSweepSections(surface);
  const steps: number = moments.length / 3;
  const planes: Float64Array = new Float64Array(12 * (2 * steps + 1));
  const middles: Float64Array = new Float64Array(steps);
  // the rest volume, from the same moments with the rest planes and scale, as `measureAutoMovieSweepVolume` sums it
  for (let j: number = 0; j <= 2 * steps; ++j)
    writeFrame(surface.frame(j / (2 * steps)), planes, 12 * j);
  for (let i: number = 0; i < steps; ++i)
    middles[i] = surface.scale((i + 0.5) / steps);
  const target: number = integrateAutoMovieSweepVolume(
    moments,
    middles,
    planes,
  );
  const previous: ((u: number) => number) | null =
    sweep.scale === undefined
      ? null
      : interpolateAutoMovieSpline({
          knots: sweep.scale.map((k: IAutoMovieSweep.IKnot): number => k.at),
          values: sweep.scale.map(
            (k: IAutoMovieSweep.IKnot): number => k.value,
          ),
        });
  const knots: Float64Array = Float64Array.from(
    [
      ...new Set([
        0,
        1,
        ...sweep.stations.map((st: IAutoMovieSweep.IStation): number => st.at),
        ...(sweep.scale ?? []).map((k: IAutoMovieSweep.IKnot): number => k.at),
      ]),
    ].sort((a: number, b: number): number => a - b),
  );
  const jointAt: Set<number> = new Set(
    sweep.stations
      .filter((_: IAutoMovieSweep.IStation, k: number): boolean => joints[k]!)
      .map((st: IAutoMovieSweep.IStation): number => st.at),
  );
  const base: Float64Array = Float64Array.from(
    knots,
    (at: number): number => previous?.(at) ?? 1,
  );
  const joint: Uint8Array = Uint8Array.from(knots, (at: number): number =>
    jointAt.has(at) ? 1 : 0,
  );
  const values: Float64Array = new Float64Array(knots.length);
  const curvature: Float64Array = new Float64Array(knots.length);
  const work: Float64Array = new Float64Array(7 * knots.length + 17);
  let tension: number = 0;
  const profile: (factor: number) => void = (factor: number): void => {
    for (let k: number = 0; k < knots.length; ++k)
      values[k] = base[k]! * (joint[k] === 1 ? factor : 1);
    tension = AutoMovieSpline.fit(
      knots,
      values,
      knots.length,
      0,
      curvature,
      work,
    );
  };
  const at: (u: number) => number = (u: number): number =>
    AutoMovieSpline.evaluate(
      knots,
      values,
      curvature,
      knots.length,
      0,
      tension,
      u,
    );
  const volume: (factor: number) => number = (factor: number): number => {
    profile(factor);
    for (let i: number = 0; i < steps; ++i) middles[i] = at((i + 0.5) / steps);
    return integrateAutoMovieSweepVolume(moments, middles, planes);
  };
  return (): void => {
    for (let j: number = 0; j <= 2 * steps; ++j)
      orientation.frame(j / (2 * steps), planes, 12 * j);
    profile(settleAutoMovieSweepVolume(target, volume));
    for (let k: number = 0; k < scaleU.length; ++k)
      scales[k] = at(scaleU[k]!) * girth[k]!;
  };
}
