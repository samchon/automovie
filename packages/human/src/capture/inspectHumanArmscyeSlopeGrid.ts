import {
  AutoMovieIllinois,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";
import { AutoMovieHumanBoundSection } from "../generation/conic/AutoMovieHumanBoundSection";

type Margins = {
  level: number;
  phase: number;
  station: number;
  across: number;
  lower: number;
  upper: number;
};

/**
 * Sample the signed limits per arm phase independently of the trial loop.
 * Intersect each candidate trunk layer with actual arm section-plane phase
 * levels, retaining every bracketed branch at the source's sampling pitch. A
 * missing sampled branch is evidence for a tighter search, and says nothing
 * about an unsampled tangent contact.
 *
 * @see https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node109.html
 */
export function inspectHumanArmscyeSlopeGrid(input: {
  host: IAutoMovieViewPart;
  wall: IAutoMovieLoftViewFullSource.IReader;
  arm: IAutoMovieViewPart;
  mark: number;
  outlet: number;
  reach: number;
  side: "left" | "right";
  from: number;
  to: number;
  address: (
    p: AutoMovieVector3Tuple,
  ) => { station: number; phase: number } | null;
}) {
  const { host, wall, arm, mark, outlet, reach, side, from, to, address } =
    input;
  const count = arm.samples;
  const turn = 2 * Math.PI;
  const step = turn / count;
  const fold = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const intervals = Math.ceil((to - from) / AutoMovieHumanTrunkRows.MAX_GAP);
  const columns = Array.from({ length: count }, (_, i) => ({
    phase: i * step,
    seen: 0,
    outward: 0,
    closest: null as Margins | null,
    admitted: [] as { level: number; phase: number; station: number }[],
    clear: [] as { level: number; phase: number; station: number }[],
  }));
  for (let row = 0; row <= intervals; ++row) {
    const level = from + ((to - from) * row) / intervals;
    const read = wall.pointAt(level);
    const begin = side === "left" ? 0 : Math.PI;
    const angles = Array.from(
      { length: host.samples / 2 + 1 },
      (_, i) => begin + (turn * i) / host.samples,
    );
    const mapped = angles.map((angle) => address(read(angle)));
    const origin = host.axis.at(level).origin;
    for (let i = 1; i < angles.length; ++i) {
      const a = mapped[i - 1]!;
      const b = mapped[i]!;
      if (a === null || b === null) continue;
      const next = a.phase + fold(b.phase - a.phase);
      const start = Math.ceil(Math.min(a.phase, next) / step);
      const end = Math.floor(Math.max(a.phase, next) / step);
      for (let k = start; k <= end; ++k) {
        const target = k * step;
        const phase = AutoMovieIllinois.root(
          (angle) => {
            const value = address(read(angle));
            return value === null ? NaN : fold(value.phase - target);
          },
          angles[i - 1]!,
          angles[i]!,
          1e-9,
          100,
        );
        if (phase === null) continue;
        const point = read(phase);
        const at = address(point);
        if (at === null || Math.abs(fold(at.phase - target)) > 1e-7) continue;
        const frame = arm.axis.jet?.(at.station);
        if (frame === undefined || frame === null) continue;
        const column = columns[((k % count) + count) % count]!;
        ++column.seen;
        const { u, v } = wall.jet(level, phase);
        const cross = V.cross(u, v);
        const normal = V.scale(
          cross,
          Math.sign(V.dot(cross, V.sub(point, origin))) / V.norm(cross),
        );
        const radius = V.norm(V.sub(point, frame.value.origin));
        const slope = AutoMovieHumanBoundSection.portSlope(
          frame,
          at.phase,
          radius,
          normal,
        );
        if (!(slope.across > 0)) continue;
        ++column.outward;
        const sample = { level, phase, station: at.station };
        const margins = (end: number) =>
          AutoMovieHumanBoundSection.portSlopeMargins(
            slope,
            radius,
            end - at.station,
            reach,
          );
        const [markLower, markUpper] = margins(mark);
        if (markLower > 0 && markUpper >= 0) column.admitted.push(sample);
        if (!(outlet > at.station)) continue;
        const [lower, upper] = margins(outlet);
        if (lower > 0 && upper >= 0) column.clear.push(sample);
        const previous = column.closest;
        if (
          previous === null ||
          Math.min(lower, upper) > Math.min(previous.lower, previous.upper)
        )
          column.closest = { ...sample, lower, upper, across: slope.across };
      }
    }
  }
  return { from, to, mark, outlet, reach, intervals, columns };
}
