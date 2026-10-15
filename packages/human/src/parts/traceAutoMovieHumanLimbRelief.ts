import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";

/** Even steps a form's course is traced in between its ends, before its peak is added. */
const STEPS: number = 8;

/**
 * Half-width of a relief band per standard deviation of the Gaussian profile it replaces. The loft's band falls off as `(1 - (d / w)^2)^3`, which near its crest is `1 - 3 d^2 / w^2`, and a Gaussian `exp(-d^2 / (2 s^2))` is `1 - d^2 / (2 s^2)`, so `w = s √6` gives both the same crest curvature and about nine tenths of the Gaussian's cross-section area. Grade: derived.
 */
const HALF_WIDTH_PER_DEVIATION: number = Math.sqrt(6);

/**
 * Spread the subcutaneous fat adds to a form's profile, per millimetre of fat over it: the skin over a muscle border lies on a layer that smooths it, modelled as a Gaussian blur of the deep profile whose standard deviation is this multiple of the layer's thickness, the layer spreading a step under it over more than its own depth. Grade: conventional, judged in the viewer on the lean and median adults.
 */
const BLUR_PER_FAT: number = 1.5;

/** Smallest deep spread as a share of the tabulated one, for a form so narrow that the reference layer alone would account for its width. Grade: conventional. */
const LEAST_DEEP_SHARE: number = 0.4;

/**
 * Trace one superficial form as a relief course of a limb's loft.
 *
 * A form is given on an anatomical scale of its own, such as arm levels or the fraction of a segment's length, rising from `from` to its fullest at `peak` and fading by `to`. The stations' levels on the same scale place it: each traced level becomes a point in station-index space by linear interpolation between the two stations around it, so the course lands on the limb wherever the loft puts its rows. The part of the course beyond the limb's first or last station is dropped.
 *
 * The form's size and its definition are separate. `height` and `spread` describe the form as it shows on the skin over `reference` fat, a belly as large as the lean mass makes it; `fat` is the subcutaneous fat over it on this person. The fat is a smoothing layer: a Gaussian of standard deviation `d` blurred by one of `b` is a Gaussian of `√(d² + b²)` with the same area, `b` being 1.5 times the layer's thickness. The deep form is therefore the tabulated one with the reference layer's blur taken away, `d = √(s² − b_ref²)` (at least 0.4 `s`), and the person's layer is laid back over it: the form shows `√(d² + b²)` wide and its crest at `height · √(d² + b_ref²) / √(d² + b²)`, with the area the table gives. A lean person shows a border sharper and higher than the table, a fat one softer and lower, and the girth the form adds stays the same. Widths are read at the peak, heights at every level.
 *
 * @param props.name The form's name
 * @param props.levels Each station's level on the form's scale, in station order, monotone
 * @param props.from Level where the form starts
 * @param props.peak Level of its fullest point
 * @param props.to Level where it ends
 * @param props.angle Its crest's chart angle at a level, radians
 * @param props.height Its height at a level, millimetres, outward positive
 * @param props.spread Standard deviation of the deep form's Gaussian profile across the limb, millimetres
 * @param props.fat Subcutaneous fat over the form at a level on this person, millimetres; omitted, the form shows as tabulated, as a fat pad, which is itself the fat, does
 * @param props.reference Subcutaneous fat over the form at a level on the body the table describes, millimetres; read with `fat`
 * @returns The relief, or null when the form misses the limb
 */
export function traceAutoMovieHumanLimbRelief(props: {
  name: string;
  levels: number[];
  from: number;
  peak: number;
  to: number;
  angle: (level: number) => number;
  height: (level: number) => number;
  spread: number;
  fat?: (level: number) => number;
  reference?: (level: number) => number;
}): IAutoMovieHumanLimbPlan.IRelief | null {
  const { levels } = props;
  const blur = (thickness: number | undefined): number =>
    BLUR_PER_FAT * (thickness ?? 0);
  const deep = (level: number): number =>
    Math.max(
      LEAST_DEEP_SHARE * props.spread,
      Math.sqrt(
        Math.max(0, props.spread ** 2 - blur(props.reference?.(level)) ** 2),
      ),
    );
  // the deep form seen through the reference layer the table describes, and through this person's
  const tabulated = (level: number): number =>
    Math.hypot(deep(level), blur(props.reference?.(level)));
  const seen = (level: number): number =>
    Math.hypot(deep(level), blur(props.fat?.(level)));
  const low: number = Math.max(
    Math.min(props.from, props.to),
    Math.min(...levels),
  );
  const high: number = Math.min(
    Math.max(props.from, props.to),
    Math.max(...levels),
  );
  if (!(high > low)) return null;
  const traced: number[] = Array.from(
    { length: STEPS + 1 },
    (_: unknown, k: number): number => low + ((high - low) * k) / STEPS,
  );
  if (props.peak > low && props.peak < high) traced.push(props.peak);
  const points: IAutoMovieHumanLimbPlan.IReliefPoint[] = traced
    .map(
      (level: number): IAutoMovieHumanLimbPlan.IReliefPoint => ({
        at: indexOf(levels, level),
        angle: props.angle(level),
        height: (props.height(level) * tabulated(level)) / seen(level),
      }),
    )
    .sort(
      (a: IAutoMovieHumanLimbPlan.IReliefPoint, b: IAutoMovieHumanLimbPlan.IReliefPoint): number =>
        a.at - b.at,
    );
  return {
    name: props.name,
    points,
    width:
      HALF_WIDTH_PER_DEVIATION *
      seen(Math.min(Math.max(props.peak, low), high)),
  };
}

/** Position of a level in station-index space, between the two stations whose levels bracket it. */
const indexOf = (levels: number[], level: number): number => {
  for (let i: number = 0; i + 1 < levels.length; ++i) {
    const a: number = levels[i]!;
    const b: number = levels[i + 1]!;
    if ((level - a) * (level - b) <= 0)
      return a === b ? i : i + (level - a) / (b - a);
  }
  return Math.abs(level - levels[0]!) < Math.abs(level - levels[levels.length - 1]!)
    ? 0
    : levels.length - 1;
};
