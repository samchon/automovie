import { IAutoMovieSweep } from "@automovie/engine";

import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";

/** Gaussian smoothing spread per millimetre of subcutaneous fat. This conventional factor belongs to the existing relief tables' cage-feature calibration. */
const BLUR_PER_FAT: number = 1.5;

/** Smallest deep spread relative to the tabulated spread when its reference fat would otherwise explain the whole width. Grade: conventional. */
const LEAST_DEEP_SHARE: number = 0.4;

/** A compact feature band has the same crest curvature as a Gaussian of spread s when its half-width is sqrt(6) s: 1 - 3 d² / w² agrees with 1 - d² / (2 s²). */
const HALF_WIDTH_PER_DEVIATION: number = Math.sqrt(6);

/**
 * Compile the limb's superficial masses into the sweep's radial feature fields, before its girth constraints are solved.
 *
 * The existing tables describe broad muscle, bone and fat forms previously carried and judged as cage features. Each course retains every traced height and angle instead of replacing its longitudinal profile with a flat-topped elliptical patch. The reference fat's Gaussian blur is removed from its spread and the person's blur restored. Reciprocal height and spread changes preserve the Gaussian profile's area. The engine takes one width per feature, chosen at its greatest-height point, while the height conversion reads each course point's fat, so varying fat along a course remains an approximation. Its compact C2 band matches the Gaussian's crest curvature and retains about nine tenths of its area, as in the tables' original feature representation.
 *
 * Heights and widths are millimetres until converted once to the engine's metres. The engine measures feature distance with spine length and the query's local radius, an approximation to arc length on a noncircular section; these are the metric and sampling under which the existing tables were calibrated. Each junction collar's height is zero, rising over the next station interval, while pinned ring and collar controls remain the shared junction's. The network then fits the complete shaped station to its girth. The network's measured-row fit constrains the complete shaped perimeter independently of that profile approximation.
 *
 * @param plan The anatomical courses, stations and regional fat
 * @param at Each station's chord-length share on the sweep
 * @returns Radial features for the same sweep that supplies the control cage and its construction display
 */
export function fieldAutoMovieHumanLimbRelief(
  plan: IAutoMovieHumanLimbPlan,
  at: number[],
): IAutoMovieSweep.IFeature[] {
  const n: number = plan.stations.length;
  return plan.relief.map(
    (relief: IAutoMovieHumanLimbPlan.IRelief): IAutoMovieSweep.IFeature => {
      const shown: { width: number; heights: number[] } = show(relief);
      return {
        points: relief.points.map(
          (
            point: IAutoMovieHumanLimbPlan.IReliefPoint,
            k: number,
          ): IAutoMovieSweep.IFeaturePoint => ({
            at: share(at, point.at),
            angle: point.angle,
            offset: (shown.heights[k]! * fade(point.at, n)) / 1000,
          }),
        ),
        width: shown.width / 1000,
      };
    },
  );
}

/** The existing Gaussian fat-layer conversion; the fixed engine band takes its width at the crest. */
const show: (relief: IAutoMovieHumanLimbPlan.IRelief) => {
  width: number;
  heights: number[];
} = (
  relief: IAutoMovieHumanLimbPlan.IRelief,
): { width: number; heights: number[] } => {
  const spread: number = relief.spread;
  const blur: (thickness: number) => number = (thickness: number): number =>
    BLUR_PER_FAT * thickness;
  const deep: (point: IAutoMovieHumanLimbPlan.IReliefPoint) => number = (
    point: IAutoMovieHumanLimbPlan.IReliefPoint,
  ): number =>
    Math.max(
      LEAST_DEEP_SHARE * spread,
      Math.sqrt(Math.max(0, spread * spread - blur(point.reference) ** 2)),
    );
  const seen: (point: IAutoMovieHumanLimbPlan.IReliefPoint) => number = (
    point: IAutoMovieHumanLimbPlan.IReliefPoint,
  ): number => Math.hypot(deep(point), blur(point.fat));
  const crest: IAutoMovieHumanLimbPlan.IReliefPoint = relief.points.reduce(
    (
      best: IAutoMovieHumanLimbPlan.IReliefPoint,
      point: IAutoMovieHumanLimbPlan.IReliefPoint,
    ): IAutoMovieHumanLimbPlan.IReliefPoint =>
      Math.abs(point.height) > Math.abs(best.height) ? point : best,
  );
  return {
    width: HALF_WIDTH_PER_DEVIATION * seen(crest),
    heights: relief.points.map(
      (point: IAutoMovieHumanLimbPlan.IReliefPoint): number =>
        (point.height * Math.hypot(deep(point), blur(point.reference))) /
        seen(point),
    ),
  };
};

/** Zero through a junction collar and one at the next interior station; the same rule applies at both ends. */
const fade: (index: number, count: number) => number = (
  index: number,
  count: number,
): number =>
  Math.min(1, Math.max(0, index - 1), Math.max(0, count - 2 - index));

/** Spine parameter of a course point expressed in station-index space. */
const share: (at: number[], index: number) => number = (
  at: number[],
  index: number,
): number => {
  const i: number = Math.min(at.length - 2, Math.max(0, Math.floor(index)));
  const fraction: number = Math.min(1, Math.max(0, index - i));
  return at[i]! + (at[i + 1]! - at[i]!) * fraction;
};
