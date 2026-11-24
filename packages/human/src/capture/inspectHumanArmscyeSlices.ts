import { AutoMovieIllinois } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieVector3Tuple,
  IAutoMovieLoftViewFullSource,
} from "@automovie/interface";

import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";

type Point = AutoMovieVector3Tuple;

/**
 * Compare the same independent sources at the measured anterior scye and on
 * either side of it. One read uses the actual bind arm. The survey read brings
 * its humerus down about the actual glenohumeral centre, preserving the
 * generating anatomy. Neither read changes the body's construction.
 *
 * @see https://mreed.umtri.umich.edu/Anthro/Hotzman_2011_ANSURIII_Measurements_a548497.pdf#page=92
 * @see https://mewangcl.github.io/pubs/CADParaHuman.pdf#page=8
 */
export function inspectHumanArmscyeSlices(input: {
  host: IAutoMovieLoftViewFullSource.IReader;
  child: IAutoMovieLoftViewFullSource.IReader;
  joint: Point;
  course: Point;
  side: AutoMovieHumanSide;
  axilla: number;
  reach: number;
  count: number;
}) {
  const { host, child, joint, course, side, axilla, reach, count } = input;
  const rotations = [0, Math.atan2(course[2], -course[1])];
  const sense = side === "left" ? 1 : -1;
  const begin = Math.max(host.domain[0], axilla - reach);
  const end = Math.min(host.domain[1], axilla + reach);
  const intervals = Math.ceil((end - begin) / AutoMovieHumanTrunkRows.MAX_GAP);
  const levels = [
    ...Array.from(
      { length: intervals + 1 },
      (_, i) => begin + ((end - begin) * i) / intervals,
    ),
    axilla,
  ].sort((a, b) => a - b);
  const phases = Array.from(
    { length: count },
    (_, i) => (2 * Math.PI * i) / count,
  );
  const hostRing = (level: number): Point[] => phases.map(host.pointAt(level));
  const sample = (level: number, angle: number, torso = hostRing(level)) => {
    const sine = Math.sin(angle);
    const cosine = Math.cos(angle);
    const rotate = ([x, y, z]: Point): Point => [
      x,
      joint[1] + cosine * (y - joint[1]) - sine * (z - joint[2]),
      joint[2] + sine * (y - joint[1]) + cosine * (z - joint[2]),
    ];
    const ring: Point[] = [];
    for (const phase of phases) {
      const read = (station: number): Point =>
        rotate(child.point(station, phase));
      const root = AutoMovieIllinois.root(
        (station) => read(station)[1] - level,
        ...child.domain,
        0.001,
        100,
      );
      if (root === null) return { angle, incompletePhase: phase };
      ring.push(read(root));
    }
    const outer = Math.max(...torso.map((point) => sense * point[2]));
    const lateralSeparationBound =
      Math.min(...ring.map((p) => sense * p[2])) - outer;
    return {
      angle,
      lateralSeparationBound,
      crossings:
        lateralSeparationBound > 0 ? [] : intersections(torso, ring, level),
    };
  };
  const readings = levels.map((level) => {
    const torso = hostRing(level);
    const observations = rotations.map((angle) => sample(level, angle, torso));
    return { level, measured: level === axilla, observations };
  });
  const first = readings.findIndex(
    ({ observations }) => observations[0]!.crossings?.length === 2,
  );
  if (
    first <= 0 ||
    readings[first - 1]!.observations[0]!.crossings?.length !== 0
  )
    return { readings, guide: null };
  let low = readings[first - 1]!.level;
  let high = readings[first]!.level;
  const tolerance = 0.001;
  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const crossings = sample(mid, 0).crossings;
    if (crossings?.length === 0) low = mid;
    else if (crossings?.length === 2) high = mid;
    else return { readings, guide: null };
  }
  const fold = high + reach;
  const pair = sample(fold, 0).crossings;
  return {
    readings,
    guide:
      pair?.length === 2
        ? { lower: high, bracket: [low, high], fold, pair }
        : null,
  };
}

function intersections(
  first: Point[],
  second: Point[],
  level: number,
): Point[] {
  const hits: Point[] = [];
  for (let i = 0; i < first.length; ++i) {
    const p = first[i]!;
    const q = first[(i + 1) % first.length]!;
    const ax = q[0] - p[0];
    const az = q[2] - p[2];
    for (let j = 0; j < second.length; ++j) {
      const r = second[j]!;
      const s = second[(j + 1) % second.length]!;
      const bx = s[0] - r[0];
      const bz = s[2] - r[2];
      const cross = ax * bz - az * bx;
      if (cross === 0) continue;
      const x = r[0] - p[0];
      const z = r[2] - p[2];
      const a = (x * bz - z * bx) / cross;
      const b = (x * az - z * ax) / cross;
      if (a >= 0 && a < 1 && b >= 0 && b < 1)
        hits.push([p[0] + a * ax, level, p[2] + a * az]);
    }
  }
  return hits.sort((a, b) => b[0] - a[0]);
}
