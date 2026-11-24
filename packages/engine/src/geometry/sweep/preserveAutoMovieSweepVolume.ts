import type {
  IAutoMoviePreserveSweepVolume,
  IAutoMovieSweep,
} from "@automovie/interface";

import { AutoMovieSpline } from "./AutoMovieSpline";
import { integrateAutoMovieSweepVolume } from "./integrateAutoMovieSweepVolume";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";
import { momentAutoMovieSweepSections } from "./momentAutoMovieSweepSections";
import { settleAutoMovieSweepVolume } from "./settleAutoMovieSweepVolume";

/**
 * Compile the volume-settled joint-scale update of a sealed sweep rig.
 *
 * Section moments and the authored sweep's rest-volume target are computed
 * once. Each pose updates the shared orientation first, then this writer
 * settles the joint factor and writes every registered scale slot. The
 * network's separate girth multipliers apply after that settlement, matching
 * the rig's existing ordering; the target is the authored sweep's volume before
 * girth correction.
 *
 * @param props.surface The immutable compiled authored sweep, metre units
 * @param props.orientation Current shared pose frames, updated before this
 *   writer
 * @param props.joints Which authored station indices are joints
 * @param props.scaleU Sealed registered scale parameters along u
 * @param props.girth Shared radial correction factors, refreshed in place by
 *   the owning rig
 * @param props.scales Receives the final scale per registered slot
 * @param props.writeFrame The rig's packed-frame serializer used during
 *   compilation
 * @returns A pose writer that updates the supplied scale buffer in place
 */
export function preserveAutoMovieSweepVolume(
  props: IAutoMoviePreserveSweepVolume.IProps,
): () => void {
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
  const settled: Float64Array = new Float64Array(scaleU.length);
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
    for (let k: number = 0; k < scaleU.length; ++k) {
      const value: number = at(scaleU[k]!) * girth[k]!;
      if (!(value > 0))
        throw new Error("posed sweep scale is not positive and finite");
      settled[k] = value;
    }
    scales.set(settled);
  };
}
