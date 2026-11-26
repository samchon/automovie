import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { AutoMovieLoftChain, realizeAutoMovieConstruction } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanNail,
  AutoMovieHumanNailLoop,
  AutoMovieHumanTipDome,
} from "@automovie/human";
import {
  AutoMovieHumanF1,
  AutoMovieHumanF1Frames,
  AutoMovieHumanF1Nails,
  AutoMovieHumanF1Placement,
} from "@automovie/human/capture";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1Frames,
  IAutoMovieHumanF1Nails,
  IAutoMovieHumanNail,
  IAutoMovieHumanNailLoop,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieMillimeterMesh,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { type Canvas, createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The nail unit of every digit, read on the reference and on the generated digit families in each digit's distal segment frame.
 *
 * For each of the ten digits of one side (the other is the mirror image) the distal segment's frame gives an origin (the last joint
 * centre), a distal direction and a dorsal direction. Planes square to the distal direction cut the reference and the generated family
 * lofted alone; each section is charted `[dorsal, lateral]` about the frame's long axis. A section of the reference is read for its
 * extents, its concave vertices (the lateral nail folds of a coarse mesh are single concave vertices), the plate between the two folds
 * (chord, sagitta, the circle through both) and its depth under its own hull. The median cut (the plane of the distal and the dorsal
 * directions) gives the dorsal profile with the proximal fold and the free edge. Both meshes are drawn under cameras fixed in the frame.
 *
 * Usage: `FamilyConicNail.ts [--step=<mm>] [--frames]`. Writes `survey.json` and, with `--frames`, the stills, under
 * `packages/human/.shots/nails/<stamp>`.
 */
namespace FamilyConicNail {
  type V = R.V;

  /** A digit's distal segment as the nail reads it. */
  interface IDistal {
    /** The last joint's centre, mm. */
    origin: V;

    /** Unit direction from the joint toward the tip. */
    distal: V;

    /** Unit direction out of the back of the digit, square to `distal`. */
    dorsal: V;

    /** `distal x dorsal`. */
    lateral: V;

    /** Distance from the joint to the segment's far datum (the pad's far point), mm. */
    length: number;
  }

  /**
   * Each digit family's distal segment in `AutoMovieHumanF1Frames`, and which of its axes are distal and dorsal: a hand's phalanx has Y
   * proximal and X volar (Wu et al. 2005 4.3.5), a toe's has X distal and Y dorsal, as the frames' own rules state.
   */
  const SEGMENTS: Record<string, { segment: string; pad: keyof typeof import("@automovie/human/capture").AutoMovieHumanF1Joints; hand: boolean }> = {
    "finger.index": { segment: "index.distal", pad: "indexPad", hand: true },
    "finger.middle": { segment: "middle.distal", pad: "middlePad", hand: true },
    "finger.ring": { segment: "ring.distal", pad: "ringPad", hand: true },
    "finger.pinky": { segment: "pinky.distal", pad: "pinkyPad", hand: true },
    "finger.thumb": { segment: "thumb.distal", pad: "thumbPad", hand: true },
    "toe.big": { segment: "bigtoe.distal", pad: "bigtoePad", hand: false },
    "toe.index": { segment: "indextoe.distal", pad: "indextoePad", hand: false },
    "toe.middle": { segment: "middletoe.distal", pad: "middletoePad", hand: false },
    "toe.ring": { segment: "ringtoe.distal", pad: "ringtoePad", hand: false },
    "toe.little": { segment: "littletoe.distal", pad: "littletoePad", hand: false },
  };

  /** One still of a sheet. */
  interface ICell {
    /** The camera's name. */
    view: string;

    /** `reference`, `clay` or `owners`. */
    pass: string;

    /** The digit's family name. */
    digit: string;

    /** The still. */
    png: Buffer;
  }

  /** Side of a sheet's cell, pixels. */
  const CELL: number = 360;

  /** Columns of a nail's join. */
  const COLUMNS: number = 96;

  /** Turn at a mesh vertex that is listed as a fold, degrees, concave. */
  const FOLD: number = 8;

  const sub = (a: readonly number[], b: readonly number[]): V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const neg = (a: V): V => [-a[0], -a[1], -a[2]];
  const unit = (a: readonly number[]): V => {
    const n: number = Math.hypot(a[0]!, a[1]!, a[2]!);
    return [a[0]! / n, a[1]! / n, a[2]! / n];
  };
  const round = (x: number, digits: number = 2): number => Math.round(x * 10 ** digits) / 10 ** digits;

