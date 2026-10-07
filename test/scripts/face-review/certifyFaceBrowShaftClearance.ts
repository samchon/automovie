/**
 * Certify separation of a finite-radius station envelope from the supplied
 * surface. Each interval encloses its swept geometry in the convex hull of two
 * endpoint balls; their centres and radii interpolate linearly. This encloses
 * connecting tube triangles, without treating the centreline as the shaft.
 *
 * Unsigned distance to a set is 1-Lipschitz. Every point is within half a chord
 * of an endpoint, so min(endpoint gap) - (chord + radius change)/2 is a lower
 * bound for the complete interval. Unproved intervals subdivide. A negative
 * sampled gap proves overlap of the enclosing ball, not necessarily of the
 * smaller rendered polygon. A finite query budget or rounding-scale contact
 * returns unresolved; it never moves geometry or changes a requested radius.
 *
 * This is surface separation only: unsigned distance cannot establish exterior
 * side or exclude a wholly internal shaft. Root tissue attachment must not be
 * passed as an exposed-shaft clearance requirement. Coordinates/radii/gaps use
 * metres. The caller owns an accurate unsigned metric query over this host.
 */
export function certifyFaceBrowShaftClearance(props: {
  stations: readonly { point: readonly number[]; radius: number }[];
  query: (point: readonly number[]) => { distance: number };
  maxQueries: number;
}): {
  status: "separated" | "overlapping-envelope" | "unresolved";
  queries: number;
  lowerBoundMetres: number;
  measuredGapMetres: number;
} {
  const stations = props.stations.map((station) => ({
    point: [...station.point],
    radius: station.radius,
  }));
  if (
    stations.length < 2 ||
    stations.some(
      (station) =>
        station.point.length !== 3 ||
        !station.point.every(Number.isFinite) ||
        !Number.isFinite(station.radius) ||
        station.radius < 0,
    )
  )
    throw new Error(
      "Brow shaft clearance needs finite metre stations and nonnegative radii.",
    );
  if (
    !Number.isSafeInteger(props.maxQueries) ||
    props.maxQueries < stations.length
  )
    throw new Error(
      "Brow shaft clearance needs a query budget covering its stations.",
    );
  let queries = 0;
  let measuredGap = Infinity;
  const sample = (station: (typeof stations)[number]) => {
    const { distance } = props.query([...station.point]);
    if (!Number.isFinite(distance) || distance < 0)
      throw new Error(
        "Brow shaft clearance needs a finite unsigned metric distance.",
      );
    queries++;
    const gap = distance - station.radius;
    measuredGap = Math.min(measuredGap, gap);
    const scale = Math.max(
      distance,
      station.radius,
      ...station.point.map(Math.abs),
    );
    return { ...station, gap, rounding: 64 * Number.EPSILON * scale };
  };
  const samples = stations.map(sample);
  if (samples.some((station) => station.gap < -station.rounding))
    return {
      status: "overlapping-envelope",
      queries,
      lowerBoundMetres: -Infinity,
      measuredGapMetres: measuredGap,
    };
  const intervals = samples
    .slice(1)
    .map((right, index) => ({ left: samples[index], right }));
  let lowerBound = Infinity;
  while (intervals.length > 0) {
    const { left, right } = intervals.pop()!;
    const chord = Math.hypot(
      ...left.point.map((value, axis) => value - right.point[axis]),
    );
    const bound =
      Math.min(left.gap, right.gap) -
      (chord === 0 ? 0 : (chord + Math.abs(left.radius - right.radius)) / 2);
    const rounding = Math.max(
      left.rounding,
      right.rounding,
      64 * Number.EPSILON * chord,
    );
    if (bound > rounding) {
      lowerBound = Math.min(lowerBound, bound);
      continue;
    }
    if (queries === props.maxQueries)
      return {
        status: "unresolved",
        queries,
        lowerBoundMetres: Math.min(lowerBound, bound),
        measuredGapMetres: measuredGap,
      };
    const point = left.point.map(
      (value, axis) => value / 2 + right.point[axis] / 2,
    );
    if (
      point.every((value, axis) => value === left.point[axis]) ||
      point.every((value, axis) => value === right.point[axis])
    )
      return {
        status: "unresolved",
        queries,
        lowerBoundMetres: Math.min(lowerBound, bound),
        measuredGapMetres: measuredGap,
      };
    const middle = sample({
      point,
      radius: left.radius / 2 + right.radius / 2,
    });
    if (middle.gap < -middle.rounding)
      return {
        status: "overlapping-envelope",
        queries,
        lowerBoundMetres: Math.min(lowerBound, bound),
        measuredGapMetres: measuredGap,
      };
    if (Math.abs(middle.gap) <= middle.rounding)
      return {
        status: "unresolved",
        queries,
        lowerBoundMetres: Math.min(lowerBound, bound),
        measuredGapMetres: measuredGap,
      };
    intervals.push({ left, right: middle }, { left: middle, right });
  }
  return {
    status: "separated",
    queries,
    lowerBoundMetres: lowerBound,
    measuredGapMetres: measuredGap,
  };
}
