import { FamilyConicLandmarkKnots as Knots } from "./FamilyConicLandmarkKnots";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { AutoMovieEngineLoftViewFullSource, AutoMovieEngineViewChain } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicRelief,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanF1,
  AutoMovieHumanF1Joints,
  AutoMovieHumanF1NativeSites,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewAxis,
  IAutoMovieViewChain,
} from "@automovie/interface";
import { type Canvas, createCanvas, ImageData, type SKRSContext2D } from "@napi-rs/canvas";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Every part of the body below the head laid out side by side: what each family is stored as, and, at stations along each family's own
 * course, its bare wall, its skin (the wall with its relief nets) and the reference cut by the same plane.
 *
 * - `parts.txt`: one row per family (knots, fields, wall numbers, tips) and one per relief net (window, grid, stored heights, their least,
 *   greatest and root mean square).
 * - `<family>.stations.txt`: one row per station: the four reaches of the wall, the skin and the reference along `+u`, `+v`, `-u`, `-v`;
 *   each section's girth, taut tape (the girth of its convex hull), area and box fill (area over depth times breadth: `pi / 4` for an
 *   ellipse, `1 / 2` for a rhombus, `1` for a box); how far the skin stands off the wall (what the nets carry there); and how far the
 *   reference stands off the skin, with the count of rays that meet the reference's loop more than once (not star-shaped about the course).
 * - `<family>.map.png`: the family unrolled, station up the picture and phase across it from `-pi` to `3 pi / 2` (a quarter turn drawn
 *   twice, so neither the front nor the back median is split): on the left the skin less the wall, on the right the reference less the
 *   skin, blue inward and red outward.
 *
 * It reads the stored figure and the reference, fits nothing and emits nothing a generation module reads.
 *
 * Usage, from `test/`: bundle this file with the repository's esbuild options (`pnpm conic:build`), then
 * `node .shots/esbuild/FamilyConicBodyParts.cjs [--only=<family>,...] [--out=<directory>]`. Output under
 * `packages/human/.shots/body-one-shot/<stamp>` unless `--out` names a directory.
 */
namespace FamilyConicBodyParts {
  type V = R.V;
  type P = C.P;

  /** One family to lay out. */
  interface IPart {
    /** The stored family as the figure lofts it. */
    family: IAutoMovieHumanConicLoft.IFamily;

    /** Spacing of its stations, mm. */
    step: number;

    /** The reference mesh its planes cut. */
    mesh: "body" | "all";

    /** The last station read, mm; absent, the family's whole domain. */
    to?: number;
  }

  /** Rays round a section, one a degree. */
  const RAYS: number = 360;

  /** Columns of a map: `-pi` to `3 pi / 2`, one a degree. */
  const COLUMNS: number = 450;

  /** Pixels a map's cell takes across and along. */
  const CELL: [number, number] = [2, 3];

  /** Height the left map's colour saturates at, mm: the nets' heights lie within it but for the folds' floors. */
  const NET_MM: number = 8;

  /** Height the right map's colour saturates at, mm. */
  const MISS_MM: number = 3;

  /**
   * The trunk's last station read, mm: the bitragion midpoint (the head's origin, station 783 of the stored course) less the 43 mm the
   * jaw's floor stands under it on the front median (the stored wall's front extreme rises from 58.8 to 97.2 mm between its knots at 696
   * and 716). Above it the sections hold the head, which this survey leaves out.
   */
  const TRUNK_TO_MM: number = 740;

  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const fixed = (x: number, digits: number = 2): string => (Number.isFinite(x) ? x.toFixed(digits) : "-");

  /** Every crossing of the ray from the chart's origin at `theta` with a closed polygon, as distances along the ray, mm. */
  function crossings(polygon: readonly P[], theta: number): number[] {
    const d: P = [Math.cos(theta), Math.sin(theta)];
    const out: number[] = [];
    for (let i: number = 0; i < polygon.length; ++i) {
      const a: P = polygon[i]!;
      const b: P = polygon[(i + 1) % polygon.length]!;
      const e: P = [b[0] - a[0], b[1] - a[1]];
      const denominator: number = d[0] * e[1] - d[1] * e[0];
      if (denominator === 0) continue;
      const t: number = (a[0] * d[1] - a[1] * d[0]) / denominator;
      const r: number = (a[0] * e[1] - a[1] * e[0]) / denominator;
      if (t >= 0 && t < 1 && r > 0) out.push(r);
    }
    return out;
  }

