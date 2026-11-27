import { AutoMovieLoftChain, AutoMovieNaturalSpline, AutoMoviePeriodicCubic, AutoMovieViewChain, AutoMovieViewLoft, AutoMovieEngineConstruction } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicRecentre as Recentre,
  AutoMovieHumanConicRelief as Relief,
  AutoMovieHumanConicReliefRecentre as Nets,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanF1,
  AutoMovieHumanF1CourseLaw as Law,
  AutoMovieHumanF1Placement as Placement,
  AutoMovieHumanF1Placing as Placing,
  AutoMovieHumanF1RootRails as RootRails,
  AutoMovieHumanF1TrunkCentre as TrunkCentre,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import type {
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftChain,
  IAutoMovieLoftRelief,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewAxis,
  IAutoMovieViewChain,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";

/**
 * The stored trunk re-expressed about candidate centre lines, measured before anything is switched (the Human skill's step 2, Re-base, and
 * Centres Before Curves, steps 2 and 3): what each origin line costs and gives the sections, and whether the re-expressed wall is the
 * stored wall.
 *
 * A candidate is the line through the sections' own centres smoothed at one scale (`AutoMovieHumanF1CourseLaw.centreLine`, the mean of
 * the four guides; `depth@<scale>`, the middle of the depth on the median line; `area@<scale>`, the centroid of the section's area), or
 * the straight line of least squares through the guides' means (`line`). For each one the tool reads, at every station of a fine sweep and
 * not only at the knots:
 * - admission: `AutoMovieHumanConicRecentre.shift`'s own verdict, then the engine's chain (`AutoMovieViewChain.of`) at every swept
 *   station about the old and the new origin;
 * - the round trip in the chart: every anchor of the old section less the origin's move against the new section's anchor, and the old
 *   skin point at 48 phases against the new section's radius along the same ray from the new origin;
 * - the limits: how far the origin stands from the nearer of the front and back extremes as a share of the depth (an extreme's tangent
 *   takes its sense from the sign of its coordinate), and the star-shape margin, the least sine of the angle between the ray from the
 *   origin and the section's tangent (zero where a ray grazes the section, which is where the chain stops advancing in phase);
 * - what the origin does to the sampling: back reach over front reach, and the longest over the shortest chord between neighbouring
 *   uniform phases.
 *
 * With `--loft=<label>` the chosen candidate is also lofted through the engine on its moved course (`AutoMovieHumanConicRecentre.axis`),
 * bare and open, and its skin compared with the stored wall's loft between the layers; its cap is laid about the moved origin and compared
 * with `--stage=<folder>` stage 1 of the re-base is prepared and measured about it (`stage`), its switch-in texts written to the folder.
 *
 * Usage, from `test`: `node <bundle> [--scales=<candidate>,...] [--step=<mm>] [--loft=<label>] [--stage=<folder>] [--out=<file>]`, a candidate `centre` (the
 * Human package's own line, `AutoMovieHumanF1TrunkCentre.line`), `<mm>`, `reach` (the family's mean guide reach), `line`, or `guides@<scale>`, `depth@<scale>`, `area@<scale>` with a scale `<mm>`, `reach`, `local` (each
 * knot's own mean guide reach) or `local*<factor>`.
 */
namespace FamilyConicTrunkCentre {
  type V3 = [number, number, number];

  /** One section read about one origin. */
  interface IReading {
    /** The engine's refusal of the chain, or null. */
    fault: string | null;

    /** Reach along +u, mm. */
    front: number;

    /** Reach along -u, mm. */
    back: number;

    /** Least sine of the angle between the ray from the origin and the section's tangent. */
    star: number;

    /** Longest chord between neighbouring uniform phases over the shortest. */
    spacing: number;
  }

  /** Phases a section is read at for its margin and its spacing. */
  const ROUND: number = 720;

  const argument = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3);

  const fixed = (x: number, digits: number = 1): string => x.toFixed(digits);

  /** A section's reading about the origin its field vector is written about. */
  function reading(values: readonly number[], layout: IAutoMovieHumanConicSection.ILayout): IReading {
    const section: IAutoMovieViewChain.ISection = S.chain(values, layout);
    if (section.fault !== null) return { fault: section.fault, front: NaN, back: NaN, star: NaN, spacing: NaN };
    const points: [number, number][] = Array.from({ length: ROUND }, (_: unknown, j: number): [number, number] => {
      const t: number = (2 * Math.PI * j) / ROUND;
      const r: number = AutoMovieViewChain.radius(section, t);
      return [r * Math.cos(t), r * Math.sin(t)];
    });
    let [star, short, long]: [number, number, number] = [Infinity, Infinity, 0];
    points.forEach((p: [number, number], j: number): void => {
      const [a, b]: [number, number][] = [points[(j + ROUND - 1) % ROUND]!, points[(j + 1) % ROUND]!];
      const tangent: [number, number] = [b![0] - a![0], b![1] - a![1]];
      star = Math.min(star, (p[0] * tangent[1] - p[1] * tangent[0]) / (Math.hypot(p[0], p[1]) * Math.hypot(tangent[0], tangent[1])));
      const chord: number = Math.hypot(b![0] - p[0], b![1] - p[1]);
      short = Math.min(short, chord);
      long = Math.max(long, chord);
    });
    return { fault: null, front: AutoMovieViewChain.radius(section, 0), back: AutoMovieViewChain.radius(section, Math.PI), star, spacing: long / short };
  }

  /** The family's knot values about the line, by the subtraction `AutoMovieHumanConicRecentre.shift` makes, with no admission. */
  function moved(family: IAutoMovieHumanConicLoft.IFamily, line: IAutoMovieHumanConicRecentre.ILine): number[][] {
    const { at }: { at: number[] } = S.offsets(family.layout);
    const values: number[][] = family.values.map((row: number[]): number[] => [...row]);
    family.layout.anchors.forEach((anchor: IAutoMovieHumanConicSection.IAnchor, k: number): void => {
      if (anchor.kind !== "u" && anchor.kind !== "v") return;
      values[at[k]!] = values[at[k]!]!.map((x: number, m: number): number => x - line.u[m]!);
    });
    return values;
  }

  /** The straight line of least squares through the raw section centres, each knot weighted by the course it stands for. */
  function straight(family: IAutoMovieHumanConicLoft.IFamily): IAutoMovieHumanConicRecentre.ILine {
    const raw: IAutoMovieHumanConicRecentre.ILine = Law.centreLine(family, "sections", 0);
    const knots: number[] = family.knots;
    const span: number[] = knots.map((s: number, k: number): number => ((knots[k + 1] ?? s) - (knots[k - 1] ?? s)) / 2);
    const total: number = span.reduce((sum: number, w: number): number => sum + w, 0);
    const mean = (f: (k: number) => number): number => span.reduce((sum: number, w: number, k: number): number => sum + w * f(k), 0) / total;
    const [s0, u0]: [number, number] = [mean((k: number): number => knots[k]!), mean((k: number): number => raw.u[k]!)];
    const slope: number = mean((k: number): number => (knots[k]! - s0) * (raw.u[k]! - u0)) / mean((k: number): number => (knots[k]! - s0) ** 2);
    return { u: knots.map((s: number): number => u0 + slope * (s - s0)), v: knots.map((): number => 0) };
  }

  /** Loft a view part and return its chain, or throw the engine's diagnostics. */
  function loft(part: IAutoMovieViewPart): IAutoMovieLoftChain {
    const result: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    if (result.chain === null) throw new Error(part.name + " does not loft: " + JSON.stringify(result.diagnostics).slice(0, 2000));
    return result.chain;
  }

  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const sub = (a: readonly number[], b: readonly number[]): V3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const cross = (a: readonly number[], b: readonly number[]): V3 => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const length = (a: readonly number[]): number => Math.hypot(a[0]!, a[1]!, a[2]!);
  const unit = (a: readonly number[]): V3 => [a[0]! / length(a), a[1]! / length(a), a[2]! / length(a)];
  const clamp = (x: number, most: number): number => Math.max(-most, Math.min(most, x));

  /** A lofted chain as a surface with the course it is charted about. */
  interface ISurface {
    axis: IAutoMovieViewAxis.IAxis;
    point: (s: number, t: number) => V3;
    range: [number, number];
  }

  /** The chart angle of a world point about a course at a station. */
  function angleAt(axis: IAutoMovieViewAxis.IAxis, s: number, p: readonly number[]): number {
    const frame = axis.at(s);
    const d: V3 = sub(p, frame.origin);
    return Math.atan2(dot(d, frame.v), dot(d, frame.u));
  }

  /**
   * The distance from a point to a surface, by Gauss-Newton on the surface's address from the point's own station and chart angle. With
   * `free` the station is solved too, the true distance; without it the nearest point is sought in the point's own section plane, which is
   * never less than the true distance.
   */
  function nearest(surface: ISurface, p: V3, station: number, free: boolean): number {
    let s: number = Math.max(surface.range[0] + 1e-3, Math.min(surface.range[1] - 1e-3, station));
    let t: number = angleAt(surface.axis, s, p);
    for (let i: number = 0; i < 16; ++i) {
      const d: V3 = sub(surface.point(s, t), p);
      const xt: V3 = sub(surface.point(s, t + 1e-6), surface.point(s, t - 1e-6)).map((x: number): number => x / 2e-6) as V3;
      if (!free) {
        const step: number = dot(d, xt) / dot(xt, xt);
        t -= clamp(step, 0.1);
        if (Math.abs(step) * length(xt) < 1e-7) break;
        continue;
      }
      const h: number = Math.min(1e-3, (s - surface.range[0]) / 2, (surface.range[1] - s) / 2);
      const xs: V3 = sub(surface.point(s + h, t), surface.point(s - h, t)).map((x: number): number => x / (2 * h)) as V3;
      const [a11, a12, a22, b1, b2]: number[] = [dot(xs, xs), dot(xs, xt), dot(xt, xt), dot(d, xs), dot(d, xt)];
      const det: number = a11! * a22! - a12! * a12!;
      if (!(det > 0)) break;
      const [ds, dt]: [number, number] = [(b1! * a22! - b2! * a12!) / det, (b2! * a11! - b1! * a12!) / det];
      s = Math.max(surface.range[0] + 1e-3, Math.min(surface.range[1] - 1e-3, s - clamp(ds, 2)));
      t -= clamp(dt, 0.1);
      if (Math.hypot(ds * length(xs), dt * length(xt)) < 1e-7) break;
    }
    return length(sub(surface.point(s, t), p));
  }

  /** The distance from a point to a closed polyline. */
  function toPolyline(p: V3, loop: readonly V3[]): number {
    let least: number = Infinity;
    loop.forEach((a: V3, k: number): void => {
      const b: V3 = loop[(k + 1) % loop.length]!;
      const ab: V3 = sub(b, a);
      const share: number = Math.max(0, Math.min(1, dot(sub(p, a), ab) / Math.max(dot(ab, ab), 1e-30)));
      least = Math.min(least, length(sub(p, [a[0] + share * ab[0], a[1] + share * ab[1], a[2] + share * ab[2]])));
    });
    return least;
  }

  /**
   * A port loop from chart points, as the figure's own constructor encodes one (`AutoMovieHumanF1.around`, with no margin): the middle
   * and half extent of the points' box, and each column's share of the ellipse's distance at its clock, between the two points either
   * side of it.
   */
  function around(outline: readonly [number, number][], columns: number, sense: 1 | -1): IAutoMovieConstructionPortLoop {
    const span = (c: 0 | 1): [number, number] => [Math.min(...outline.map((q: [number, number]): number => q[c])), Math.max(...outline.map((q: [number, number]): number => q[c]))];
    const [stations, phases]: [number, number][] = [span(0), span(1)];
    const centre: [number, number] = [(stations![0] + stations![1]) / 2, (phases![0] + phases![1]) / 2];
    const semi: [number, number] = [(stations![1] - stations![0]) / 2, (phases![1] - phases![0]) / 2];
    const polar: [number, number][] = outline
      .map((q: [number, number]): [number, number] => {
        const [x, y]: [number, number] = [(q[0] - centre[0]) / semi[0], (sense * (q[1] - centre[1])) / semi[1]];
        return [(Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI), Math.hypot(x, y)];
      })
      .sort((a: [number, number], b: [number, number]): number => a[0] - b[0]);
    const shape: number[] = Array.from({ length: columns }, (_: unknown, k: number): number => {
      const clock: number = (2 * Math.PI * k) / columns;
      const after: number = polar.findIndex((q: [number, number]): boolean => q[0] >= clock);
      const [a, b]: [number, number][] =
        after > 0 ? [polar[after - 1]!, polar[after]!] : after === 0 ? [[polar.at(-1)![0] - 2 * Math.PI, polar.at(-1)![1]], polar[0]!] : [polar.at(-1)!, [polar[0]![0] + 2 * Math.PI, polar[0]![1]]];
      return b![0] === a![0] ? a![1] : a![1] + ((b![1] - a![1]) * (clock - a![0])) / (b![0] - a![0]);
    });
    return { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense, shape };
  }

  /** A loop's column addresses, `[station mm, phase rad]`. */
  const columnsOf = (loop: IAutoMovieConstructionPortLoop): [number, number][] =>
    (loop.shape ?? []).map((share: number, k: number, all: number[]): [number, number] => AutoMovieEngineConstruction.constructionPortAddress(loop, (2 * Math.PI * k) / all.length, share));

  /**
   * The engine's angle premise of a port's correspondence (`AutoMovieConstructionPortCurve`, `phases`): the loop's columns, read as
   * angles round the centroid of the child's rail ring in that ring's own plane, turn once and never back. Returns the whole turn and
   * the least step in the turn's sense, radians.
   */
  function premise(loop: readonly V3[], child: IAutoMovieLoftChain, rail: (psi: number) => number): { total: number; least: number } {
    const m: number = 8 * loop.length;
    const ring: V3[] = Array.from({ length: m }, (_: unknown, j: number): V3 => AutoMovieLoftChain.point(child, rail((2 * Math.PI * j) / m), (2 * Math.PI * j) / m) as V3);
    const centre: V3 = [0, 1, 2].map((c: number): number => ring.reduce((sum: number, p: V3): number => sum + p[c]!, 0) / m) as V3;
    const area: V3 = [0, 0, 0];
    ring.forEach((p: V3, j: number): void => {
      const n: V3 = cross(sub(p, centre), sub(ring[(j + 1) % m]!, centre));
      for (let c: number = 0; c < 3; ++c) area[c]! += n[c]!;
    });
    const normal: V3 = unit(area);
    const d0: V3 = sub(ring[0]!, centre);
    const e1: V3 = unit(sub(d0, normal.map((x: number): number => x * dot(d0, normal))));
    const e2: V3 = cross(normal, e1);
    const at = (p: V3): number => Math.atan2(dot(sub(p, centre), e2), dot(sub(p, centre), e1));
    const steps: number[] = loop.map((_: V3, k: number): number => {
      const x: number = at(loop[(k + 1) % loop.length]!) - at(loop[k]!);
      return x - 2 * Math.PI * Math.round(x / (2 * Math.PI));
    });
    const total: number = steps.reduce((sum: number, x: number): number => sum + x, 0);
    return { total, least: Math.min(...steps.map((x: number): number => Math.sign(total) * x)) };
  }

  /**
   * Stage 1 of the re-base, prepared and measured about one origin line; nothing is stored by it.
   *
   * - The family as it would be stored: the shifted knot values to the stored hundredth, the line as `IFamily.origin`, the cap laid again
   *   with its centre moved by the origin's move at its first section. Its bare wall is compared with the stored bare wall, and its cap
   *   with the stored cap in the section planes and in height.
   * - The nets converted by `AutoMovieHumanConicReliefRecentre`, their directions rounded in their segments' frames and their heights
   *   to the stored hundredth, each with its fit's residual, its twin's difference from its reflection, and the converted figure's
   *   distance from the stored figure over each window and over the whole wall, both lofted by the engine with their nets.
   * - The port loops: each recorded loop carried to the new chart point by point and encoded again, with what the root calibration
   *   reads of it; and the armscye by its rule (the plane through the shoulder joint centre square to the thorax's lateral axis, cutting
   *   the skin) beside the recorded loop.
   * - The open lower end's ring as the split band samples it: uniform host phases about each origin.
   *
   * @param folder Where the switch-in texts are written.
   */
  async function stage(trunk: IAutoMovieHumanConicLoft.IFamily, line: IAutoMovieHumanConicRecentre.ILine, requested: number[], lines: string[], folder: string): Promise<void> {
    const knots: number[] = trunk.knots;
    const round = (x: number, digits: number): number => Math.round(x * 10 ** digits) / 10 ** digits;
    const tip: IAutoMovieHumanConicLoft.ITip = trunk.tips![1]!;
    const originU: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(knots, line.u);
    const move = (s: number): number => AutoMovieNaturalSpline.evaluate(originU, s);
    const values: number[][] = Recentre.shift(trunk, line).map((row: number[]): number[] => row.map((x: number): number => round(x, 4)));
    const centre: [number, number] = [round((tip.centre?.[0] ?? 0) - move(tip.from), 2), 0];
    const laid: IAutoMovieHumanConicLoft.IFamily = { ...trunk, values, origin: line, turn: undefined, reliefs: undefined, tips: [null, { ...tip, centre }] };
    const surface = (family: IAutoMovieHumanConicLoft.IFamily): ISurface => {
      const chain: IAutoMovieLoftChain = loft(H.part(family, requested));
      return { axis: H.axis(family), range: [knots[0]!, tip.tip], point: (s: number, t: number): V3 => AutoMovieLoftChain.point(chain, s, t) as V3 };
    };
    const storedBare: ISurface = surface({ ...trunk, turn: undefined, reliefs: undefined });
    const storedFull: ISurface = surface({ ...trunk, turn: undefined });
    const madeBare: ISurface = surface(laid);
    const normal: V3 = unit(cross(storedBare.axis.at(knots[0]!).u, storedBare.axis.at(knots[0]!).v));
    const sweep = (what: string, from: ISurface, onto: ISurface, stations: number[], phases: number, free: (s: number) => boolean): void => {
      let [sum, count, worst, where]: [number, number, number, number[]] = [0, 0, 0, [NaN, NaN]];
      for (const s of stations)
        for (let j: number = 0; j < phases; ++j) {
          const t: number = (2 * Math.PI * (j + 0.37)) / phases;
          const d: number = nearest(onto, from.point(s, t), s, free(s));
          sum += d;
          ++count;
          if (d > worst) [worst, where] = [d, [s, t]];
        }
      lines.push(`${what}: ${count} points: mean ${(sum / count).toExponential(2)} mm, greatest ${worst.toExponential(2)} mm at station ${fixed(where[0]!, 2)} phase ${fixed(where[1]!, 3)}`);
    };
    const every = (from: number, to: number, pace: number): number[] => Array.from({ length: Math.floor((to - from) / pace + 1e-9) + 1 }, (_: unknown, i: number): number => from + i * pace);

    lines.push("", "== stage 1 ==", `origin u at the knots: ${JSON.stringify(line.u)}`);
    sweep("bare wall as stored (values to the stored precision, the line as IFamily.origin) against the stored bare wall, in the section planes", madeBare, storedBare, every(knots[0]! + 0.5, tip.from, 1), 96, (): boolean => false);

    // The cap.
    lines.push("", `-- the cap from ${tip.from} to ${tip.tip}: stored centre ${JSON.stringify(tip.centre)}, laid again with ${JSON.stringify(centre)}; the origin's move is ${fixed(move(tip.from), 2)} mm at its first section and ${fixed(move(tip.tip), 2)} at its tip --`);
    const capStations: number[] = every(tip.from, tip.tip - 0.05, 0.25);
    // The height of a surface over a point of the plane across the course: the station whose section passes through it.
    const heightOver = (onto: ISurface, p: V3): number | null => {
      const outside = (s: number): number => {
        const frame = onto.axis.at(s);
        const d: V3 = sub(p, frame.origin);
        const [x, y]: [number, number] = [dot(d, frame.u), dot(d, frame.v)];
        const q: V3 = sub(onto.point(s, Math.atan2(y, x)), frame.origin);
        return Math.hypot(x, y) - Math.hypot(dot(q, frame.u), dot(q, frame.v));
      };
      let [low, high]: [number, number] = [tip.from - 26, tip.tip - 1e-6];
      if (!(outside(low) < 0) || !(outside(high) > 0)) return null;
      for (let i: number = 0; i < 50; ++i) {
        const middle: number = (low + high) / 2;
        if (outside(middle) < 0) low = middle;
        else high = middle;
      }
      return (low + high) / 2;
    };
    const capCompare = (what: string, from: ISurface, onto: ISurface, stations: number[]): void => {
      let [plane, planeMost, planeAt, rise, riseMost, riseAt, count, lost]: [number, number, number[], number, number, number[], number, number] = [0, 0, [NaN, NaN], 0, 0, [NaN, NaN], 0, 0];
      let [lowest, highest]: [number, number] = [Infinity, -Infinity];
      for (const s of stations)
        for (let j: number = 0; j < 96; ++j) {
          const t: number = (2 * Math.PI * (j + 0.37)) / 96;
          const p: V3 = from.point(s, t);
          const h: number | null = heightOver(onto, p);
          if (h === null) {
            ++lost;
            continue;
          }
          const d: number = nearest(onto, p, s, false);
          // Both courses share their stations, so the height between the two surfaces is the difference of two stations.
          const up: number = h - s;
          plane += d;
          rise += Math.abs(up);
          ++count;
          [lowest, highest] = [Math.min(lowest, up), Math.max(highest, up)];
          if (d > planeMost) [planeMost, planeAt] = [d, [s, t]];
          if (Math.abs(up) > riseMost) [riseMost, riseAt] = [Math.abs(up), [s, t]];
        }
      lines.push(
        `${what}: ${count} points (${lost} with no height over them): in the section plane mean ${fixed(plane / count, 3)} mm, greatest ${fixed(planeMost, 3)} at station ${fixed(planeAt[0]!, 2)} phase ${fixed(planeAt[1]!, 3)}; in height mean ${fixed(rise / count, 3)} mm, greatest ${fixed(riseMost, 3)} at station ${fixed(riseAt[0]!, 2)} phase ${fixed(riseAt[1]!, 3)}, from ${fixed(lowest, 3)} to ${fixed(highest, 3)} (the surface compared with stands higher where positive)`,
      );
    };
    capCompare("stored bare cap against the cap laid again", storedBare, madeBare, capStations);
    capCompare("stored cap with its nets against the bare cap laid again (what the nets over it must carry)", storedFull, madeBare, capStations);
    const poleNew: V3 = madeBare.axis.at(tip.tip).origin as V3;
    const poleOld: V3 = storedBare.axis.at(tip.tip).origin as V3;
    lines.push(
      `poles: the new pole stands ${fixed(move(tip.tip), 2)} mm in front of the stored one, both at station ${tip.tip}; under the new pole the stored skin stands at station ${fixed(heightOver(storedFull, poleNew) ?? NaN, 3)} (bare ${fixed(heightOver(storedBare, poleNew) ?? NaN, 3)}); over the stored pole the cap laid again stands at station ${fixed(heightOver(madeBare, poleOld) ?? NaN, 3)}`,
    );
    // Where the stored sections stop holding the new origin: above it no net cast in the section plane has a target.
    let holds: number = tip.from;
    for (const s of every(tip.from, tip.tip - 0.01, 0.01)) {
      const frame = storedFull.axis.at(s);
      if (dot(sub(storedFull.point(s, 0), frame.origin), frame.u) > move(s)) holds = s;
      else break;
    }
    lines.push(`the stored section holds the new origin up to station ${fixed(holds, 2)}, ${fixed(tip.tip - holds, 2)} mm under the tip`);

    // The nets.
    const directions: Map<string, { axis: V3; turn?: V3 }> = new Map();
    const inFrame = (name: string, d: readonly number[]): { local: V3; world: V3 } => {
      const frame: IAutoMovieHumanSegmentFrame = Placement.frame(Placing.DIRECTIONS[name]!.frame);
      const local: V3 = F.toLocalDirection(frame, [d[0]!, d[1]!, d[2]!]).map((x: number): number => round(x, 4) + 0) as V3;
      return { local, world: F.toWorldDirection(frame, local) };
    };
    const converted: Nets.INet[] = Nets.convert({
      stored: { axis: storedBare.axis, point: storedBare.point, stations: storedBare.range },
      made: { axis: madeBare.axis, point: madeBare.point, stations: madeBare.range },
      reliefs: trunk.reliefs ?? [],
      lay: (net: IAutoMovieLoftRelief, stored: IAutoMovieLoftRelief): IAutoMovieLoftRelief => {
        if (net.axis.every((x: number, c: number): boolean => x === stored.axis[c])) return net;
        const axis = inFrame(net.name + ".axis", net.axis);
        const turn = net.turn === undefined ? undefined : inFrame(net.name + ".turn", net.turn);
        directions.set(net.name, { axis: axis.local, ...(turn === undefined ? {} : { turn: turn.local }) });
        return { ...net, axis: axis.world, ...(turn === undefined ? {} : { turn: turn.world }) };
      },
      store: (net: IAutoMovieLoftRelief, stored: IAutoMovieLoftRelief): IAutoMovieLoftRelief => {
        const mirrored: boolean = Relief.stored(stored) !== 0 && Relief.stored(stored) !== stored.heights.length;
        const heights: number[] = net.heights.map((h: number, i: number): number => {
          const [a, b]: [number, number] = [Math.floor(i / net.columns), i % net.columns];
          return round(mirrored ? (h + net.heights[a * net.columns + net.columns - 1 - b]!) / 2 : h, 2) + 0;
        });
        return { ...net, heights };
      },
    });
    const made: IAutoMovieLoftRelief[] = converted.map((net: Nets.INet): IAutoMovieLoftRelief => net.relief);
    const madeFull: ISurface = surface({ ...laid, reliefs: made });
    const skew = (s: number): boolean =>
      s > tip.from - 20 || (trunk.reliefs ?? []).some((net: IAutoMovieLoftRelief): boolean => s > net.stations[0] && s < net.stations[1] && Math.abs(dot(net.axis, normal)) > 1e-9);
    lines.push(
      "",
      "-- the nets, converted in the stored order (each fitted on the nets before it) --",
      "net | rows x columns | law | stored window > new window | new directions in their frame | rows observed (none) from..to | fit residual mean, max mm | converted figure off the stored figure over the window: mean, max mm (at station, phase) | greatest height stored > new mm | twin off its reflection mm",
    );
    converted.forEach((net: Nets.INet, index: number): void => {
      const stored: IAutoMovieLoftRelief = trunk.reliefs![index]!;
      const relief: IAutoMovieLoftRelief = net.relief;
      let [sum, count, worst, where]: [number, number, number, number[]] = [0, 0, 0, [NaN, NaN]];
      const [rowsN, columnsN]: [number, number] = [2 * (relief.rows - 3), 2 * (relief.columns - 3)];
      for (let i: number = 0; i < rowsN; ++i) {
        const s: number = relief.stations[0] + ((relief.stations[1] - relief.stations[0]) * (i + 0.25)) / rowsN;
        if (s <= knots[0]! + 0.01 || s >= tip.tip - 0.05) continue;
        for (let j: number = 0; j < columnsN; ++j) {
          const t: number = relief.phases[0] + ((relief.phases[1] - relief.phases[0]) * (j + 0.25)) / columnsN;
          const d: number = nearest(storedFull, madeFull.point(s, t), s, skew(s));
          sum += d;
          ++count;
          if (d > worst) [worst, where] = [d, [s, t]];
        }
      }
      let twin: string = "";
      if (stored.name.endsWith(".twin")) {
        const original: IAutoMovieLoftRelief = made[trunk.reliefs!.findIndex((x: IAutoMovieLoftRelief): boolean => x.name === stored.name.slice(0, -5))]!;
        let off: number = Math.max(Math.abs(relief.phases[0] + original.phases[1]), Math.abs(relief.phases[1] + original.phases[0]));
        relief.heights.forEach((h: number, i: number): void => {
          const [a, b]: [number, number] = [Math.floor(i / relief.columns), i % relief.columns];
          off = Math.max(off, Math.abs(h - original.heights[a * relief.columns + relief.columns - 1 - b]!));
        });
        twin = off.toExponential(1);
      }
      const most = (x: IAutoMovieLoftRelief): number => Math.max(...x.heights.map(Math.abs));
      const own: { axis: V3; turn?: V3 } | undefined = directions.get(stored.name);
      lines.push(
        [
          stored.name,
          `${relief.rows} x ${relief.columns}`,
          net.mode,
          `${stored.phases.map((x: number): string => fixed(x, 4)).join(" to ")} > ${relief.phases.map((x: number): string => fixed(x, 4)).join(" to ")}`,
          own === undefined ? "kept" : `axis ${JSON.stringify(own.axis)}${own.turn === undefined ? "" : " turn " + JSON.stringify(own.turn)}`,
          `${net.rows.observed} (${net.rows.unobserved}) ${fixed(net.rows.first, 1)}..${fixed(net.rows.last, 1)}`,
          `${fixed(net.residual.mean, 4)}, ${fixed(net.residual.max, 3)}`,
          `${fixed(sum / count, 4)}, ${fixed(worst, 3)} (${fixed(where[0]!, 1)}, ${fixed(where[1]!, 3)})`,
          `${fixed(most(stored), 2)} > ${fixed(most(relief), 2)}`,
          twin,
        ].join(" | "),
      );
    });
    sweep("converted figure against the stored figure, the whole wall under the cap, in the section planes (never less than the true distance)", madeFull, storedFull, every(knots[0]! + 0.5, tip.from - 20, 2), 240, (): boolean => false);
    sweep("the same where a net leaves the section plane and over the crown, true distance", madeFull, storedFull, [...every(596.5, 664, 1.5), ...every(690.5, 734, 1.5), ...every(tip.from - 20, tip.tip - 0.3, 0.5)], 240, (): boolean => true);
    sweep("the same over the last 0.3 mm under the tip, true distance", madeFull, storedFull, every(tip.tip - 0.29, tip.tip - 0.02, 0.03), 96, (): boolean => true);

    // The switch-in texts.
    const numbers = (list: readonly number[]): string => "[" + list.map((x: number): string => String(x)).join(", ") + "]";
    const text: string[] = [`  origin: {u: ${numbers(line.u)}, v: ${numbers(line.v)}},`, "  values: ["];
    values.forEach((row: number[]): number => text.push(`    ${numbers(row)},`));
    text.push("  ],", `  tips: [null, {from: ${tip.from}, tip: ${tip.tip}, centre: ${numbers(centre)}, own: true}],`, "  reliefs: AutoMovieHumanConicRelief.list([");
    const placing: string[] = [];
    converted.forEach((net: Nets.INet, index: number): void => {
      const stored: IAutoMovieLoftRelief = trunk.reliefs![index]!;
      const relief: IAutoMovieLoftRelief = net.relief;
      const own: { axis: V3; turn?: V3 } | undefined = directions.get(stored.name);
      if (own !== undefined) {
        placing.push(`    "${stored.name}.axis": {"frame": "${Placing.DIRECTIONS[stored.name + ".axis"]!.frame}", "local": ${numbers(own.axis)}},`);
        if (own.turn !== undefined) placing.push(`    "${stored.name}.turn": {"frame": "${Placing.DIRECTIONS[stored.name + ".turn"]!.frame}", "local": ${numbers(own.turn)}},`);
      }
      const place = (which: string): string => `AutoMovieHumanF1Placement.direction("${stored.name}.${which}")`;
      const ends: string = `"axis":${place("axis")}${relief.turn === undefined ? "" : `, "turn":${place("turn")}`}`;
      const window: string = numbers(relief.phases.map((x: number): number => round(x, 4)));
      if (stored.name.endsWith(".twin")) {
        text.push(`    {"name":"${stored.name}", "twin":"${stored.name.slice(0, -5)}", "phases":${window}, ${ends}},`);
        return;
      }
      const kept: number = Relief.stored(stored);
      const half: number = (relief.columns + 1) / 2;
      const heights: string =
        kept === stored.heights.length
          ? numbers(relief.heights)
          : `AutoMovieHumanConicRelief.mirrored(${relief.rows}, ${relief.columns}, ${numbers(relief.heights.filter((_: number, i: number): boolean => i % relief.columns < half))})`;
      text.push(`    {"name":"${stored.name}", "stations":${numbers(stored.stations)}, "phases":${window}, ${ends}, "rows":${relief.rows}, "columns":${relief.columns}, "heights":${heights}},`);
    });
    text.push("  ]),");
    await fs.writeFile(folder + "/switch-in-trunk.txt", text.join("\n") + "\n");
    await fs.writeFile(folder + "/switch-in-placing.txt", placing.join("\n") + "\n");

    // The port loops.
    lines.push("", "-- the port loops --");
    const worldOf = (onto: ISurface, loop: IAutoMovieConstructionPortLoop): V3[] => columnsOf(loop).map(([s, t]: [number, number]): V3 => onto.point(s, t));
    const off = (from: readonly V3[], onto: readonly V3[]): string => {
      const all: number[] = from.map((p: V3): number => toPolyline(p, onto));
      const most: number = Math.max(...all);
      return `mean ${fixed(all.reduce((sum: number, x: number): number => sum + x, 0) / all.length, 3)}, greatest ${fixed(most, 3)} mm (at column ${all.indexOf(most)})`;
    };
    const clock = (loop: IAutoMovieConstructionPortLoop): number => {
      // `AutoMovieHumanF1NativeRootClock.reclock`'s premise: the columns' angle about the loop's pole on its own ellipse strictly increases.
      const angles: number[] = columnsOf(loop).map(([s, t]: [number, number]): number => Math.atan2((t - loop.centre[1]) / (loop.sense * loop.semi[1]), (s - loop.centre[0] * 1000) / (loop.semi[0] * 1000)));
      return Math.min(...angles.map((a: number, k: number): number => {
        const x: number = angles[(k + 1) % angles.length]! - a;
        return x - 2 * Math.PI * Math.round(x / (2 * Math.PI));
      }));
    };
    const child = (family: IAutoMovieHumanConicLoft.IFamily): IAutoMovieLoftChain => loft(H.part({ ...family, turn: undefined }, family.knots));
    const armRail = AutoMoviePeriodicCubic.create(RootRails.forArm(1));
    const children: Record<string, { chain: IAutoMovieLoftChain; rail: (psi: number) => number } | null> = {
      arm: { chain: child(AutoMovieHumanF1.BODY.arm), rail: (psi: number): number => AutoMovieHumanF1.BODY.arm.knots[0]! + armRail.at(psi) },
      breast: { chain: child(AutoMovieHumanF1.BODY.breast), rail: (): number => AutoMovieHumanF1.BODY.breast.knots[0]! + RootRails.landing.breast },
      nose: null,
    };
    const turnOf = (name: string, loop: readonly V3[]): string => {
      const own = children[name];
      if (own === null || own === undefined) return "the nose corresponds by length, not by angle";
      try {
        const read = premise(loop, own.chain, own.rail);
        return `turn ${fixed(read.total, 6)} rad, least step ${read.least.toExponential(3)} rad (a uniform step is ${(2 * Math.PI / loop.length).toExponential(3)})`;
      } catch (error: unknown) {
        return "not read: " + (error instanceof Error ? error.message.slice(0, 200) : String(error));
      }
    };
    const describe = (loop: IAutoMovieConstructionPortLoop): string =>
      `centre [${fixed(loop.centre[0] * 1000, 2)} mm, ${fixed(loop.centre[1], 5)} rad] semi [${fixed(loop.semi[0] * 1000, 2)} mm, ${fixed(loop.semi[1], 5)} rad] sense ${loop.sense}`;
    const loopsText: string[] = [];
    const emit = (name: string, loop: IAutoMovieConstructionPortLoop): number =>
      loopsText.push(`// ${name}`, `{ centre: ${numbers([...loop.centre])}, semi: ${numbers([...loop.semi])}, sense: ${loop.sense}, shape: ${numbers(loop.shape ?? [])} },`);
    const recorded: [string, string, IAutoMovieConstructionPortLoop][] = [
      ["arm", "arm[0]", AutoMovieHumanF1.ROOT_CONTROLS.arm[0]],
      ["arm", "arm[1]", AutoMovieHumanF1.ROOT_CONTROLS.arm[1]],
      ["breast", "breast[0]", AutoMovieHumanF1.ROOT_CONTROLS.breast[0]],
      ["breast", "breast[1]", AutoMovieHumanF1.ROOT_CONTROLS.breast[1]],
      ["nose", "nose", AutoMovieHumanF1.ROOT_CONTROLS.nose],
    ];
    for (const [kind, name, loop] of recorded) {
      const before: V3[] = worldOf(storedFull, loop);
      const carried: [number, number][] = columnsOf(loop).map(([s]: [number, number], k: number): [number, number] => {
        const mapped: number = angleAt(madeBare.axis, s, before[k]!);
        return [s, mapped + 2 * Math.PI * Math.round((loop.centre[1] - mapped) / (2 * Math.PI))];
      });
      const again: IAutoMovieConstructionPortLoop = around(carried, carried.length, loop.sense as 1 | -1);
      const after: V3[] = worldOf(madeFull, again);
      emit(name + " carried", again);
      lines.push(
        `${name} recorded: ${describe(loop)}; clock premise least step ${clock(loop).toExponential(3)}; ${name.endsWith("[1]") ? "the twin" : turnOf(kind, before)}`,
        `${name} carried: ${describe(again)}; clock premise least step ${clock(again).toExponential(3)}; ${name.endsWith("[1]") ? "the twin" : turnOf(kind, after)}`,
        `${name} carried against recorded, along the skin: new columns to the recorded loop ${off(after, before)}; recorded columns to the new loop ${off(before, after)}; the recorded loop is ${fixed(before.reduce((sum: number, p: V3, k: number): number => sum + length(sub(before[(k + 1) % before.length]!, p)), 0), 1)} mm round`,
      );
    }

    // The armscye by its rule: the plane through the shoulder joint centre square to the thorax's lateral axis (`FamilyConicArmscyeRule`,
    // `plane(0, 0)`), cutting the stored skin on the +Z side; the outermost crossing in front and behind at every station.
    const gh: V3 = Placement.frame("humerus").origin;
    const lateral: V3 = Placement.frame("thorax").axes[2];
    const side = (s: number, t: number): number => dot(sub(storedFull.point(s, t), gh), lateral);
    const front: [number, number][] = [];
    const back: [number, number][] = [];
    let odd: number = 0;
    for (const s of every(380, 700, 0.5)) {
      const crossings: number[] = [];
      let previous: number = side(s, 0);
      for (let j: number = 1; j <= 720; ++j) {
        const t: number = (Math.PI * j) / 720;
        const now: number = side(s, t);
        if (previous < 0 !== now < 0) {
          let [low, high]: [number, number] = [t - Math.PI / 720, t];
          for (let i: number = 0; i < 40; ++i) {
            const middle: number = (low + high) / 2;
            if (side(s, middle) < 0 === previous < 0) low = middle;
            else high = middle;
          }
          crossings.push((low + high) / 2);
        }
        previous = now;
      }
      if (crossings.length === 0) continue;
      if (crossings.length !== 2) ++odd;
      front.push([s, crossings[0]!]);
      back.push([s, crossings.at(-1)!]);
    }
    if (front.length < 4) lines.push("arm by rule: the plane does not cut the skin");
    else {
      const cut: [number, number][] = [...front, ...back.reverse()];
      const ruleWorld: V3[] = cut.map(([s, t]: [number, number]): V3 => storedFull.point(s, t));
      const inNew: [number, number][] = cut.map(([s]: [number, number], k: number): [number, number] => [s, angleAt(madeBare.axis, s, ruleWorld[k]!)]);
      const rule: IAutoMovieConstructionPortLoop = around(inNew, 192, 1);
      const ruleColumns: V3[] = worldOf(madeFull, rule);
      const today: V3[] = worldOf(storedFull, AutoMovieHumanF1.ROOT_CONTROLS.arm[0]);
      emit("arm[0] by rule", rule);
      const toward = (p: V3): string => {
        const along: V3 = unit(sub(storedBare.axis.at(knots.at(-1)!).origin, storedBare.axis.at(knots[0]!).origin));
        const s: number = knots[0]! + dot(sub(p, storedBare.axis.at(knots[0]!).origin), along);
        return `station ${fixed(s, 1)} phase ${fixed(angleAt(storedBare.axis, s, p), 3)}`;
      };
      const farthest = (from: readonly V3[], onto: readonly V3[]): V3 => from.reduce((best: V3, p: V3): V3 => (toPolyline(p, onto) > toPolyline(best, onto) ? p : best), from[0]!);
      lines.push(
        `arm by rule: plane through the shoulder joint centre ${JSON.stringify(gh.map((x: number): number => round(x, 2)))} with normal ${JSON.stringify(lateral.map((x: number): number => round(x, 4)))}; it cuts the stored skin from station ${cut[0]![0]} to ${front.at(-1)![0]} (${odd} stations with other than two crossings, the outermost taken); ${describe(rule)}; clock premise least step ${clock(rule).toExponential(3)}; ${turnOf("arm", ruleColumns)}`,
        `arm by rule against recorded: the rule's columns to the recorded loop ${off(ruleColumns, today)}, farthest at ${toward(farthest(ruleColumns, today))}; recorded columns to the rule's loop ${off(today, ruleColumns)}, farthest at ${toward(farthest(today, ruleColumns))}; the encoded rule loop to its own cut ${off(ruleColumns, ruleWorld)}`,
      );
    }
    await fs.writeFile(folder + "/switch-in-loops.txt", loopsText.join("\n") + "\n");

    // The open lower end's ring as the split's two bands sample it: `m` columns each, uniform in host phase between the forks at 0 and pi.
    lines.push("", `-- the end ring at station ${knots[0]} as the split band samples it (144 columns a band, uniform host phase; corner 0.6 rad) --`);
    const end: number = knots[0]! + 1e-6;
    for (const [label, ring] of [["stored chart", storedFull], ["new chart", madeFull]] as const) {
      for (const band of [0, 1]) {
        const points: V3[] = Array.from({ length: 145 }, (_: unknown, k: number): V3 => ring.point(end, band * Math.PI + (Math.PI * k) / 144));
        const chords: number[] = points.slice(1).map((p: V3, k: number): number => length(sub(p, points[k]!)));
        const turn = (k: number): number => (Math.acos(Math.max(-1, Math.min(1, dot(unit(sub(points[k + 1]!, points[k]!)), unit(sub(points[k + 2]!, points[k + 1]!)))))) * 180) / Math.PI;
        const arc = (from: number, to: number): number => {
          let sum: number = 0;
          let previous: V3 = ring.point(end, from);
          for (let i: number = 1; i <= 400; ++i) {
            const p: V3 = ring.point(end, from + ((to - from) * i) / 400);
            sum += length(sub(p, previous));
            previous = p;
          }
          return sum;
        };
        // The station line through each column (the host phase held), beside the stored chart's station line through the same skin point.
        let [lean, leanAt, slow, fast]: [number, number, number, number] = [0, NaN, Infinity, 0];
        points.forEach((p: V3, k: number): void => {
          const t: number = band * Math.PI + (Math.PI * k) / 144;
          const own: V3 = sub(ring.point(end + 0.5, t), p);
          const tau: number = angleAt(storedFull.axis, end, p);
          const was: V3 = sub(storedFull.point(end + 0.5, tau), storedFull.point(end, tau));
          const a: number = (Math.acos(Math.max(-1, Math.min(1, dot(unit(own), unit(was))))) * 180) / Math.PI;
          if (a > lean) [lean, leanAt] = [a, k];
          [slow, fast] = [Math.min(slow, length(own) / 0.5), Math.max(fast, length(own) / 0.5)];
        });
        const first: number = band * Math.PI;
        lines.push(
          `${label}, band ${band}: chords ${fixed(Math.min(...chords), 2)} to ${fixed(Math.max(...chords), 2)} mm (ratio ${fixed(Math.max(...chords) / Math.min(...chords), 2)}); turn at the first fork ${fixed(Math.max(turn(0), turn(1)), 2)} deg, at the last ${fixed(Math.max(turn(141), turn(142)), 2)} deg; the corner's 0.6 rad covers ${fixed(arc(first, first + 0.6), 1)} mm of the ring from the first fork and ${fixed(arc(first + Math.PI - 0.6, first + Math.PI), 1)} mm to the last; station speed ${fixed(slow, 3)} to ${fixed(fast, 3)}; station line off the stored chart's through the same point by at most ${fixed(lean, 2)} deg (column ${leanAt})`,
        );
      }
    }
  }

  /** Measure every candidate and write the report. */
  export async function main(): Promise<void> {
    const trunk: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1.BODY.trunk;
    const knots: number[] = trunk.knots;
    const layout: IAutoMovieHumanConicSection.ILayout = trunk.layout;
    const step: number = Number(argument("step") ?? "0.5");
    const old: (s: number) => number[] = H.reader(trunk);
    const reach: number =
      knots.reduce((sum: number, s: number): number => {
        const chain: IAutoMovieHumanConicSection.IChain = S.resolve(old(s), layout);
        return sum + chain.guides.reduce((inner: number, k: number): number => inner + Math.hypot(chain.input.points[k]![0], chain.input.points[k]![1]), 0) / chain.guides.length;
      }, 0) / knots.length;
    const lines: string[] = [`trunk: ${knots.length} knots ${knots[0]} to ${knots.at(-1)} mm; mean guide reach ${fixed(reach, 2)} mm; sweep every ${step} mm`];

    // The sections about today's course, at every swept station.
    const stations: number[] = [];
    for (let s: number = knots[0]!; s <= knots.at(-1)! + 1e-9; s += step) stations.push(Math.min(s, knots.at(-1)!));
    const before: IReading[] = stations.map((s: number): IReading => reading(old(s), layout));

    // The skeletal datum line and the raw centres, at the knots.
    const skeleton: ([number, number] | null)[] = Law.skeleton(trunk);
    const raw: IAutoMovieHumanConicRecentre.ILine = Law.centreLine(trunk, "sections", 0);

    // Two other readings of a section's own centre, beside the mean of the four guides the course law takes: the middle of the depth on the
    // median line, about which the front and the back reach are equal, and the centroid of the section's area. Each is smoothed as the
    // course law smooths its centres: a Gaussian over the knots, each weighted by the course it stands for.
    const span: number[] = knots.map((s: number, k: number): number => ((knots[k + 1] ?? s) - (knots[k - 1] ?? s)) / 2);
    // A scale written `local` or `local*<factor>` is each knot's own mean guide reach (times the factor): the centre at a station is then
    // averaged over the stretch of course its own section is wide, a neck over less of it than a pelvis.
    const local: number[] = knots.map((s: number): number => {
      const chain: IAutoMovieHumanConicSection.IChain = S.resolve(old(s), layout);
      return chain.guides.reduce((sum: number, k: number): number => sum + Math.hypot(chain.input.points[k]![0], chain.input.points[k]![1]), 0) / chain.guides.length;
    });
    const smooth = (centres: readonly number[], widths: readonly number[]): IAutoMovieHumanConicRecentre.ILine => ({
      v: knots.map((): number => 0),
      u: knots.map((s: number, k: number): number => {
        const width: number = widths[k]!;
        if (width === 0) return centres[k]!;
        let [sum, total]: [number, number] = [0, 0];
        knots.forEach((other: number, j: number): void => {
          const weight: number = span[j]! * Math.exp(-(((other - s) / width) ** 2) / 2);
          sum += weight * centres[j]!;
          total += weight;
        });
        return sum / total;
      }),
    });
    const depth: number[] = knots.map((s: number): number => {
      const r: IReading = reading(old(s), layout);
      return (r.front - r.back) / 2;
    });
    const area: number[] = knots.map((s: number): number => {
      const section: IAutoMovieViewChain.ISection = S.chain(old(s), layout);
      let [moment, total]: [number, number] = [0, 0];
      for (let j: number = 0; j < ROUND; ++j) {
        const [a, b]: number[] = [(2 * Math.PI * j) / ROUND, (2 * Math.PI * (j + 1)) / ROUND];
        const [p, q]: number[] = [AutoMovieViewChain.radius(section, a!), AutoMovieViewChain.radius(section, b!)];
        const cross: number = p! * q! * Math.sin(b! - a!);
        moment += ((p! * Math.cos(a!) + q! * Math.cos(b!)) * cross) / 3;
        total += cross;
      }
      return moment / total;
    });
    const scale = (text: string): number[] =>
      text.startsWith("local") ? local.map((r: number): number => r * (text.length > 5 ? Number(text.slice(6)) : 1)) : knots.map((): number => (text === "reach" ? reach : Number(text)));
    const candidates: [string, IAutoMovieHumanConicRecentre.ILine][] = (argument("scales") ?? "0,reach,line").split(",").map((text: string): [string, IAutoMovieHumanConicRecentre.ILine] => {
      if (text === "line") return ["line", straight(trunk)];
      if (text === "centre") return ["centre", TrunkCentre.line(trunk)];
      if (text.startsWith("depth@")) return [text, smooth(depth, scale(text.slice(6)))];
      if (text.startsWith("area@")) return [text, smooth(area, scale(text.slice(5)))];
      if (text.startsWith("guides@")) return [text, smooth(raw.u, scale(text.slice(7)))];
      return [text, Law.centreLine(trunk, "sections", text === "reach" ? reach : Number(text))];
    });
    const chosen: string | undefined = argument("loft");

    for (const [label, line] of candidates) {
      lines.push("", `== candidate ${label} ==`);
      const values: number[][] = moved(trunk, line);
      let verdict: string = "admitted at every knot and middle";
      try {
        const made: number[][] = Recentre.shift(trunk, line);
        if (!made.every((row: number[], f: number): boolean => row.every((x: number, m: number): boolean => Object.is(x, values[f]![m])))) verdict += "; BUT its values are not the plain subtraction";
      } catch (error: unknown) {
        verdict = "REFUSED: " + (error instanceof Error ? error.message : String(error));
      }
      lines.push(`Recentre.shift: ${verdict}`);
      const origin: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(knots, line.u);
      const own: (s: number) => number[] = H.reader({ knots, values });

      // The line's own slope and bend.
      let [slope, bend]: [number, number] = [0, 0];
      for (const s of stations) {
        const [d1, d2]: [number, number] = AutoMovieNaturalSpline.derivative(origin, s);
        slope = Math.max(slope, Math.abs(d1));
        bend = Math.max(bend, Math.abs(d2));
      }
      lines.push(`origin line: greatest slope ${fixed(slope, 4)} mm/mm, greatest second derivative ${fixed(bend * 1000, 3)} per metre`);

      // The fine sweep.
      const faults: string[] = [];
      const near: string[] = [];
      let [anchors, skin]: [number, number] = [0, 0];
      let [anchorsAt, skinAt]: [number, number] = [NaN, NaN];
      const worst: { ratioOld: number; ratioNew: number; starOld: number; starNew: number; spacingOld: number; spacingNew: number; share: number; shareAt: number; starAt: number } = {
        ratioOld: Infinity,
        ratioNew: Infinity,
        starOld: Infinity,
        starNew: Infinity,
        spacingOld: 0,
        spacingNew: 0,
        share: Infinity,
        shareAt: NaN,
        starAt: NaN,
      };
      const after: IReading[] = [];
      stations.forEach((s: number, i: number): void => {
        const [a, b]: number[][] = [old(s), own(s)];
        const c: number = AutoMovieNaturalSpline.evaluate(origin, s);
        const now: IReading = reading(b!, layout);
        after.push(now);
        const was: IReading = before[i]!;
        if (was.fault !== null) faults.push(`${s}: the stored section is refused: ${was.fault}`);
        if (now.fault !== null) {
          faults.push(`${s}: ${now.fault}`);
          return;
        }
        // Every anchor of the old chain less the move against the new chain's.
        const [p, q]: IAutoMovieViewChain.IInput[] = [S.resolve(a!, layout).input, S.resolve(b!, layout).input];
        p!.points.forEach((point: number[], k: number): void => {
          const d: number = Math.hypot(point[0]! - c - q!.points[k]![0]!, point[1]! - q!.points[k]![1]!);
          if (d > anchors) [anchors, anchorsAt] = [d, s];
          const turn: number = p!.tangents[k]![0]! * q!.tangents[k]![1]! - p!.tangents[k]![1]! * q!.tangents[k]![0]!;
          const along: number = p!.tangents[k]![0]! * q!.tangents[k]![0]! + p!.tangents[k]![1]! * q!.tangents[k]![1]!;
          if (!(along > 0) || Math.abs(turn) > 1e-9 * Math.hypot(...p!.tangents[k]!) * Math.hypot(...q!.tangents[k]!)) faults.push(`${s}: anchor ${k}'s tangent changes about the new origin`);
        });
        // The old skin point along the same ray from the new origin.
        if (was.fault === null) {
          const [sectionOld, sectionNew]: IAutoMovieViewChain.ISection[] = [S.chain(a!, layout), S.chain(b!, layout)];
          for (let j: number = 0; j < 48; ++j) {
            const t: number = (2 * Math.PI * (j + 0.37)) / 48;
            const r: number = AutoMovieViewChain.radius(sectionOld!, t);
            const [x, y]: [number, number] = [r * Math.cos(t) - c, r * Math.sin(t)];
            const d: number = Math.abs(Math.hypot(x, y) - AutoMovieViewChain.radius(sectionNew!, Math.atan2(y, x)));
            if (d > skin) [skin, skinAt] = [d, s];
          }
        }
        const share: number = Math.min(now.front, now.back) / (now.front + now.back);
        if (share < worst.share) [worst.share, worst.shareAt] = [share, s];
        if (now.star < worst.starNew) [worst.starNew, worst.starAt] = [now.star, s];
        worst.starOld = Math.min(worst.starOld, was.star);
        worst.ratioOld = Math.min(worst.ratioOld, Math.min(was.back / was.front, was.front / was.back));
        worst.ratioNew = Math.min(worst.ratioNew, Math.min(now.back / now.front, now.front / now.back));
        worst.spacingOld = Math.max(worst.spacingOld, was.spacing);
        worst.spacingNew = Math.max(worst.spacingNew, now.spacing);
        if (share < 0.1 || now.star < 0.1) near.push(`${s}: origin at ${fixed(share, 3)} of the depth from the nearer extreme, star margin ${fixed(now.star, 3)} (stored ${fixed(was.star, 3)})`);
      });
      lines.push(`admission over ${stations.length} stations: ${faults.length === 0 ? "every section admitted, every tangent kept" : faults.length + " refusals"}`);
      lines.push(...faults.slice(0, 40).map((text: string): string => "  refused " + text));
      lines.push(`round trip in the chart: anchors within ${anchors.toExponential(2)} mm (worst at ${anchorsAt}), skin along the ray within ${skin.toExponential(2)} mm (worst at ${skinAt})`);
      lines.push(
        `limits: origin no nearer an extreme than ${fixed(worst.share, 3)} of the depth (at ${worst.shareAt}); star margin ${fixed(worst.starNew, 3)} (at ${worst.starAt}) against ${fixed(worst.starOld, 3)} stored`,
        `sampling: least back/front reach ratio ${fixed(worst.ratioNew, 3)} against ${fixed(worst.ratioOld, 3)} stored; greatest chord ratio ${fixed(worst.spacingNew, 2)} against ${fixed(worst.spacingOld, 2)} stored`,
        `within 10 % of a limit at ${near.length} stations${near.length === 0 ? "" : ":"}`,
        ...near.slice(0, 60).map((text: string): string => "  near " + text),
        "station | raw centre | origin u | skeleton u | front | back (stored) | front | back (new) | origin share of depth (its offset from the skeleton over the depth) | least reach ratio stored > new | star stored > new | chord ratio stored > new",
      );
      knots.forEach((s: number, k: number): void => {
        const i: number = stations.findIndex((x: number): boolean => Math.abs(x - s) < 1e-9);
        const [was, now]: (IReading | undefined)[] = [before[i], after[i]];
        if (was === undefined || now === undefined || was.fault !== null || now.fault !== null) {
          lines.push(`${s} | not on the sweep or refused`);
          return;
        }
        lines.push(
          [
            String(s),
            fixed(raw.u[k]!),
            fixed(line.u[k]!),
            skeleton[k] === null ? "none" : fixed(skeleton[k]![0]),
            fixed(was.front),
            fixed(was.back),
            fixed(now.front),
            fixed(now.back),
            fixed((line.u[k]! + was.back) / (was.front + was.back), 3) + (skeleton[k] === null ? "" : " (skeleton " + fixed((line.u[k]! - skeleton[k]![0]) / (was.front + was.back), 3) + ")"),
            fixed(Math.min(was.back / was.front, was.front / was.back), 3) + " > " + fixed(Math.min(now.back / now.front, now.front / now.back), 3),
            fixed(was.star, 3) + " > " + fixed(now.star, 3),
            fixed(was.spacing, 2) + " > " + fixed(now.spacing, 2),
          ].join(" | "),
        );
      });

      if (label !== chosen) continue;

      // Through the engine: the stored wall and the re-centred wall on its moved course, bare and open, compared between the layers.
      const base: IAutoMovieViewAxis.IAxis = H.axis(trunk);
      const course: IAutoMovieViewAxis.IAxis = Recentre.axis(base, knots, line);
      const requested: number[] = [];
      for (let s: number = knots[0]!; s <= knots.at(-1)!; s += 2) requested.push(s);
      const world = (chain: IAutoMovieLoftChain, s: number, t: number): V3 => AutoMovieLoftChain.point(chain, s, t) as V3;
      const compare = (what: string, stored: IAutoMovieLoftChain, made: IAutoMovieLoftChain, from: number, to: number, pace: number): void => {
        let [gap, gapAt, polar]: [number, number[], number] = [0, [NaN, NaN], 0];
        let sum: number = 0;
        let count: number = 0;
        for (let s: number = from; s <= to + 1e-9; s += pace)
          for (let j: number = 0; j < 96; ++j) {
            const t: number = (2 * Math.PI * (j + 0.37)) / 96;
            const p: V3 = world(stored, s, t);
            const [f, g] = [base.at(s), course.at(s)];
            const about = (o: readonly number[], axis: readonly number[]): number => (p[0] - o[0]!) * axis[0]! + (p[1] - o[1]!) * axis[1]! + (p[2] - o[2]!) * axis[2]!;
            const angle: number = Math.atan2(about(f.origin, f.v), about(f.origin, f.u));
            polar = Math.max(polar, Math.abs(Math.atan2(Math.sin(angle - t), Math.cos(angle - t))));
            const q: V3 = world(made, s, Math.atan2(about(g.origin, g.v), about(g.origin, g.u)));
            const d: number = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
            sum += d;
            ++count;
            if (d > gap) [gap, gapAt] = [d, [s, t]];
          }
        lines.push(`${what}: stations ${from} to ${to} every ${pace} mm, 96 phases: mean ${(sum / count).toExponential(2)} mm, greatest ${gap.toExponential(2)} mm at station ${gapAt[0]} phase ${fixed(gapAt[1]!, 3)}; the stored chain's phase is the polar angle within ${polar.toExponential(2)} rad`);
      };
      lines.push("", `-- through the engine's view loft (${label}) --`);
      const bare: IAutoMovieHumanConicLoft.IFamily = { ...trunk, reliefs: undefined, tips: undefined, turn: undefined };
      const storedWall: IAutoMovieLoftChain = loft(H.part(bare, requested));
      const madeWall: IAutoMovieLoftChain = loft({ ...H.part({ ...bare, values }, requested), axis: course });
      compare("bare open wall", storedWall, madeWall, knots[0]! + 0.5, knots.at(-1)! - 0.5, 1);

      // Stage 1 of the re-base, prepared and measured: the family as it would be stored, its cap, its nets, its port loops and its end ring.
      if (argument("stage") !== undefined) await stage(trunk, line, requested, lines, argument("stage")!);
    }
    const out: string | undefined = argument("out");
    if (out !== undefined) await fs.writeFile(out, lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\n");
  }
}

void FamilyConicTrunkCentre.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
