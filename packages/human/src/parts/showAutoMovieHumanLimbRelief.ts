import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";

/**
 * Spread the subcutaneous fat adds to a form's profile, per millimetre of fat over it: the skin over a muscle border lies on a layer that smooths it, modelled as a Gaussian blur of the deep profile whose standard deviation is this multiple of the layer's thickness, the layer spreading a step under it over more than its own depth. Grade: conventional, judged in the viewer on the lean and median adults.
 */
const BLUR_PER_FAT: number = 1.5;

/** Smallest deep spread as a share of the tabulated one, for a form so narrow that the reference layer alone would account for its width. Grade: conventional. */
const LEAST_DEEP_SHARE: number = 0.4;

/**
 * Half-width of a relief band per standard deviation of the Gaussian profile it replaces. The loft's band falls off as `(1 - (d / w)^2)^3`, which near its crest is `1 - 3 d^2 / w^2`, and a Gaussian `exp(-d^2 / (2 s^2))` is `1 - d^2 / (2 s^2)`, so `w = s √6` gives both the same crest curvature and about nine tenths of the Gaussian's cross-section area. Grade: derived.
 */
const HALF_WIDTH_PER_DEVIATION: number = Math.sqrt(6);

/**
 * How one relief shows on this person: its band's half-width and its height at each point of its course.
 *
 * The relief describes the form on the average adult's skin; the subcutaneous fat is a smoothing layer over the deep form. A Gaussian of standard deviation `d` blurred by one of `b` is a Gaussian of `√(d² + b²)` with the same area, `b` being 1.5 times the layer's thickness. The deep form is therefore the tabulated one with the reference layer's blur taken away, `d = √(s² − b_ref²)` (at least 0.4 `s`), and the person's layer is laid back over it: the form shows `√(d² + b²)` wide and its crest at `height · √(d² + b_ref²) / √(d² + b²)`, with the area the table gives. A lean person shows a border sharper and higher than the table, a fat one softer and lower, and the girth the form adds stays the same. The width is read at the point of greatest height, the heights at every point.
 *
 * @param relief The relief, on the average adult, with the fat over it on this person and on that adult
 * @returns The half-width of its band and its height at each point, millimetres
 */
export function showAutoMovieHumanLimbRelief(
  relief: IAutoMovieHumanLimbPlan.IRelief,
): { width: number; heights: number[] } {
  const s: number = relief.spread;
  const blur = (thickness: number): number => BLUR_PER_FAT * thickness;
  const deep = (p: IAutoMovieHumanLimbPlan.IReliefPoint): number =>
    Math.max(
      LEAST_DEEP_SHARE * s,
      Math.sqrt(Math.max(0, s * s - blur(p.reference) ** 2)),
    );
  const seen = (p: IAutoMovieHumanLimbPlan.IReliefPoint): number =>
    Math.hypot(deep(p), blur(p.fat));
  const crest: IAutoMovieHumanLimbPlan.IReliefPoint = relief.points.reduce(
    (best: IAutoMovieHumanLimbPlan.IReliefPoint, p: IAutoMovieHumanLimbPlan.IReliefPoint) =>
      Math.abs(p.height) > Math.abs(best.height) ? p : best,
  );
  return {
    width: HALF_WIDTH_PER_DEVIATION * seen(crest),
    heights: relief.points.map(
      (p: IAutoMovieHumanLimbPlan.IReliefPoint): number =>
        (p.height * Math.hypot(deep(p), blur(p.reference))) / seen(p),
    ),
  };
}
