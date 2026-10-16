import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";

/** Even steps a form's course is traced in between its ends, before its peak is added. */
const STEPS: number = 8;

/**
 * Trace one superficial form as a relief course of a limb's loft.
 *
 * A form is given on an anatomical scale of its own, such as arm levels or the fraction of a segment's length, rising from `from` to its fullest at `peak` and fading by `to`. The stations' levels on the same scale place it: each traced level becomes a point in station-index space by linear interpolation between the two stations around it, so the course lands on the limb wherever the loft puts its rows. The part of the course beyond the limb's first or last station is dropped.
 *
 * The form's size and its definition are separate: `height` and `spread` describe the form as it shows on the skin over `reference` fat, a belly as large as the lean mass makes it, and `fat` is the subcutaneous fat over it on this person. Both thicknesses are carried on every point, and the loft decides how the person's layer shows the form.
 *
 * @param props.name The form's name
 * @param props.levels Each station's level on the form's scale, in station order, monotone
 * @param props.from Level where the form starts
 * @param props.peak Level of its fullest point
 * @param props.to Level where it ends
 * @param props.angle Its crest's chart angle at a level, radians
 * @param props.height Its height at a level, millimetres, outward positive
 * @param props.spread Standard deviation of the deep form's Gaussian profile across the limb, millimetres
 * @param props.fat Subcutaneous fat over the form at a level on this person, millimetres; omitted, 0 on both bodies, the form showing as tabulated, as a fat pad, which is itself the fat, does
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
        fat: props.fat?.(level) ?? 0,
        reference: props.reference?.(level) ?? 0,
      }),
    )
    .sort(
      (
        a: IAutoMovieHumanLimbPlan.IReliefPoint,
        b: IAutoMovieHumanLimbPlan.IReliefPoint,
      ): number => a.at - b.at,
    );
  return {
    name: props.name,
    points,
    spread: props.spread,
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
  return Math.abs(level - levels[0]!) <
    Math.abs(level - levels[levels.length - 1]!)
    ? 0
    : levels.length - 1;
};
