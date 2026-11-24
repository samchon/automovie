import {
  AutoMovieIllinois,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLimbRootStrip,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSharedCurve,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieHumanLimbRootStrip } from "../generation/AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";
import { inspectHumanArmscyeSkin } from "./inspectHumanArmscyeSkin";

type Point = AutoMovieVector3Tuple;

/**
 * Probe one world-space quintic per meridian with the two actual endpoint jets.
 * The parent conormal enters the removed region of the host chart. The child
 * leaves through its protected section with the original material clock.
 *
 * @see https://doi.org/10.1002/nme.1620070405
 */
export function inspectHumanArmscyeMeridians(input: {
  host: IAutoMovieLoftViewFullSource.IReader;
  loop: IAutoMovieSolidSharedCurve.Loop;
  centre: [number, number];
  child: IAutoMovieLoftViewFullSource.IReader;
  mark: number;
  count: number;
  reach: number;
  materialPhase: (point: Point, clock: number) => number;
  chordDirection: boolean;
  crest?: { height: number; lateral: number };
  surfaces: {
    host: IAutoMovieSolidSurface & { domain: [number, number] };
    child: IAutoMovieSolidSurface & { domain: [number, number] };
  };
}) {
  const { host, loop, centre, child, mark, count, reach, materialPhase } =
    input;
  const start: IAutoMovieHumanLimbRootStrip.IJet[] = [];
  const end: IAutoMovieHumanLimbRootStrip.IJet[] = [];
  const phases: number[] = [];
  const chart: [number, number][] = [];
  for (let index = 0; index < count; ++index) {
    const clock = (2 * Math.PI * index) / count;
    const q = loop(clock);
    chart.push(q.point);
    const jet = host.jet(...q.point);
    const along = V.add(V.scale(jet.u, q.first[0]), V.scale(jet.v, q.first[1]));
    const ds = centre[0] - q.point[0];
    const dp = centre[1] - q.point[1];
    const inward = V.add(V.scale(jet.u, ds), V.scale(jet.v, dp));
    const shear = V.dot(inward, along) / V.dot(along, along);
    const a = ds - shear * q.first[0],
      b = dp - shear * q.first[1];
    const phase = materialPhase(jet.p, clock);
    phases.push(phase);
    const stock = child.jet(mark, phase);
    end.push({ point: stock.p, first: stock.u, second: stock.uu });
    const conormal = crossJet(jet, a, b);
    if (!input.chordDirection) {
      start.push(conormal);
      continue;
    }
    // Rotate the chord about the loop tangent into the inward half of the
    // host plane, retaining the along-loop projection and the full length.
    const chord = V.sub(stock.p, jet.p);
    const tangent = V.dot(chord, along) / V.dot(along, along);
    const across = V.sub(chord, V.scale(along, tangent));
    const scale = V.norm(across) / V.norm(conormal.first);
    if (!(scale > 0) || !Number.isFinite(scale))
      throw new Error("The armscye chord has no regular transverse share");
    start.push(
      crossJet(
        jet,
        scale * a + tangent * q.first[0],
        scale * b + tangent * q.first[1],
      ),
    );
  }
  const turnAngles = phases.map((phase, i) => {
    const step = phases[(i + 1) % count]! - phase;
    return Math.atan2(Math.sin(step), Math.cos(step));
  });
  const winding = Math.round(
    turnAngles.reduce((sum, step) => sum + step, 0) / (2 * Math.PI),
  );
  const leastStep = Math.min(...turnAngles.map((step) => step * winding));
  if (!(Math.abs(winding) === 1 && leastStep > 0))
    throw new Error(
      `Armscye material clock has winding ${winding} with minimum directed step ${leastStep}`,
    );
  const material = inspectLines(start, end, input.crest);
  return {
    count,
    phaseClock: { winding, leastStep },
    registered: material.report,
    crest: material.crest,
    guide: start.map(({ point }) => point),
    skin: inspectHumanArmscyeSkin({
      ...input.surfaces,
      hostChart: chart,
      childChart: phases.map((phase) => [mark, phase]),
      rings: material.rings,
      reach,
    }),
  };
}

/** A straight chart meridian inherits the actual parent's first two derivatives. */
function crossJet(
  jet: IAutoMovieSolidSurface.IJet,
  a: number,
  b: number,
): IAutoMovieHumanLimbRootStrip.IJet {
  return {
    point: jet.p,
    first: V.add(V.scale(jet.u, a), V.scale(jet.v, b)),
    second: V.combine([
      [a * a, jet.uu],
      [2 * a * b, jet.uv],
      [b * b, jet.vv],
    ]),
  };
}