  /** Length of a closed polygon, mm. */
  function girth(polygon: readonly P[]): number {
    let sum: number = 0;
    for (let i: number = 0; i < polygon.length; ++i) {
      const a: P = polygon[i]!;
      const b: P = polygon[(i + 1) % polygon.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return sum;
  }

  /** A section's readings. */
  interface IMeasure {
    /** Length of the section, mm. */
    girth: number;

    /** Length of its convex hull, the taut tape, mm. */
    tape: number;

    /** Its area, mm^2. */
    area: number;

    /** Its greatest `u`, greatest `v`, least `u` and least `v`, mm. */
    box: [number, number, number, number];

    /** Its area over its box's. */
    fill: number;

    /** Its area's centroid in the chart, mm: where the section's middle stands off the course. */
    centre: P;
  }

  /** A section's girth, taut tape, area, box, box fill and centroid. */
  function measure(polygon: readonly P[]): IMeasure {
    const us: number[] = polygon.map((p: P): number => p[0]);
    const vs: number[] = polygon.map((p: P): number => p[1]);
    const box: [number, number, number, number] = [Math.max(...us), Math.max(...vs), Math.min(...us), Math.min(...vs)];
    const signed: number = R.area(polygon);
    const centre: P = [0, 0];
    for (let i: number = 0; i < polygon.length; ++i) {
      const a: P = polygon[i]!;
      const b: P = polygon[(i + 1) % polygon.length]!;
      const w: number = a[0] * b[1] - b[0] * a[1];
      centre[0] += (a[0] + b[0]) * w;
      centre[1] += (a[1] + b[1]) * w;
    }
    const area: number = Math.abs(signed);
    return { girth: girth(polygon), tape: girth(R.hull(polygon)), area, box, fill: area / ((box[0] - box[2]) * (box[1] - box[3])), centre: [centre[0] / (6 * signed), centre[1] / (6 * signed)] };
  }

  /** One station of a family: its frame, its wall where the fields own the section, its skin and the reference's cut. */
  interface IStation {
    /** The wall's radius by phase, or null past the fields' last section or where the chain is refused. */
    wall: ((theta: number) => number) | null;

    /** The wall sampled round, or null. */
    wallPolygon: P[] | null;

    /** The skin's points projected on the station's plane. */
    skinPolygon: P[];

    /** The reference's loop round the course point, or null. */
    reference: P[] | null;

    /** The greatest distance of a skin point from the station's plane, mm. */
    off: number;
  }

  /** What reads one family's stations. */
  interface IReading {
    /** The family. */
    family: IAutoMovieHumanConicLoft.IFamily;

    /** Its course. */
    axis: IAutoMovieViewAxis.IAxis;

    /** Its field vector by station. */
    read: (s: number) => number[];

    /** Its skin by station and phase. */
    skin: IAutoMovieLoftViewFullSource.IReader;

    /** The reference mesh its planes cut. */
    mesh: R.ISource["body"];
  }

  /** Prepare one family's readers. */
  function reading(part: IPart, source: R.ISource): IReading {
    return { family: part.family, axis: H.axis(part.family), read: H.reader(part.family), skin: AutoMovieEngineLoftViewFullSource.create(H.source(part.family)), mesh: source[part.mesh] };
  }

  /** Read one station of a family. */
  function stationAt(of: IReading, s: number): IStation {
    const family: IAutoMovieHumanConicLoft.IFamily = of.family;
    const frame: IAutoMovieLoftSectionFrame = of.axis.at(s);
    const normal: V = [frame.v[1]! * frame.u[2]! - frame.v[2]! * frame.u[1]!, frame.v[2]! * frame.u[0]! - frame.v[0]! * frame.u[2]!, frame.v[0]! * frame.u[1]! - frame.v[1]! * frame.u[0]!];
    const wallTo: number = Math.min(family.tips?.[1]?.from ?? Infinity, family.knots.at(-1)!);

    // The wall: the conic chain of the stored fields, where the fields own the section.
    const section: IAutoMovieViewChain.ISection | null = s <= wallTo && s >= family.knots[0]! ? S.chain(of.read(s), family.layout) : null;
    const wall: ((theta: number) => number) | null = section === null || section.fault !== null ? null : (theta: number): number => AutoMovieEngineViewChain.radius(section, theta);
    const wallPolygon: P[] | null =
      wall === null
        ? null
        : Array.from({ length: RAYS }, (_: unknown, k: number): P => {
            const theta: number = (2 * Math.PI * k) / RAYS;
            const r: number = wall(theta);
            return [r * Math.cos(theta), r * Math.sin(theta)];
          });

    // The skin: the wall with its nets, read as points and projected on the station's plane.
    let off: number = 0;
    const skinPolygon: P[] = Array.from({ length: RAYS }, (_: unknown, k: number): P => {
      const p: V = of.skin.point(s, (2 * Math.PI * k) / RAYS) as V;
      const local: V = [p[0] - frame.origin[0]!, p[1] - frame.origin[1]!, p[2] - frame.origin[2]!];
      off = Math.max(off, Math.abs(dot(local, normal)));
      return [dot(local, frame.u), dot(local, frame.v)];
    });

    // The reference: the same plane's cut.
    return { wall, wallPolygon, skinPolygon, reference: R.cut(of.mesh, frame).loop, off };
  }

  /**
   * The half ellipsoid that best draws a closed end: its length `H` before the pole and the mean reach `R` of the section it starts
   * from, by least squares of `r(d) = R sqrt(1 - (1 - d / H)^2)` on the sections' mean reaches (girth over `2 pi`) at distances `d` from
   * the pole. `H / R` is 1 for a hemisphere, more for a tapered end and less for a blunt one.
   *
   * @param readings Each section's distance before the pole and its mean reach, mm.
   * @returns The length, the base reach and the root mean square miss, mm, or null when fewer than three sections lie on any trial dome.
   */
  function dome(readings: readonly [number, number][]): { length: number; reach: number; rms: number } | null {
    let best: { length: number; reach: number; rms: number } | null = null;
    const farthest: number = Math.max(0, ...readings.map(([d]: [number, number]): number => d));
    for (let length: number = 2; length <= farthest; length += 0.25) {
      // The base's reach is read at the section nearest the trial length.
      const base: [number, number] = readings.reduce((a: [number, number], b: [number, number]): [number, number] => (Math.abs(b[0] - length) < Math.abs(a[0] - length) ? b : a));
      const on: [number, number][] = readings.filter(([d]: [number, number]): boolean => d > 0 && d <= length);
      if (on.length < 3) continue;
      const rms: number = Math.sqrt(on.reduce((sum: number, [d, r]: [number, number]): number => sum + (r - base[1] * Math.sqrt(Math.max(0, 1 - (1 - d / length) ** 2))) ** 2, 0) / on.length);
      if (best === null || rms < best.rms) best = { length, reach: base[1], rms };
    }
    return best;
  }

  /** Each digit family's stored pad datum (`AutoMovieHumanF1Joints`): the far point of its pad, which its course's last line runs through. */
  const PADS: Record<string, keyof typeof AutoMovieHumanF1Joints> = {
    "finger.index": "indexPad",
    "finger.middle": "middlePad",
    "finger.ring": "ringPad",
    "finger.pinky": "pinkyPad",
    "finger.thumb": "thumbPad",
    "toe.big": "bigtoePad",
    "toe.index": "indextoePad",
    "toe.middle": "middletoePad",
    "toe.ring": "ringtoePad",
    "toe.little": "littletoePad",
  };

  /** Spacing of the search for a point's nearest station on a course, mm. */
  const NEAREST_MM: number = 0.02;

  /**
   * Where a digit's stored pad datum stands against its pole and against the reference's end: the datum's station on the course and
   * its distance from it, and the reference's last sections' centroids, where its end gathers.
   *
   * @param of The digit's readers.
   * @param pole The pole's station, mm.
   * @param last The reference's last sections that held a loop, each its station and its centroid in the chart, mm, nearest the pole last.
   */
  function pad(of: IReading, pole: number, last: readonly [number, P][]): string {
    const key: keyof typeof AutoMovieHumanF1Joints | undefined = PADS[of.family.name];
    if (key === undefined) return "";
    const datum: V = AutoMovieHumanF1Joints[key] as V;
    let best: { station: number; distance: number } = { station: NaN, distance: Infinity };
    for (let s: number = of.family.knots.at(-1)! - 20; s <= pole + 6; s += NEAREST_MM) {
      const origin: readonly number[] = of.axis.at(s).origin;
      const distance: number = Math.hypot(datum[0] - origin[0]!, datum[1] - origin[1]!, datum[2] - origin[2]!);
      if (distance < best.distance) best = { station: s, distance };
    }
    return (
      "pad datum at station " + fixed(best.station) + ", " + fixed(best.distance) + " mm off the course; pole at " + fixed(pole) + " (" + fixed(pole - best.station) + " mm past the datum); reference's last sections' centres " +
      last.map(([s, c]: [number, P]): string => fixed(s, 1) + ": [" + fixed(c[0]) + ", " + fixed(c[1]) + "]").join(", ")
    );
  }

  /** A diverging colour: blue at `-1`, white at `0`, red at `1`; grey where there is no reading. */
  function colour(share: number): [number, number, number] {
    if (!Number.isFinite(share)) return [150, 150, 150];
    const t: number = Math.max(-1, Math.min(1, share));
    const fade: number = Math.round(255 * (1 - Math.abs(t)));
    return t < 0 ? [fade, fade, 255] : [255, fade, fade];
  }

  /** The stored figure's families below the head: the trunk up to the jaw's floor, the limbs, the breast and the ten digits. */
  function parts(): IPart[] {
    const body: typeof AutoMovieHumanF1.BODY = AutoMovieHumanF1.BODY;
    return [
      { family: body.trunk, step: 4, mesh: "all", to: TRUNK_TO_MM },
      { family: body.breast, step: 1, mesh: "body" },
      { family: body.arm, step: 4, mesh: "body" },
      { family: body.hand, step: 2, mesh: "body" },
      { family: body.leg, step: 4, mesh: "body" },
      ...AutoMovieHumanF1.DIGITS.map((digit: IAutoMovieHumanF1.IDigit): IPart => ({ family: digit.family, step: 1, mesh: "body" })),
    ];
  }

  /** The stored rows of one family: its wall and each of its nets. */
  function stored(family: IAutoMovieHumanConicLoft.IFamily): string[] {
    const rows: string[] = [];
    rows.push(
      [
        family.name,
        "wall",
        "knots " + family.knots.length + " (" + family.knots[0] + ".." + family.knots.at(-1) + ")",
        "fields " + family.values.length,
        "numbers " + family.knots.length * family.values.length,
        "centres " + family.centres.length,
        "halves [" + family.halves.join(", ") + "]",
        "anchors " + family.layout.anchors.length + (family.layout.mirror ? " mirrored" : ""),
        "tips " + JSON.stringify(family.tips ?? null),
      ].join("\t"),
    );
    for (const net of family.reliefs ?? []) {
      const heights: readonly number[] = net.heights;
      const live: number[] = heights.filter((h: number): boolean => h !== 0);
      const rms: number = Math.sqrt(live.reduce((sum: number, h: number): number => sum + h * h, 0) / Math.max(1, live.length));
      rows.push(
        [
          family.name,
          net.name,
          "stations " + net.stations.start + ".." + net.stations.end,
          "phases " + fixed(net.phases.start, 3) + ".." + fixed(net.phases.end, 3),
          net.rows + " x " + net.columns,
          "stored " + AutoMovieHumanConicRelief.stored(net),
          "nonzero " + live.length,
          "least " + fixed(Math.min(0, ...live)),
          "greatest " + fixed(Math.max(0, ...live)),
          "rms " + fixed(rms),
          "over 1 mm " + live.filter((h: number): boolean => Math.abs(h) > 1).length,
          "over 3 mm " + live.filter((h: number): boolean => Math.abs(h) > 3).length,
        ].join("\t"),
      );
    }
    return rows;
  }

  /** Lay one family out: its station table and its map. */
  async function layOut(part: IPart, source: R.ISource, out: string): Promise<string> {
    const family: IAutoMovieHumanConicLoft.IFamily = part.family;
    const of: IReading = reading(part, source);
    const from: number = Math.max(of.skin.domain[0], family.knots[0]!);
    const to: number = Math.min(of.skin.domain[1], part.to ?? Infinity);
    const stations: number[] = [];
    for (let s: number = Math.ceil(from / part.step) * part.step; s <= to; s += part.step) stations.push(s);
    const header: string[] = [
      "station",
      "wall +u", "wall +v", "wall -u", "wall -v", "wall girth", "wall fill",
      "skin +u", "skin +v", "skin -u", "skin -v", "skin girth", "skin tape", "skin area", "skin fill", "skin centre u", "skin centre v", "skin off plane",
      "net least", "net least at", "net greatest", "net greatest at",
      "ref +u", "ref +v", "ref -u", "ref -v", "ref girth", "ref tape", "ref area", "ref fill", "ref centre u", "ref centre v", "ref folded rays",
      "miss mean", "miss greatest", "miss greatest at",
    ];
    const digest: { off: number[]; fill: number[]; net: [number, number]; folded: number } = { off: [], fill: [], net: [0, 0], folded: 0 };

    // A family whose last end is visible skin closing in a pole (a digit, the breast) has its end read as a dome.
    const end: IAutoMovieHumanConicLoft.ITip | null | undefined = family.tips?.[1];
    const pole: number | undefined = end === null || end === undefined || end.covered === true ? undefined : end.tip;
    const ends: { skin: [number, number][]; reference: [number, number][] } = { skin: [], reference: [] };
    const gathers: [number, P][] = [];
    const lines: string[] = [header.join("\t")];
    const nets: number[][] = [];
    const misses: number[][] = [];
    let worst: { miss: number; station: number; phase: number } = { miss: 0, station: NaN, phase: NaN };
    let total: number = 0;
    let count: number = 0;
    for (const s of stations) {
      const { wall, wallPolygon, skinPolygon, reference, off }: IStation = stationAt(of, s);

      const netRow: number[] = [];
      const missRow: number[] = [];
      let netLeast: [number, number] = [0, NaN];
      let netGreatest: [number, number] = [0, NaN];
      let missGreatest: [number, number] = [0, NaN];
      let missSum: number = 0;
      let missCount: number = 0;
      let folded: number = 0;
      for (let k: number = 0; k < COLUMNS; ++k) {
        const theta: number = -Math.PI + (2 * Math.PI * k) / RAYS;
        const own: boolean = k < RAYS;
        const skinHits: number[] = crossings(skinPolygon, theta);
        const rSkin: number = skinHits.length === 0 ? NaN : Math.max(...skinHits);
        const net: number = wall === null ? NaN : rSkin - wall(theta);
        netRow.push(net);
        if (own && Number.isFinite(net)) {
          if (net < netLeast[0]) netLeast = [net, theta];
          if (net > netGreatest[0]) netGreatest = [net, theta];
        }
        const hits: number[] = reference === null ? [] : crossings(reference, theta);
        if (own && hits.length > 1) ++folded;
        const miss: number = hits.length === 0 ? NaN : Math.max(...hits) - rSkin;
        missRow.push(miss);
        if (own && Number.isFinite(miss)) {
          missSum += Math.abs(miss);
          ++missCount;
          if (Math.abs(miss) > Math.abs(missGreatest[0])) missGreatest = [miss, theta];
        }
      }
      nets.push(netRow);
      misses.push(missRow);
      total += missSum;
      count += missCount;
      if (Math.abs(missGreatest[0]) > Math.abs(worst.miss)) worst = { miss: missGreatest[0], station: s, phase: missGreatest[1] };

      const reach = (polygon: readonly P[] | null): string[] =>
        [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((theta: number): string => {
          const hits: number[] = polygon === null ? [] : crossings(polygon, theta);
          return hits.length === 0 ? "-" : fixed(Math.max(...hits));
        });
      const wallMeasure: IMeasure | null = wallPolygon === null ? null : measure(wallPolygon);
      const skinMeasure: IMeasure = measure(skinPolygon);
      const referenceMeasure: IMeasure | null = reference === null ? null : measure(reference);

      // A section at a pole has no area, so no centroid and no fill: it is left out of the digest.
      if (skinMeasure.area > 0) {
        digest.off.push(Math.hypot(skinMeasure.centre[0], skinMeasure.centre[1]));
        digest.fill.push(skinMeasure.fill);
      }
      digest.net = [Math.min(digest.net[0], netLeast[0]), Math.max(digest.net[1], netGreatest[0])];
      digest.folded += folded;
      if (pole !== undefined) {
        ends.skin.push([pole - s, skinMeasure.girth / (2 * Math.PI)]);
        if (referenceMeasure !== null) {
          ends.reference.push([pole - s, referenceMeasure.girth / (2 * Math.PI)]);
          gathers.push([s, referenceMeasure.centre]);
        }
      }
      lines.push(
        [
          fixed(s, 1),
          ...reach(wallPolygon),
          wallMeasure === null ? "-" : fixed(wallMeasure.girth, 1),
          wallMeasure === null ? "-" : fixed(wallMeasure.fill, 3),
          ...reach(skinPolygon),
          fixed(skinMeasure.girth, 1),
          fixed(skinMeasure.tape, 1),
          fixed(skinMeasure.area, 0),
          fixed(skinMeasure.fill, 3),
          fixed(skinMeasure.centre[0]),
          fixed(skinMeasure.centre[1]),
          fixed(off),
          fixed(netLeast[0]),
          fixed(netLeast[1], 2),
          fixed(netGreatest[0]),
          fixed(netGreatest[1], 2),
          ...reach(reference),
          referenceMeasure === null ? "-" : fixed(referenceMeasure.girth, 1),
          referenceMeasure === null ? "-" : fixed(referenceMeasure.tape, 1),
          referenceMeasure === null ? "-" : fixed(referenceMeasure.area, 0),
          referenceMeasure === null ? "-" : fixed(referenceMeasure.fill, 3),
          referenceMeasure === null ? "-" : fixed(referenceMeasure.centre[0]),
          referenceMeasure === null ? "-" : fixed(referenceMeasure.centre[1]),
          String(folded),
          missCount === 0 ? "-" : fixed(missSum / missCount),
          fixed(missGreatest[0]),
          fixed(missGreatest[1], 2),
        ].join("\t"),
      );
    }
    await fs.writeFile(path.join(out, family.name + ".stations.txt"), lines.join("\n") + "\n");

    // The map: the last station on top, the two panels side by side with a gap.
    const gap: number = 40;
    const left: number = 60;
    const top: number = 40;
    const panel: number = COLUMNS * CELL[0];
    const width: number = left + 2 * panel + gap + 10;
    const height: number = top + stations.length * CELL[1] + 30;
    const canvas: Canvas = createCanvas(width, height);
    const context: SKRSContext2D = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(panel * stations.length * CELL[1] * 4);
    const paint = (rows: number[][], limit: number, x: number): void => {
      for (let i: number = 0; i < stations.length; ++i) {
        const row: number[] = rows[stations.length - 1 - i]!;
        for (let k: number = 0; k < COLUMNS; ++k) {
          const [r, g, b]: [number, number, number] = colour(row[k]! / limit);
          for (let dy: number = 0; dy < CELL[1]; ++dy)
            for (let dx: number = 0; dx < CELL[0]; ++dx) pixels.set([r, g, b, 255], ((i * CELL[1] + dy) * panel + k * CELL[0] + dx) * 4);
        }
      }
      context.putImageData(new ImageData(pixels, panel, stations.length * CELL[1]), x, top);
    };
    paint(nets, NET_MM, left);
    paint(misses, MISS_MM, left + panel + gap);
    context.fillStyle = "#000000";
    context.font = "12px sans-serif";
    context.fillText(family.name + " | skin less wall, saturated at " + NET_MM + " mm (blue inward, red outward)", left, 14);
    context.fillText("reference less skin, saturated at " + MISS_MM + " mm; grey: no reading", left + panel + gap, 14);
    for (const x of [left, left + panel + gap])
      for (const [label, degrees] of [["-u", 0], ["-v", 90], ["+u", 180], ["+v", 270], ["-u", 360]] as [string, number][]) {
        context.fillText(label, x + degrees * CELL[0] - 6, 30);
        context.fillRect(x + degrees * CELL[0], top, 1, stations.length * CELL[1]);
      }
    const every: number = Math.max(1, Math.round(50 / part.step));
    for (let i: number = 0; i < stations.length; ++i)
      if ((stations.length - 1 - i) % every === 0) {
        const y: number = top + (stations.length - 1 - i) * CELL[1];
        context.fillText(fixed(stations[i]!, 0), 4, y + 4);
        context.fillRect(left - 6, y, 6, 1);
      }
    await fs.writeFile(path.join(out, family.name + ".map.png"), canvas.toBuffer("image/png"));
    return [family.name, "stations " + stations.length + " (" + fixed(stations[0] ?? NaN, 1) + ".." + fixed(stations.at(-1) ?? NaN, 1) + ")", "reference less skin: mean " + fixed(count === 0 ? NaN : total / count) + " mm", "greatest " + fixed(worst.miss) + " mm at station " + fixed(worst.station, 1) + " phase " + fixed(worst.phase, 2),
      "skin centre off the course: mean " + fixed(digest.off.reduce((a: number, b: number): number => a + b, 0) / Math.max(1, digest.off.length), 1) + " greatest " + fixed(Math.max(0, ...digest.off), 1) + " mm",
      "skin fill " + fixed(Math.min(...digest.fill), 3) + ".." + fixed(Math.max(...digest.fill), 3),
      "skin less wall " + fixed(digest.net[0], 1) + ".." + fixed(digest.net[1], 1) + " mm",
      "reference rays folded " + digest.folded,
      ...(pole === undefined
        ? []
        : (["reference", "skin"] as const).map((which: "reference" | "skin"): string => {
            const fit: { length: number; reach: number; rms: number } | null = dome(ends[which]);
            return (
              which + " end as a half ellipsoid: " +
              (fit === null ? "not read" : "length " + fixed(fit.length) + " on reach " + fixed(fit.reach) + " = " + fixed(fit.length / fit.reach) + " (rms " + fixed(fit.rms) + " mm)") +
              (which === "skin" ? "; cap from " + fixed(end!.from) + " to " + fixed(pole) + " = " + fixed(pole - end!.from) + " mm" : "")
            );
          })),
      ...(pole === undefined ? [] : [pad(of, pole, gathers.slice(-4))].filter((text: string): boolean => text.length > 0)),
    ].join("\t");
  }

  /**
   * Every measurement site of the native path (`AutoMovieHumanF1NativeSites.REFERENCE`) read on the skin and on the reference in its
   * family's own plane: depth and breadth as the section's extents along `u` and `v`, girth and taut tape.
   */
  function sites(chosen: readonly IPart[], source: R.ISource): string[] {
    const all: AutoMovieHumanF1NativeSites.ISites = AutoMovieHumanF1NativeSites.REFERENCE;
    const rows: string[] = [["site", "family", "station", "skin depth", "skin breadth", "skin girth", "skin tape", "ref depth", "ref breadth", "ref girth", "ref tape", "definition"].join("\t")];
    const readers: Map<string, IReading> = new Map();
    for (const [name, site] of [...Object.entries(all.wall), ...Object.entries(all.arm), ...Object.entries(all.leg), ...Object.entries(all.extremities)] as [string, AutoMovieHumanF1NativeSites.ISite][]) {
      const part: IPart | undefined = chosen.find((p: IPart): boolean => p.family.name === site.family);
      if (part === undefined) continue;
      let of: IReading | undefined = readers.get(site.family);
      if (of === undefined) {
        of = reading(part, source);
        readers.set(site.family, of);
      }
      if (site.station < of.skin.domain[0] || site.station > of.skin.domain[1]) {
        rows.push([name, site.family, fixed(site.station), "outside the family's stored domain " + fixed(of.skin.domain[0]) + ".." + fixed(of.skin.domain[1]), "", "", "", "", "", "", "", site.definition].join("\t"));
        continue;
      }
      const at: IStation = stationAt(of, site.station);
      const size = (m: IMeasure | null): string[] => (m === null ? ["-", "-", "-", "-"] : [fixed(m.box[0] - m.box[2], 1), fixed(m.box[1] - m.box[3], 1), fixed(m.girth, 1), fixed(m.tape, 1)]);
      rows.push([name, site.family, fixed(site.station), ...size(measure(at.skinPolygon)), ...size(at.reference === null ? null : measure(at.reference)), site.definition].join("\t"));
    }
    return rows;
  }

  /**
   * The knots the knot rule gives a family, against the knots it is stored with: its run ends (the course's joints inside its fitted
   * stations; the trunk's segment origins), its measurement sites and the extrema of its wall's own outlines (each extreme's own
   * coordinate along the course), thinned to half the section's mean reach. Each knot is listed with its basis and its place in its run.
   *
   * The outlines read are the stored wall's fields, which carry the trace's own small waves: the count is what the rule gives on
   * today's wall and is an upper reading of what a wall fitted on those knots will need.
   */
  function knotsOf(part: IPart): string {
    const family: IAutoMovieHumanConicLoft.IFamily = part.family;
    const all: AutoMovieHumanF1NativeSites.ISites = AutoMovieHumanF1NativeSites.REFERENCE;
    const sites: number[] = [
      ...[...Object.values(all.wall), ...Object.values(all.arm), ...Object.values(all.leg), ...Object.values(all.extremities)].filter((site: AutoMovieHumanF1NativeSites.ISite): boolean => site.family === family.name).map((site: AutoMovieHumanF1NativeSites.ISite): number => site.station),
      ...Object.values(all.digits).filter((site: AutoMovieHumanF1NativeSites.IDigitSite): boolean => site.family === family.name).map((site: AutoMovieHumanF1NativeSites.IDigitSite): number => site.station),
    ];
    const knots: Knots.IKnot[] = Knots.knots(family, { sites, step: part.step, ...(family.name === "trunk" ? { joints: all.runs.trunk } : {}), ...(part.to === undefined ? {} : { to: part.to }) });
    const last: number = knots.at(-1)!.station;
    return [
      family.name,
      "stored knots " + family.knots.filter((s: number): boolean => s <= last).length,
      "rule knots " + knots.length + " (run ends " + knots.filter((k: Knots.IKnot): boolean => k.basis === "run").length + ", sites " + knots.filter((k: Knots.IKnot): boolean => k.basis === "site").length + ", extrema " + knots.filter((k: Knots.IKnot): boolean => k.basis === "extremum").length + ")",
      knots.map((k: Knots.IKnot): string => fixed(k.station, 1) + " " + k.basis + " run " + k.run + " at " + fixed(k.tau, 3)).join("; "),
      Knots.argument(knots),
    ].join("\t");
  }

  /** Lay out the named families, or all of them. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const args: string[] = process.argv.slice(2);
    const option = (name: string): string | undefined => args.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3);
    const only: string[] | undefined = option("only")?.split(",");
    const out: string = option("out") ?? path.join(root, "packages/human/.shots/body-one-shot", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const source: R.ISource = await R.load(root);
    const chosen: IPart[] = parts().filter((part: IPart): boolean => only === undefined || only.includes(part.family.name));
    const audit: string[] = chosen.flatMap((part: IPart): string[] => stored(part.family));
    await fs.writeFile(path.join(out, "parts.txt"), audit.join("\n") + "\n");
    await fs.writeFile(path.join(out, "sites.txt"), sites(chosen, source).join("\n") + "\n");
    await fs.writeFile(path.join(out, "knots.txt"), chosen.map(knotsOf).join("\n") + "\n");
    if (args.includes("--knots")) return;
    const summary: string[] = [];
    for (const part of chosen) {
      const started: number = performance.now();
      const row: string = await layOut(part, source, out);
      summary.push(row + "\t" + fixed((performance.now() - started) / 1000, 1) + " s");
      process.stdout.write(summary.at(-1)! + "\n");
    }
    await fs.writeFile(path.join(out, "summary.txt"), summary.join("\n") + "\n");
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicBodyParts.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
