import { type Bounds } from "./orthogonal-mesh";
import { SEGMENTS, TAU } from "./round-mesh";

/**
 * Existing orthogonal band approximation of an authored bore.
 *
 * -z tokens are centre X, centre Y, radius and axial span; -x tokens are span, centre Z, centre Y and radius. Other axis strings take the Y path with radius/span tokens and the host's X/Z centre. Span parsing requires two finite values, but radius positivity, centre finiteness and span order remain caller premises.
 *
 * Twenty-four angular samples, rounded to 1e-9 metres, create sorted transverse levels; each adjacent band uses the circle width at its midpoint. The resulting stair-step union is neither an exact circle nor an exact inscribed 24-gon. Sorting and emission are bounded by the shared subdivision count. Every call returns fresh caller-owned bounds without retained state.
 */
export function boreCuts(
  bore: { axis: string; args: string[] },
  part: Bounds,
): Bounds[] {
  let axis: 0 | 1 | 2,
    centerA: number,
    centerB: number,
    radius: number,
    interval: [number, number];
  const numeric: (s: string) => number = (s: string) : number => Number(s.replace("−", "-"));
  const span: (s: string) => [number, number] = (s: string): [number, number] => {
    const values: number[] = s.split("..").map(numeric);
    if (values.length !== 2 || !values.every(Number.isFinite))
      throw new Error(`invalid bore span ${s}`);
    return [values[0], values[1]];
  };
  if (bore.axis === "-z") {
    axis = 2;
    centerA = numeric(bore.args[0]);
    centerB = numeric(bore.args[1]);
    radius = numeric(bore.args[2]);
    interval = span(bore.args[3]);
  } else if (bore.axis === "-x") {
    axis = 0;
    interval = span(bore.args[0]);
    centerA = numeric(bore.args[1]);
    centerB = numeric(bore.args[2]);
    radius = numeric(bore.args[3]);
  } else {
    axis = 1;
    radius = numeric(bore.args[0]);
    interval = span(bore.args[1]);
    centerA = (part.x[0] + part.x[1]) / 2;
    centerB = (part.z[0] + part.z[1]) / 2;
  }
  // Angular samples define rectangular bands; midpoint circle widths produce
  // a stair-step approximation for the orthogonal cut producer.
  const values: number[] = [
    ...new Set(
      Array.from(
        { length: SEGMENTS },
        (_: unknown, i: number) : number =>
          Math.round(Math.sin((TAU * i) / SEGMENTS) * radius * 1e9) / 1e9,
      ),
    ),
  ].sort((a: number, b: number) : number => a - b);
  const cuts: Bounds[] = [];
  for (let i: number = 0; i < values.length - 1; i++) {
    const mid: number = (values[i] + values[i + 1]) / 2;
    const half: number =
      radius * Math.cos(Math.asin(Math.min(1, Math.abs(mid / radius))));
    const a: [number, number] = [centerA - half, centerA + half];
    const b: [number, number] = [centerB + values[i], centerB + values[i + 1]];
    cuts.push(
      axis === 2
        ? { x: a, y: b, z: interval }
        : axis === 0
          ? { x: interval, y: b, z: a }
          : { x: a, y: interval, z: b },
    );
  }
  return cuts;
}