function inspectLines(
  start: IAutoMovieHumanLimbRootStrip.IJet[],
  end: IAutoMovieHumanLimbRootStrip.IJet[],
  crest?: { height: number; lateral: number },
) {
  const count = start.length;
  const ringAt = AutoMovieHumanLimbRootStrip.strip({ start, end }).ring;
  const crestAt = crest === undefined ? null : acromialCrest(start, end, crest);
  const chords = start.map(({ point: p }, i) => V.sub(end[i]!.point, p));
  const rows = Math.ceil(
    Math.max(...chords.map(V.norm)) / AutoMovieHumanTrunkRows.MAX_GAP,
  );
  const rings = Array.from({ length: rows + 1 }, (_, i) => {
    const w = i / rows;
    const ring = ringAt(w);
    if (crestAt === null) return ring;
    const lift = crestWeight(w) * crestAt.coefficient;
    return ring.map(
      ([x, y, z], column): Point => [
        x,
        y +
          lift *
            Math.max(
              0,
              Math.cos((2 * Math.PI * (column - crestAt.column)) / count),
            ) **
              3,
        z,
      ],
    );
  });
  let negativeRows: number = 0;
  let crossedNormal: number = 0;
  const reversedStart = start.flatMap(({ first }, k) =>
    V.dot(first, chords[k]!) <= 0 ? [k] : [],
  );
  const reversedEnd = end.flatMap(({ first }, k) =>
    V.dot(first, chords[k]!) <= 0 ? [k] : [],
  );
  // Compare endpoints with the entire protected ring before changing any
  // phase. A launch with no forward target requires a different parent line.
  const incompatible = [...new Set([...reversedStart, ...reversedEnd])].filter(
    (k) =>
      !end.some((target) => {
        const origin = start[k]!;
        const chord = V.sub(target.point, origin.point);
        return V.dot(origin.first, chord) > 0 && V.dot(target.first, chord) > 0;
      }),
  );
  const reversed: { column: number; row: number }[] = [];
  for (let row = 1; row <= rows; ++row)
    for (let k = 0; k < count; ++k) {
      const before = rings[row - 1]![k]!;
      const now = rings[row]![k]!;
      const forward = V.sub(now, before);
      if (V.dot(forward, chords[k]!) <= 0) {
        ++negativeRows;
        reversed.push({ column: k, row });
      }
      const next = (k + 1) % count;
      const beforeAcross = V.sub(rings[row - 1]![next]!, before);
      const nowAcross = V.sub(rings[row]![next]!, now);
      if (
        V.dot(V.cross(forward, beforeAcross), V.cross(forward, nowAcross)) <= 0
      )
        ++crossedNormal;
    }
  return {
    rings,
    crest: crestAt,
    report: {
      rows,
      negativeRows,
      crossedNormal,
      reversedStart,
      reversedEnd,
      incompatible,
      reversed,
    },
  };
}

/**
 * Add the single interior acromial guide to its meridian. Fixing both endpoint
 * two-jets leaves one scalar direction at degree six, `t³(1-t)³`. The body
 * supplies the guide's height and breadth. The positive half of the clock's
 * cosine, cubed, carries the guide over the superior half with zero first and
 * second derivatives at its edges. This is an estimate of the skin course.
 */
function acromialCrest(
  start: IAutoMovieHumanLimbRootStrip.IJet[],
  end: IAutoMovieHumanLimbRootStrip.IJet[],
  crest: { height: number; lateral: number },
) {
  const sense = Math.sign(start[0]!.point[2]);
  const candidates = start.flatMap((first, column) => {
    const last = end[column]!;
    const span = sense * (last.point[2] - first.point[2]);
    if (
      !(
        span > 0 &&
        sense * first.point[2] < crest.lateral &&
        sense * last.point[2] > crest.lateral
      )
    )
      return [];
    const line = AutoMovieHumanLimbRootStrip.strip({
      start: [first],
      end: [last],
    }).ring;
    const at = AutoMovieIllinois.root(
      (w) => sense * line(w)[0]![2] - crest.lateral,
      0,
      1,
      0.001 / span,
      64,
    );
    return at === null || !(at > 0 && at < 1)
      ? []
      : [{ column, at, point: line(at)[0]! }];
  });
  const peak = candidates.reduce<(typeof candidates)[number] | null>(
    (current, candidate) =>
      current === null || candidate.point[1] > current.point[1]
        ? candidate
        : current,
    null,
  );
  if (peak === null)
    throw new Error("No meridian crosses the measured acromial breadth");
  const lift = crest.height - peak.point[1];
  return { ...peak, lift, coefficient: lift / crestWeight(peak.at) };
}

function crestWeight(w: number): number {
  return (w * (1 - w)) ** 3;
}
