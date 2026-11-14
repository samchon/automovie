import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Whether a region's sections are star-shaped about a trial course: the reference cut by each plane normal to the course, the cut's
 * outermost loop kept only inside the region's box and closed across the box by chords, and each piece read along `RAYS` rays from the
 * course point (`FamilyConicExcursion.star`, the fit's own test). A ray that crosses a piece more than once is a fold; a piece the course
 * point lies outside of misses some rays. A family can carry a region only on a course under which every section is star-shaped (lofting.md,
 * One section family: "The method's limit is that each section is star-shaped about the family's course").
 *
 * Usage, from `test`: `node <bundle> <trials.json> [--least=<triangles>] [--detail]`, a list of `{ label, centres: [[x, y, z], ...], up: [x, y, z], box: [x0, x1, y0, y1,
 * z0, z1], step }`, mm; it writes `star.txt` under `test/.shots/family-conic-star/<stamp>/`.
 */
export namespace FamilyConicStar {
  /** One trial course and the region it is read over. */
  export interface ITrial {
    /** Its name in the report. */
    label: string;

    /** The course's centres, mm, in the reference frame. */
    centres: [number, number, number][];

    /** The direction the chart's `u` starts from. */
    up: [number, number, number];

    /** Each joint's half turn arclength, mm, for a course of more than two centres (`AutoMovieViewAxis.jointed`); absent, none. */
    halves?: number[];

    /** The region's box, `[x0, x1, y0, y1, z0, z1]`, mm: only skin inside it is the region's. */
    box: [number, number, number, number, number, number];

    /** With it, only skin within this distance of the course point in the section's plane is the region's as well, mm: a box cannot follow a curved course. */
    radius?: number;

    /** Station step along the course, mm. */
    step: number;
  }

  /** Rays a section is read along, as the fit reads a family's skin. */
  export const RAYS: number = 1440;

  /** The pieces of a loop inside a box, each closed by the chord between its ends. */
  function pieces(loop: readonly C.P[], inside: (p: C.P) => boolean): C.P[][] {
    const flags: boolean[] = loop.map(inside);
    if (flags.every((f: boolean): boolean => f)) return [[...loop]];
    const out: C.P[][] = [];
    const start: number = flags.findIndex((f: boolean): boolean => !f);
    let run: C.P[] = [];
    for (let k: number = 1; k <= loop.length; ++k) {
      const i: number = (start + k) % loop.length;
      if (flags[i]) run.push(loop[i]!);
      else if (run.length > 0) {
        if (run.length >= 3) out.push(run);
        run = [];
      }
    }
    if (run.length >= 3) out.push(run);
    return out;
  }

  /** A region's section on its course: the star-shaped piece about the course point, and the chord that closes it across the box. */
  export interface IRegionSection {
    /** Station along the course, mm. */
    s: number;

    /** The piece's skin points, counter-clockwise about the course point, chart mm. */
    points: C.P[];

    /** The closing chord, from the skin's last point back to its first, as phases about the course point, radians. */
    closure: [number, number];
  }

  /**
   * A region's sections for the convert tool: at every station of the trial course, the piece of the reference's cut inside the box that is
   * star-shaped about the course point, closed by its chord across the box (an invented closure, so the conversion breaks there and does not
   * read it as skin). A station with no such piece is left out.
   */
  export function regionSections(source: R.ISource, trial: ITrial, from: number, to: number, mesh: R.ISource["all"] = source.all): IRegionSection[] {
    const axis = AutoMovieHumanConicLoft.axis({ centres: trial.centres, halves: trial.halves ?? [], up: trial.up });
    const [x0, x1, y0, y1, z0, z1] = trial.box;
    const out: IRegionSection[] = [];
    for (let s: number = from; s <= to + 1e-9; s += trial.step) {
      const frame = axis.at(s);
      const loop: C.P[] | null = R.cut(mesh, frame).loop;
      if (loop === null) continue;
      const inside = (p: C.P): boolean => {
        const w: number[] = [0, 1, 2].map((c: number): number => frame.origin[c]! + p[0] * frame.u[c]! + p[1] * frame.v[c]!);
        return w[0]! >= x0 && w[0]! <= x1 && w[1]! >= y0 && w[1]! <= y1 && w[2]! >= z0 && w[2]! <= z1 && (trial.radius === undefined || Math.hypot(p[0], p[1]) <= trial.radius);
      };
      const piece: C.P[] | undefined = pieces(loop, inside).find((candidate: C.P[]): boolean => X.star(candidate, RAYS, "inner")?.folds === 0);
      if (piece === undefined) continue;
      const phase = (p: C.P): number => Math.atan2(p[1], p[0]);
      out.push({ s, points: piece, closure: [phase(piece.at(-1)!), phase(piece[0]!)] });
    }
    return out;
  }

  /** A mesh's triangles grouped by the vertices they share: each component's triangle count, largest first. */
  export interface IComponents {
    /** The mesh with only the components kept. */
    mesh: R.ISource["all"];

    /** Every component's triangle count, largest first. */
    sizes: number[];
  }

  /**
   * The mesh without its small detached pieces: the components (triangles joined through shared vertices) with fewer than `least`
   * triangles are dropped. The reference's head mesh carries its eyelashes as thin detached shards; cut by a plane they chain into the
   * skin's loop when the cut bridges a gap, and a section read off them is not skin.
   */
  export function components(mesh: R.ISource["all"], least: number): IComponents {
    const count: number = mesh.positions.length / 3;
    const parent: number[] = Array.from({ length: count }, (_: unknown, i: number): number => i);
    const find = (i: number): number => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]!]!;
        i = parent[i]!;
      }
      return i;
    };
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const a: number = find(mesh.indices[t]!);
      for (const k of [1, 2]) {
        const b: number = find(mesh.indices[t + k]!);
        if (a !== b) parent[b] = a;
      }
    }
    const triangles: Map<number, number> = new Map();
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const root: number = find(mesh.indices[t]!);
      triangles.set(root, (triangles.get(root) ?? 0) + 1);
    }
    const indices: number[] = [];
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) if ((triangles.get(find(mesh.indices[t]!)) ?? 0) >= least) indices.push(mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!);
    return { mesh: { positions: mesh.positions, indices }, sizes: [...triangles.values()].sort((a: number, b: number): number => b - a) };
  }

  /**
   * One region section's numbers for the report: its closure's share of the turn about the course point and of the section's length, and
   * the longest step between neighbouring skin points with its two ends in the reference frame (a bridged opening, such as the fissure
   * between the lids, shows as one long step).
   */
  export function measure(section: IRegionSection, frame: { origin: readonly number[]; u: readonly number[]; v: readonly number[] }): string {
    const points: C.P[] = section.points;
    const world = (p: C.P): string => "[" + [0, 1, 2].map((c: number): string => (frame.origin[c]! + p[0] * frame.u[c]! + p[1] * frame.v[c]!).toFixed(1)).join(", ") + "]";
    let skin: number = 0;
    let longest: number = 0;
    let at: number = 0;
    for (let k: number = 0; k + 1 < points.length; ++k) {
      const step: number = Math.hypot(points[k + 1]![0] - points[k]![0], points[k + 1]![1] - points[k]![1]);
      skin += step;
      if (step > longest) {
        longest = step;
        at = k;
      }
    }
    const chord: number = Math.hypot(points[0]![0] - points.at(-1)![0], points[0]![1] - points.at(-1)![1]);
    const turn: number = (((section.closure[1] - section.closure[0]) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return `closure ${((100 * turn) / (2 * Math.PI)).toFixed(0)}% of the turn, ${((100 * chord) / (chord + skin)).toFixed(0)}% of the length (${chord.toFixed(1)} of ${(chord + skin).toFixed(1)} mm); longest skin step ${longest.toFixed(2)} mm from ${world(points[at]!)} to ${world(points[at + 1]!)}`;
  }

  /** Read every trial and write the report. */
  export async function main(): Promise<void> {
    const file: string | undefined = process.argv[2];
    if (file === undefined) throw new Error("usage: FamilyConicStar <trials.json>");
    const trials: ITrial[] = JSON.parse(await fs.readFile(file, "utf8")) as ITrial[];
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const lines: string[] = [];
    // `--least=<triangles>`: the reference's detached pieces smaller than that are dropped first (`components`).
    const least: number = Number(process.argv.find((a: string): boolean => a.startsWith("--least="))?.slice("--least=".length) ?? 0);
    const kept: IComponents | null = least > 0 ? components(source.all, least) : null;
    const mesh: R.ISource["all"] = kept?.mesh ?? source.all;
    if (kept !== null) lines.push(`components of the reference (triangles, largest first): ${kept.sizes.slice(0, 16).join(", ")}${kept.sizes.length > 16 ? ` and ${kept.sizes.length - 16} more` : ""}; kept those of ${least} or more`, "");
    for (const trial of trials) {
      const axis = AutoMovieHumanConicLoft.axis({ centres: trial.centres, halves: trial.halves ?? [], up: trial.up });
      const length: number = trial.centres.slice(1).reduce((sum: number, c, k: number): number => sum + Math.hypot(c[0] - trial.centres[k]![0], c[1] - trial.centres[k]![1], c[2] - trial.centres[k]![2]), 0);
      const [x0, x1, y0, y1, z0, z1] = trial.box;
      const rows: string[] = [];
      let star: number = 0, folded: number = 0, missed: number = 0, empty: number = 0;
      for (let s: number = 0; s <= length + 1e-9; s += trial.step) {
        const frame = axis.at(s);
        const loop: C.P[] | null = R.cut(mesh, frame).loop;
        const world = (p: C.P): number[] => [0, 1, 2].map((c: number): number => frame.origin[c]! + p[0] * frame.u[c]! + p[1] * frame.v[c]!);
        const inside = (p: C.P): boolean => {
          const w: number[] = world(p);
          return w[0]! >= x0 && w[0]! <= x1 && w[1]! >= y0 && w[1]! <= y1 && w[2]! >= z0 && w[2]! <= z1 && (trial.radius === undefined || Math.hypot(p[0], p[1]) <= trial.radius);
        };
        const found: C.P[][] = loop === null ? [] : pieces(loop, inside);
        if (found.length === 0) {
          ++empty;
          rows.push(`  ${s.toFixed(1).padStart(6)}  no skin in the box`);
          continue;
        }
        const reads: string[] = found.map((piece: C.P[]): string => {
          const got = X.star(piece, RAYS, "inner");
          if (got === null) {
            ++missed;
            return `outside (${piece.length} pts)`;
          }
          if (got.folds > 0) ++folded;
          else ++star;
          return got.folds === 0 ? `star (${piece.length} pts)` : `${got.folds} folds (${piece.length} pts)`;
        });
        rows.push(`  ${s.toFixed(1).padStart(6)}  ${found.length} piece(s): ${reads.join("; ")}`);
      }
      lines.push(`## ${trial.label}: course ${JSON.stringify(trial.centres)}, up ${JSON.stringify(trial.up)}, box ${JSON.stringify(trial.box)}, ${length.toFixed(1)} mm`, `pieces star-shaped ${star}, folded ${folded}, course point outside ${missed}; stations with no skin in the box ${empty}`, ...rows, "");
      // `--detail`: every star-shaped section's closure share and longest skin step (`measure`).
      if (process.argv.includes("--detail")) for (const section of regionSections(source, trial, 0, length, mesh)) lines.push(`  ${section.s.toFixed(1).padStart(6)}  ${measure(section, axis.at(section.s))}`);
      if (process.argv.includes("--detail")) lines.push("");
    }
    const out: string = path.join(root, "test/.shots/family-conic-star", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "star.txt"), lines.join("\n"));
    process.stdout.write(JSON.stringify({ out }) + "\n" + lines.filter((line: string): boolean => line.startsWith("##") || line.startsWith("pieces")).join("\n") + "\n");
  }
}

if (/FamilyConicStar\.c?[jt]s$/.test(process.argv[1] ?? "")) void FamilyConicStar.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