  /** Distance from a chart point to a closed polygon's boundary, mm. */
  function distance(p: C.P, polygon: readonly C.P[]): number {
    let best: number = Infinity;
    for (let i: number = 0; i < polygon.length; ++i) {
      const a: C.P = polygon[i]!;
      const b: C.P = polygon[(i + 1) % polygon.length]!;
      const e: C.P = [b[0] - a[0], b[1] - a[1]];
      const l: number = e[0] * e[0] + e[1] * e[1];
      const t: number = l === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / l));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1]));
    }
    return best;
  }

  /** The signed turn at each vertex of a polyline, degrees, positive where it turns left; the ends of an open one read 0. */
  function turns(points: readonly C.P[], closed: boolean): number[] {
    return points.map((b: C.P, i: number): number => {
      if (!closed && (i === 0 || i === points.length - 1)) return 0;
      const a: C.P = points[(i + points.length - 1) % points.length]!;
      const c: C.P = points[(i + 1) % points.length]!;
      return (Math.atan2((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]), (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1])) * 180) / Math.PI;
    });
  }

  /** The extents of a `[dorsal, lateral]` loop: dorsal, palmar, `+lateral`, `-lateral`, mm. */
  function extents(loop: readonly C.P[]): number[] {
    return [Math.max(...loop.map((p: C.P): number => p[0])), Math.min(...loop.map((p: C.P): number => p[0])), Math.max(...loop.map((p: C.P): number => p[1])), Math.min(...loop.map((p: C.P): number => p[1]))].map((x: number): number => round(x));
  }

  /** One section of the reference read for its nail: the two folds, the plate between them and the walls beside them. */
  function plate(loop: readonly C.P[]): Record<string, unknown> {
    const turn: number[] = turns(loop, true);
    const hull: C.P[] = R.hull(loop);
    // The loop runs counter-clockwise in `[dorsal, lateral]`, so a concave vertex turns right. The folds are the most concave vertex on
    // each lateral side of the dorsal half.
    const folds: ({ index: number; turn: number } | null)[] = [1, -1].map((side: number): { index: number; turn: number } | null => {
      let best: { index: number; turn: number } | null = null;
      for (let i: number = 0; i < loop.length; ++i) if (loop[i]![0] > 0 && loop[i]![1] * side > 0 && turn[i]! < -FOLD && (best === null || turn[i]! < best.turn)) best = { index: i, turn: turn[i]! };
      return best;
    });
    const concave: number[][] = loop.map((p: C.P, i: number): number[] => [round(p[0]), round(p[1]), round(turn[i]!, 0)]).filter((row: number[]): boolean => row[2]! < -FOLD);
    if (folds[0] === null || folds[1] === null) return { concave };
    const a: C.P = loop[folds[0].index]!;
    const b: C.P = loop[folds[1].index]!;
    const chord: number = Math.hypot(a[0] - b[0], a[1] - b[1]);
    // The plate's points: the run of the loop between the folds on the dorsal side. Its sagitta is the greatest height over the chord.
    const normal: C.P = [(a[1] - b[1]) / chord, -(a[0] - b[0]) / chord];
    const sign: number = normal[0] >= 0 ? 1 : -1;
    let sagitta: number = 0;
    let top: number = -Infinity;
    for (const p of loop) {
      const along: number = ((p[0] - b[0]) * (a[0] - b[0]) + (p[1] - b[1]) * (a[1] - b[1])) / (chord * chord);
      const height: number = sign * ((p[0] - b[0]) * normal[0] + (p[1] - b[1]) * normal[1]);
      if (along > 0 && along < 1 && p[0] > Math.min(a[0], b[0]) - 0.5) {
        sagitta = Math.max(sagitta, height);
        top = Math.max(top, p[0]);
      }
    }
    return {
      concave,
      folds: [a, b].map((p: C.P, k: number): number[] => [round(p[0]), round(p[1]), round(folds[k]!.turn, 0), round(distance(p, hull))]),
      // Chord between the folds, its tilt from the lateral axis, the plate's sagitta over it and the radius of the circle through both folds and the crown.
      chord: round(chord),
      tilt: round((Math.atan2(a[0] - b[0], a[1] - b[1]) * 180) / Math.PI, 1),
      sagitta: round(sagitta),
      radius: sagitta > 0.02 ? round((chord * chord) / (8 * sagitta) + sagitta / 2) : null,
      plateTop: round(top),
      // The walls beside the plate: the greatest dorsal height of the loop lateral of each fold, less the fold's own.
      walls: [1, -1].map((side: number, k: number): number => {
        const fold: C.P = [a, b][k]!;
        return round(Math.max(...loop.filter((p: C.P): boolean => p[1] * side > fold[1] * side).map((p: C.P): number => p[0]), fold[0]) - fold[0]);
      }),
    };
  }

  /**
   * The length of each digit's tip dome over the mean reach of the section it starts from: the body's tip law as its note states it
   * for wiring (`packages/human/docs/techniques/body-one-shot.md`, "Tips" and row W3), 1.5 for a finger, 1.1 for the thumb and 0.8 for
   * a toe, each read on f1's ends as half ellipsoids. The toes already carry it through `AutoMovieHumanF1`'s own `rounded`.
   */
  const DOME: Record<string, number> = {
    "finger.index": 1.5,
    "finger.middle": 1.5,
    "finger.ring": 1.5,
    "finger.pinky": 1.5,
    "finger.thumb": 1.1,
    "toe.big": 0.8,
    "toe.index": 0.8,
    "toe.middle": 0.8,
    "toe.ring": 0.8,
    "toe.little": 0.8,
  };

  /**
   * A digit with its cap started by the body's tip dome law, on the probe's own copy: the station where the stretch left before the
   * pole is the digit's share of the section's mean reach there (the mean of its four extents, as `rounded` reads it), no earlier than
   * the family's second knot. Past the last knot the wall has no section of its own, so the reach there is the last knot's.
   */
  function domed(family: IAutoMovieHumanConicLoft.IFamily): { family: IAutoMovieHumanConicLoft.IFamily; was: number; start: AutoMovieHumanTipDome.IStart } {
    const end: IAutoMovieHumanConicLoft.ITip | null = family.tips?.[1] ?? null;
    const share: number | undefined = DOME[family.name];
    if (end === null || share === undefined) throw new Error("no tip or no dome share for " + family.name);
    const read: (s: number) => number[] = AutoMovieHumanConicLoft.reader(family);
    const last: number = family.knots.at(-1)!;
    const reach = (s: number): number => {
      const chain: IAutoMovieHumanConicSection.IChain = AutoMovieHumanConicSection.resolve(read(Math.min(s, last)), family.layout);
      return chain.guides.reduce((sum: number, g: number, q: number): number => sum + Math.abs(chain.input.points[g]![q % 2]!), 0) / 4;
    };
    const start: AutoMovieHumanTipDome.IStart = AutoMovieHumanTipDome.start(reach, end.tip, share, family.knots[1]!);
    return { family: { ...family, tips: [family.tips?.[0] ?? null, { ...end, from: Math.min(start.from, last) }] }, was: end.from, start };
  }

  /**
   * Every digit alone with its nail, realized by the engine: the digit's family with its bed as the host, the plate merged onto it.
   * Writes `realize.json` (the law's readings, each join's diagnostics, the median and the mid-plate section of the realized skin in
   * the nail's frame) and stills of the realized skin, in clay and coloured by owner, beside the reference under the same cameras.
   */
  async function realize(root: string, out: string, only: string | undefined): Promise<void> {
    const source: R.ISource = await R.load(root);
    NodeCanvasRaster.initialize();
    const report: Record<string, unknown>[] = [];
    const cells: ICell[] = [];
    // The ten nails are made together: the prior's spread is the ten digits' own, so no one digit's roll is final without the others.
    const lawStarted: number = performance.now();
    const together: IAutoMovieHumanF1Nails.IMade[] = AutoMovieHumanF1Nails.all(
      AutoMovieHumanF1.DIGITS.map((digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanConicLoft.IFamily => domed(digit.family).family),
      AutoMovieHumanF1Placement.REFERENCE,
    );
    const lawEach: number = Math.round((performance.now() - lawStarted) / together.length);
    for (const digit of AutoMovieHumanF1.DIGITS) {
      if (only !== undefined && digit.family.name !== only) continue;
      const dome: { family: IAutoMovieHumanConicLoft.IFamily; was: number; start: AutoMovieHumanTipDome.IStart } = domed(digit.family);
      const family: IAutoMovieHumanConicLoft.IFamily = dome.family;
      let started: number = performance.now();
      const row: Record<string, unknown> = { digit: family.name, dome: { from: round(dome.start.from), was: dome.was, pole: family.tips?.[1]?.tip, held: dome.start.held } };
      report.push(row);
      const made: IAutoMovieHumanF1Nails.IMade = together[AutoMovieHumanF1.DIGITS.indexOf(digit)]!;
      const { plate, bed, frame, readings }: IAutoMovieHumanNail.INail = made.nail;
      row.lawMilliseconds = lawEach;
      row.profile = made.nail.profile.map((p: { along: number; middle: number; height: number; edge: number; turn: number }): number[] => [round(p.along), round(p.middle), round(p.height), round(p.edge), round((p.turn * 180) / Math.PI, 1)]);
      started = performance.now();
      row.readings = Object.fromEntries(
        Object.entries(readings).map(([key, value]: [string, number | number[] | number[][]]): [string, unknown] => [
          key,
          typeof value === "number" ? round(value, 3) : (value as (number | number[])[]).map((x: number | number[]): unknown => (typeof x === "number" ? round(x, 3) : x.map((y: number): number => round(y, 7)))),
        ]),
      );
      row.bed = { stations: bed.stations.map((x: number): number => round(x)), phases: bed.phases.map((x: number): number => round(x, 3)), rows: bed.rows, columns: bed.columns, deepest: round(Math.min(...bed.heights), 3) };
      row.plate = { knots: plate.knots.length, length: round(plate.knots.at(-1)!), values: plate.values.map((field: number[]): number[] => [round(field[0]!), round(field[Math.floor(field.length / 2)]!), round(field.at(-1)!)]) };

      // `--law`: the law's readings and profile only, with no realization.
      if (process.argv.includes("--law")) continue;
      const hosted: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1Nails.bedded(family, made, true);
      const cell: number = (bed.stations[1] - bed.stations[0]) / (bed.rows - 3);
      const stations: number[] = [];
      const strip: IAutoMovieHumanNail.INail["strip"] = made.nail.strip;
      const fine: number = (strip.stations[1] - strip.stations[0]) / (strip.rows - 3);
      for (let s: number = family.knots[0]!; s < family.knots.at(-1)!; s += s >= strip.stations[0] ? fine : s >= bed.stations[0] - 2 ? cell : 2) stations.push(s);
      const lastKnot: number = family.knots.at(-1)!;
      stations.push(lastKnot);
      const plateCount: number = Math.ceil(plate.knots.at(-1)! / cell) + 1;
      const plateStations: number[] = Array.from({ length: plateCount }, (_: unknown, i: number): number => (i === plateCount - 1 ? plate.knots.at(-1)! : (plate.knots.at(-1)! * i) / (plateCount - 1)));
      const sources: Map<string, IAutoMovieViewPart> = new Map([
        [hosted.name, AutoMovieHumanConicLoft.part(hosted, stations)],
        [plate.name, AutoMovieHumanConicLoft.part(plate, plateStations)],
      ]);
      // `--loop`: the meeting curve declared from the two lofted surfaces (`AutoMovieHumanNailLoop`) with fold widths, instead of traced.
      let loop: IAutoMovieHumanNailLoop.ILoop | null = null;
      if (process.argv.includes("--loop")) {
        const lofts: IAutoMovieViewLoft.IResult[] = [AutoMovieHumanConicLoft.create(plate, plateStations), AutoMovieHumanConicLoft.create(hosted, stations)];
        const [plateChain, hostChain]: (IAutoMovieViewLoft.IResult["chain"] | undefined)[] = [lofts[0]?.chain, lofts[1]?.chain];
        if (plateChain === null || plateChain === undefined || hostChain === null || hostChain === undefined) {
          row.refused = "the plate or the bedded digit does not loft: " + JSON.stringify(lofts.map((l: IAutoMovieViewLoft.IResult): unknown => l.diagnostics)).slice(0, 300);
          continue;
        }
        try {
          loop = AutoMovieHumanNailLoop.create(made.nail, plateChain, hostChain, family.tips?.[1]?.tip ?? lastKnot, COLUMNS);
        } catch (error: unknown) {
          row.refused = error instanceof Error ? error.message : String(error);
          continue;
        }
        row.loop = { centre: loop.centre, semi: loop.semi, least: round(Math.min(...loop.shape), 3), greatest: round(Math.max(...loop.shape), 3), milliseconds: Math.round(performance.now() - started) };
      }
      const base = {
        type: "join" as const,
        kind: "merge" as const,
        name: "fold." + plate.name,
        host: { type: "source" as const, name: hosted.name, source: hosted.name },
        part: { type: "source" as const, name: plate.name, source: plate.name },
        parameter: { type: "arc" as const },
        continuity: "G2" as const,
        count: COLUMNS,
        rows: 4,
        grazing: 0.04,
      };
      const join: IAutoMovieConstructionNode =
        loop === null
          ? {
              ...base,
              seed: { type: "search", partFace: plate.name, hostFace: hosted.name, phase: 0, from: 0, to: 0.7 },
              partWidth: { type: "curvature", share: 0.5, cap: AutoMovieHumanF1Nails.CHORD_MM / 1000, end: null },
              hostWidth: { type: "curvature", share: 0.5, cap: AutoMovieHumanF1Nails.CHORD_MM / 1000, end: null },
              tolerance: 1e-12,
            }
          : {
              ...base,
              loop: { centre: loop.centre, semi: loop.semi, sense: 1, shape: loop.shape },
              seed: { type: "point", partFace: plate.name, hostFace: hosted.name, part: loop.part, host: loop.host },
              partWidth: { type: "fold", radius: AutoMovieHumanF1Nails.CHORD_MM / 1000, cap: (2 * AutoMovieHumanF1Nails.CHORD_MM) / 1000, reach: AutoMovieHumanF1Nails.CHORD_MM / 2000 },
              hostWidth: { type: "fold", radius: AutoMovieHumanF1Nails.CHORD_MM / 1000, cap: (2 * AutoMovieHumanF1Nails.CHORD_MM) / 1000, reach: AutoMovieHumanF1Nails.CHORD_MM / 2000 },
              tolerance: 5e-6,
            };
      let realized: ReturnType<typeof realizeAutoMovieConstruction>;
      try {
        // `--relief`: the digit with its relief alone, no plate joined.
        realized = realizeAutoMovieConstruction({ name: "nail." + family.name, root: process.argv.includes("--relief") ? base.host : join, fills: [] }, { chord: 0.001, sources });
      } catch (error: unknown) {
        row.thrown = error instanceof Error ? error.message : String(error);
        continue;
      }
      row.diagnostics = realized.diagnostics.map((d: unknown): string => JSON.stringify(d)).map((text: string): string => (text.length > 700 ? text.slice(0, 200) + " ... " + text.slice(-480) : text));
      row.milliseconds = Math.round(performance.now() - started);
      if (realized.mesh === null) continue;
      const mesh: NonNullable<typeof realized.mesh> = realized.mesh;
      row.vertices = mesh.positions.length / 3;
      row.owners = mesh.owners;

      // The realized skin read in the nail's own frame: the median cut and the section midway along the visible plate.
      const lateral: V = cross(frame.distal, frame.dorsal);
      const mm: IAutoMovieMillimeterMesh = { positions: mesh.positions.map((x: number): number => x * 1000), indices: mesh.indices };
      const cut = (which: IAutoMovieMillimeterMesh, origin: V, u: V, v: V): number[][][] =>
        R.chains(which, { origin, u, v })
          .map((piece: { points: C.P[]; closed: boolean }): number[][] => {
            const turn: number[] = turns(piece.points, piece.closed);
            return piece.points.map((p: C.P, i: number): number[] => [round(p[0]), round(p[1]), round(turn[i]!, 0)]);
          })
          .filter((piece: number[][]): boolean => piece.length > 2);
      const [fold, edge]: [number, number] = readings.span;
      const clip = (pieces: number[][][], a: number, b: number, low: number): number[][][] => pieces.map((piece: number[][]): number[][] => piece.filter((p: number[]): boolean => p[0]! > a && p[0]! < b && p[1]! > low)).filter((piece: number[][]): boolean => piece.length > 2);
      const middle: V = [0, 1, 2].map((k: number): number => frame.origin[k]! + frame.distal[k]! * ((fold + edge) / 2)) as V;
      row.median = { generated: clip(cut(mm, frame.origin, frame.distal, frame.dorsal), fold - 3, edge + 2, -1), reference: clip(cut(source.body, frame.origin, frame.distal, frame.dorsal), fold - 3, edge + 2, -1) };
      row.section = { generated: clip(cut(mm, middle, lateral, frame.dorsal), -readings.width, readings.width, -1), reference: clip(cut(source.body, middle, lateral, frame.dorsal), -readings.width, readings.width, -1) };

      // The figure's level beside the close-up's: the same digit with its bed alone, its layers cut to the bed's rows only.
      const plain: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1Nails.bedded(family, made);
      const plainStations: number[] = [];
      for (let s: number = family.knots[0]!; s < lastKnot; s += s >= bed.stations[0] - 2 ? cell : 2) plainStations.push(s);
      plainStations.push(lastKnot);
      let figured: ReturnType<typeof realizeAutoMovieConstruction>["mesh"] = null;
      try {
        figured = realizeAutoMovieConstruction({ name: "nail.figure." + family.name, root: base.host, fills: [] }, { chord: 0.001, sources: new Map([[plain.name, AutoMovieHumanConicLoft.part(plain, plainStations)]]) }).mesh;
      } catch (error: unknown) {
        row.figureThrown = error instanceof Error ? error.message : String(error);
      }
      row.figureVertices = figured === null ? null : figured.positions.length / 3;
      const keep = (positions: ArrayLike<number>, indices: ArrayLike<number>, scale: number): number[] => {
        const kept: number[] = [];
        for (let t: number = 0; t < indices.length; t += 3)
          if (
            [0, 1, 2].every((k: number): boolean => {
              const d: V = sub([positions[indices[t + k]! * 3]! * scale, positions[indices[t + k]! * 3 + 1]! * scale, positions[indices[t + k]! * 3 + 2]! * scale], frame.origin);
              return dot(d, frame.distal) > -3 && Math.hypot(dot(d, frame.dorsal), dot(d, lateral)) < 1.5 * readings.breadth;
            })
          )
            kept.push(indices[t]!, indices[t + 1]!, indices[t + 2]!);
        return kept;
      };
      const shown: [string, N.Mesh[]][] = [
        ["reference", [{ id: "reference", positions: Array.from(source.body.positions, (x: number): number => x / 1000), indices: keep(source.body.positions, source.body.indices, 1), colour: [0.64, 0.65, 0.67] }]],
        ["figure", figured === null ? [] : [{ id: "figure", positions: figured.positions, indices: keep(figured.positions, figured.indices, 1000), colour: [0.64, 0.65, 0.67] }]],
        ["close", [{ id: "close", positions: mesh.positions, indices: keep(mesh.positions, mesh.indices, 1000), colour: [0.64, 0.65, 0.67] }]],
      ];
      const target: N.Point = [0, 1, 2].map((k: number): number => (frame.origin[k]! + frame.distal[k]! * readings.tip * 0.55) / 1000) as N.Point;
      const scale: number = 720 / ((readings.tip + 6) / 1000);
      const blend = (a: V, b: V, c: V): V => unit([a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]]);
      const cameras: [string, V, V][] = [
        ["dorsal", frame.dorsal, frame.distal],
        ["lateral", lateral, frame.distal],
        ["end", frame.distal, frame.dorsal],
        ["oblique", blend(frame.dorsal, lateral, frame.distal), frame.distal],
        ["oblique-twin", blend(frame.dorsal, neg(lateral), frame.distal), frame.distal],
      ];
      for (const [name, back, top] of cameras) {
        const right: V = unit(cross(top, back));
        const camera: N.Camera = { name, target, back, right, up: cross(back, right), scale: (scale * CELL) / 900, width: CELL, height: CELL };
        for (const [pass, meshes] of shown) cells.push({ view: name, pass, digit: family.name, png: NodeCanvasRaster.render(camera, meshes, [], "depth", family.name + " | " + pass + " | " + name).png });
      }
    }
    // One sheet a view for five digits: the reference, the clay and the owners in rows, each cell `CELL` pixels square.
    const drawn: string[] = [...new Set(cells.map((cell: ICell): string => cell.digit))];
    for (const view of new Set(cells.map((cell: ICell): string => cell.view)))
      for (let part: number = 0; part * 5 < drawn.length; ++part) {
        const canvas: Canvas = createCanvas(5 * CELL, 3 * CELL);
        const context: SKRSContext2D = canvas.getContext("2d");
        for (const cell of cells) {
          const column: number = drawn.indexOf(cell.digit) - part * 5;
          const row: number = ["reference", "figure", "close"].indexOf(cell.pass);
          if (cell.view === view && column >= 0 && column < 5 && row >= 0) context.drawImage(await loadImage(cell.png), column * CELL, row * CELL);
        }
        await fs.writeFile(path.join(out, "sheet." + view + "." + part + ".png"), canvas.toBuffer("image/png"));
      }
    await fs.writeFile(path.join(out, "realize.json"), JSON.stringify(report, null, 1));
    process.stdout.write(JSON.stringify({ out, digits: report.map((row: Record<string, unknown>): unknown => ({ digit: row.digit, refused: row.refused, thrown: row.thrown, diagnostics: row.diagnostics, ms: row.milliseconds })) }, null, 1) + "\n");
  }

  /**
   * The whole figure with its twenty nails, realized once: the figure's own tree from an assembly whose digits carry their beds
   * (`AutoMovieHumanF1Nails.bedded`), with every plate and its twin merged on (`AutoMovieHumanF1Nails.attach`). Writes `figure.json`
   * (the diagnostics, the mesh's size, each nail's owners' vertices on both sides) and stills of every distal segment of both sides
   * cut out of the figure's skin, in clay and coloured by owner, under cameras fixed in the nail's frame and its reflection.
   */
  async function figure(out: string): Promise<void> {
    NodeCanvasRaster.initialize();
    const started: number = performance.now();
    const assembled: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const domes: IAutoMovieHumanF1.IDigit[] = assembled.digits.map((digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanF1.IDigit => ({ ...digit, family: domed(digit.family).family }));
    const nails: IAutoMovieHumanF1Nails.IMade[] = AutoMovieHumanF1Nails.all(
      domes.map((digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanConicLoft.IFamily => digit.family),
      assembled.frames,
    );
    const placed: IAutoMovieHumanF1.IAssembly = { ...assembled, digits: domes.map((digit: IAutoMovieHumanF1.IDigit, i: number): IAutoMovieHumanF1.IDigit => ({ ...digit, family: AutoMovieHumanF1Nails.bedded(digit.family, nails[i]!) })) };
    const declared: IAutoMovieHumanF1.IConstruction = AutoMovieHumanF1.constructionFrom(placed);
    const lawMilliseconds: number = Math.round(performance.now() - started);
    const sources: Map<string, IAutoMovieViewPart> = new Map(declared.sources);
    const tree: IAutoMovieConstructionNode = declared.root;
    const realized: ReturnType<typeof realizeAutoMovieConstruction> = realizeAutoMovieConstruction({ name: "f1.body", root: tree, fills: declared.fills }, { chord: 0.001, sources });
    const report: Record<string, unknown> = {
      lawAndDeclarationMilliseconds: lawMilliseconds,
      milliseconds: Math.round(performance.now() - started),
      diagnostics: realized.diagnostics.map((d: unknown): string => JSON.stringify(d)).map((text: string): string => (text.length > 700 ? text.slice(0, 200) + " ... " + text.slice(-480) : text)),
    };
    if (realized.mesh !== null) {
      const mesh: NonNullable<typeof realized.mesh> = realized.mesh;
      report.vertices = mesh.positions.length / 3;
      report.triangles = mesh.indices.length / 3;
      const owned: number[] = mesh.owners.map((): number => 0);
      for (let v: number = 0; v < mesh.positions.length / 3; ++v) owned[mesh.coordinates[v * 3]!]! += 1;
      report.nailOwners = Object.fromEntries(mesh.owners.map((owner: string, k: number): [string, number] => [owner, owned[k]!]).filter(([owner]: [string, number]): boolean => owner.includes("nail.")));
      // The vertices each nail's region claims on its digit's face and on the twin's, whose points are read reflected in the median plane.
      const claimed: Record<string, number> = {};
      for (const nail of nails)
        for (const side of [1, -1]) {
          const face: string = nail.row.digit + (side > 0 ? "" : ".mirror");
          let count: number = 0;
          for (let v: number = 0; v < mesh.positions.length / 3; ++v)
            if (mesh.owners[mesh.coordinates[v * 3]!] === face && AutoMovieHumanNail.owns(nail.nail, [mesh.positions[v * 3]! * 1000, mesh.positions[v * 3 + 1]! * 1000, side * mesh.positions[v * 3 + 2]! * 1000])) count += 1;
          claimed[face] = count;
        }
      report.nailOwned = claimed;
      const palette = (owner: string): [number, number, number] => (owner.startsWith("fold.nail.") ? [0.25, 0.4, 0.9] : owner.startsWith("nail.") ? [0.85, 0.25, 0.25] : owner.startsWith("band.") ? [0.25, 0.7, 0.3] : [0.64, 0.65, 0.67]);
      for (const made of nails)
        for (const side of [1, -1]) {
          const flip = (a: readonly number[]): V => [a[0]!, a[1]!, side * a[2]!];
          const frame: { origin: V; distal: V; dorsal: V } = { origin: flip(made.nail.frame.origin), distal: flip(made.nail.frame.distal), dorsal: flip(made.nail.frame.dorsal) };
          const lateral: V = cross(frame.distal, frame.dorsal);
          const near = (v: number): boolean => {
            const d: V = sub([mesh.positions[v * 3]! * 1000, mesh.positions[v * 3 + 1]! * 1000, mesh.positions[v * 3 + 2]! * 1000], frame.origin);
            return dot(d, frame.distal) > -6 && Math.hypot(dot(d, frame.dorsal), dot(d, lateral)) < 1.2 * made.nail.readings.breadth;
          };
          const groups: Map<string, number[]> = new Map();
          for (let t: number = 0; t < mesh.indices.length; t += 3) {
            if (!(near(mesh.indices[t]!) && near(mesh.indices[t + 1]!) && near(mesh.indices[t + 2]!))) continue;
            const owner: string = mesh.owners[mesh.coordinates[mesh.indices[t + 1]! * 3]!]!;
            const group: number[] = groups.get(owner) ?? [];
            group.push(mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!);
            groups.set(owner, group);
          }
          const shown: [string, N.Mesh[]][] = [
            ["clay", [...groups].map(([owner, indices]: [string, number[]]): N.Mesh => ({ id: owner, positions: mesh.positions, indices, colour: [0.64, 0.65, 0.67] }))],
            ["owners", [...groups].map(([owner, indices]: [string, number[]]): N.Mesh => ({ id: owner, positions: mesh.positions, indices, colour: palette(owner) }))],
          ];
          const target: N.Point = [0, 1, 2].map((k: number): number => (frame.origin[k]! + frame.distal[k]! * made.nail.readings.tip * 0.5) / 1000) as N.Point;
          const scale: number = 720 / ((made.nail.readings.tip + 10) / 1000);
          const cameras: [string, V, V][] = [
            ["dorsal", frame.dorsal, frame.distal],
            ["oblique", unit([frame.dorsal[0] + lateral[0] + frame.distal[0], frame.dorsal[1] + lateral[1] + frame.distal[1], frame.dorsal[2] + lateral[2] + frame.distal[2]]), frame.distal],
          ];
          for (const [name, back, top] of cameras) {
            const right: V = unit(cross(top, back));
            const camera: N.Camera = { name, target, back, right, up: cross(back, right), scale, width: 900, height: 900 };
            for (const [pass, meshes] of shown) await fs.writeFile(path.join(out, "figure." + made.row.digit + (side > 0 ? "" : ".mirror") + "." + name + "." + pass + ".png"), NodeCanvasRaster.render(camera, meshes, [], "depth", "f1 | figure " + pass + " | " + made.row.digit + (side > 0 ? "" : ".mirror") + " nail | " + name).png);
          }
        }
    }
    await fs.writeFile(path.join(out, "figure.json"), JSON.stringify(report, null, 1));
    process.stdout.write(JSON.stringify({ out, ...report }, null, 1) + "\n");
  }

  /** Survey every digit and, on request, draw it. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    if (process.argv.includes("--figure")) {
      const made: string = path.join(root, "packages/human/.shots/nails", new Date().toISOString().replaceAll(":", "-") + "-figure");
      await fs.mkdir(made, { recursive: true });
      return figure(made);
    }
    if (process.argv.includes("--realize")) {
      const made: string = path.join(root, "packages/human/.shots/nails", new Date().toISOString().replaceAll(":", "-") + "-realize");
      await fs.mkdir(made, { recursive: true });
      return realize(root, made, process.argv.find((arg: string): boolean => arg.startsWith("--digit="))?.slice(8));
    }
    const step: number = Number(process.argv.find((arg: string): boolean => arg.startsWith("--step="))?.slice(7) ?? "1");
    const out: string = path.join(root, "packages/human/.shots/nails", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const source: R.ISource = await R.load(root);
    const frames: Map<string, IAutoMovieHumanSegmentFrame> = new Map(AutoMovieHumanF1Frames.segments().map((segment: IAutoMovieHumanF1Frames.ISegment): [string, IAutoMovieHumanSegmentFrame] => [segment.name, segment.frame]));
    const joints: Record<string, unknown> = (await import("@automovie/human/capture")).AutoMovieHumanF1Joints as unknown as Record<string, unknown>;
    const survey: Record<string, unknown>[] = [];
    if (process.argv.includes("--frames")) NodeCanvasRaster.initialize();

    for (const digit of AutoMovieHumanF1.DIGITS) {
      const family: IAutoMovieHumanConicLoft.IFamily = digit.family;
      const entry = SEGMENTS[family.name];
      if (entry === undefined) throw new Error("no distal segment declared for " + family.name);
      const frame: IAutoMovieHumanSegmentFrame | undefined = frames.get(entry.segment);
      if (frame === undefined) throw new Error("no segment " + entry.segment);
      const distal: V = entry.hand ? neg(frame.axes[1]) : frame.axes[0];
      const dorsal: V = entry.hand ? neg(frame.axes[0]) : frame.axes[1];
      const at: IDistal = { origin: frame.origin, distal, dorsal, lateral: cross(distal, dorsal), length: Math.hypot(...sub(joints[entry.pad] as V, frame.origin)) };

      // The generated family alone, lofted through the engine as the figure lofts it, meshed in millimetres for the same cuts.
      const from: number = family.knots[0]!;
      const to: number = family.knots.at(-1)!;
      const count: number = Math.ceil((to - from) / 2) + 1;
      const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1)));
      const chain: IAutoMovieViewLoft.IResult["chain"] = loft.chain;
      const made: { positions: number[]; indices: number[] } = { positions: [], indices: [] };
      if (chain !== null) {
        const layers: number[] = chain.layers.map((layer: { y: number }): number => layer.y);
        const phases: number = 192;
        for (const s of layers) for (let j: number = 0; j < phases; ++j) made.positions.push(...AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / phases));
        for (let i: number = 0; i + 1 < layers.length; ++i)
          for (let j: number = 0; j < phases; ++j) {
            const a: number = i * phases + j;
            const b: number = i * phases + ((j + 1) % phases);
            made.indices.push(a, a + phases, b, b, a + phases, b + phases);
          }
      }
      const generated: IAutoMovieMillimeterMesh = made;

      // How far the reference's skin runs past the joint along the distal direction, within a section's reach of the long axis.
      const first: C.P[] | null = R.cut(source.body, { origin: at.origin, u: at.dorsal, v: at.lateral }).loop;
      const reach: number = first === null ? 12 : Math.max(...extents(first).map(Math.abs));
      const near: number[] = [];
      let tip: number = 0;
      for (let i: number = 0; i < source.body.positions.length / 3; ++i) {
        const d: V = sub([source.body.positions[i * 3]!, source.body.positions[i * 3 + 1]!, source.body.positions[i * 3 + 2]!], at.origin);
        const a: number = dot(d, at.distal);
        if (a > -3 && a < at.length + 8 && Math.hypot(dot(d, at.dorsal), dot(d, at.lateral)) < 1.3 * reach) {
          near.push(i);
          tip = Math.max(tip, a);
        }
      }

      const stations: Record<string, unknown>[] = [];
      for (let a: number = 0; a < tip; a += step) {
        const origin: V = [0, 1, 2].map((k: number): number => at.origin[k]! + at.distal[k]! * a) as V;
        const loop: C.P[] | null = R.cut(source.body, { origin, u: at.dorsal, v: at.lateral }).loop;
        const ring: C.P[] | null = generated.positions.length === 0 ? null : R.cut(generated, { origin, u: at.dorsal, v: at.lateral }).loop;
        stations.push({
          along: round(a),
          vertices: loop?.length ?? 0,
          reference: loop === null ? null : extents(loop),
          generated: ring === null ? null : extents(ring),
          ...(loop === null ? {} : plate(loop)),
        });
      }

      // The median cut, charted `[along, dorsal]` from the joint: every chain's vertices on the dorsal side over the segment, with their turns.
      const median = (mesh: IAutoMovieMillimeterMesh): number[][][] =>
        R.chains(mesh, { origin: at.origin, u: at.distal, v: at.dorsal })
          .map((piece: { points: C.P[]; closed: boolean }): number[][] => {
            const turn: number[] = turns(piece.points, piece.closed);
            return piece.points.map((p: C.P, i: number): number[] => [round(p[0]), round(p[1]), round(turn[i]!, 0)]).filter((row: number[]): boolean => row[0]! > -2 && row[0]! < tip + 2 && row[1]! > -2 && row[1]! < 1.5 * reach);
          })
          .filter((piece: number[][]): boolean => piece.length > 2);

      survey.push({
        digit: family.name,
        segment: entry.segment,
        origin: at.origin.map((x: number): number => round(x, 1)),
        distal: at.distal.map((x: number): number => round(x, 3)),
        dorsal: at.dorsal.map((x: number): number => round(x, 3)),
        lateral: at.lateral.map((x: number): number => round(x, 3)),
        segmentToPadMm: round(at.length),
        referenceTipMm: round(tip),
        referenceVertices: near.length,
        loftDiagnostics: loft.diagnostics.length,
        stations,
        medianReference: median(source.body),
        medianGenerated: generated.positions.length === 0 ? [] : median(generated),
      });

      if (!process.argv.includes("--frames")) continue;
      // Stills under cameras fixed in the digit's frame, the reference and the generated family through the same camera.
      const kept: Set<number> = new Set(near);
      const indices: number[] = [];
      for (let t: number = 0; t < source.body.indices.length; t += 3) if (kept.has(source.body.indices[t]!) && kept.has(source.body.indices[t + 1]!) && kept.has(source.body.indices[t + 2]!)) indices.push(source.body.indices[t]!, source.body.indices[t + 1]!, source.body.indices[t + 2]!);
      const meshes: N.Mesh[] = [{ id: "reference", positions: Array.from(source.body.positions, (x: number): number => x / 1000), indices, colour: [0.64, 0.65, 0.67] }];
      if (made.positions.length > 0) {
        const shown: number[] = [];
        for (let t: number = 0; t < made.indices.length; t += 3) if ([0, 1, 2].every((k: number): boolean => dot(sub([made.positions[made.indices[t + k]! * 3]!, made.positions[made.indices[t + k]! * 3 + 1]!, made.positions[made.indices[t + k]! * 3 + 2]!], at.origin), at.distal) > -3)) shown.push(made.indices[t]!, made.indices[t + 1]!, made.indices[t + 2]!);
        meshes.push({ id: "generated", positions: made.positions.map((x: number): number => x / 1000), indices: shown, colour: [0.64, 0.65, 0.67] });
      }
      const target: N.Point = [0, 1, 2].map((k: number): number => (at.origin[k]! + at.distal[k]! * tip * 0.5) / 1000) as N.Point;
      const scale: number = 720 / ((tip + 6) / 1000);
      const mix = (a: V, b: V, c: V): V => unit([a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]]);
      // Each camera looks from `back` with the digit's tip toward the top of the picture; the end-on view puts the dorsal side up.
      const cameras: [string, V, V][] = [
        ["dorsal", at.dorsal, at.distal],
        ["lateral", at.lateral, at.distal],
        ["medial", neg(at.lateral), at.distal],
        ["end", at.distal, at.dorsal],
        ["oblique", mix(at.dorsal, at.lateral, at.distal), at.distal],
        ["oblique-twin", mix(at.dorsal, neg(at.lateral), at.distal), at.distal],
      ];
      for (const [name, back, top] of cameras) {
        const right: V = unit(cross(top, back));
        const up: V = cross(back, right);
        const camera: N.Camera = { name, target, back, right, up, scale, width: 900, height: 900 };
        for (const mesh of meshes) await fs.writeFile(path.join(out, family.name + "." + name + "." + mesh.id + ".png"), NodeCanvasRaster.render(camera, [mesh], [], "depth", "f1 | " + mesh.id + " | " + family.name + " distal segment | " + name).png);
      }
    }
    await fs.writeFile(path.join(out, "survey.json"), JSON.stringify(survey, null, 1));
    process.stdout.write(JSON.stringify({ out, digits: survey.length }) + "\n");
  }
}
void FamilyConicNail.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
