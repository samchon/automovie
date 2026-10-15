import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";

/** Even steps a form's course is traced in between its ends, before its peak is added. */
const STEPS: number = 8;

/**
 * Half-width of a relief band per standard deviation of the Gaussian profile it replaces. The loft's band falls off as `(1 - (d / w)^2)^3`, which near its crest is `1 - 3 d^2 / w^2`, and a Gaussian `exp(-d^2 / (2 s^2))` is `1 - d^2 / (2 s^2)`, so `w = s √6` gives both the same crest curvature and about nine tenths of the Gaussian's cross-section area. Grade: derived.
 */
const HALF_WIDTH_PER_DEVIATION: number = Math.sqrt(6);

/**
 * Trace one superficial form as a relief course of a limb's loft.
 *
 * A form is given on an anatomical scale of its own, such as arm levels or the fraction of a segment's length, rising from `from` to its fullest at `peak` and fading by `to`. The stations' levels on the same scale place it: each traced level becomes a point in station-index space by linear interpolation between the two stations around it, so the course lands on the limb wherever the loft puts its rows. The part of the course beyond the limb's first or last station is dropped.
 *
 * @param props.name The form's name
 * @param props.levels Each station's level on the form's scale, in station order, monotone
 * @param props.from Level where the form starts
 * @param props.peak Level of its fullest point
 * @param props.to Level where it ends
 * @param props.angle Its crest's chart angle at a level, radians
 * @param props.height Its height at a level, millimetres, outward positive
 * @param props.spread Standard deviation of its Gaussian profile across the limb, millimetres
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
}): IAutoMovieHumanLimbPlan.IRelief | null {
  const { levels } = props;
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
        height: props.height(level),
      }),
    )
    .sort(
      (a: IAutoMovieHumanLimbPlan.IReliefPoint, b: IAutoMovieHumanLimbPlan.IReliefPoint): number =>
        a.at - b.at,
    );
  return {
    name: props.name,
    points,
    width: HALF_WIDTH_PER_DEVIATION * props.spread,
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
