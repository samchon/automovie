import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieRecoveryConicApproximation as V, approximateAutoMovieRecoveryConicsAhn } from "@automovie/recovery";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Convert a part's sections to conics in one shot (campaign 1 plan, steps 2 and 3): each section through the recovery converter
 * (`approximateAutoMovieRecoveryConicsAhn`, contract `AutoMovieRecoveryConicApproximation`), broken where invented points meet skin, and
 * the arc count per station read as the layout: a station range with one count is one family.
 *
 * A section's polygon is resampled every `STEP_MM` of arclength and read as a closed C1 cubic Hermite curve with Catmull-Rom tangents on
 * a chord-length parameter: the cut's own vertices are a faceted mesh's, and a curve through each of them turns at every facet.
 *
 * Run from `test` after bundling: `node .shots/esbuild/FamilyConicConvert.cjs <part>`; it writes `<part>.convert.txt` and
 * `<part>.convert.json` (every station's arcs) into `test/.shots/family-conic-convert/<time>`.
 */
export namespace FamilyConicConvert {
  /** One part to convert: where its sections come from, and the course point's place in their chart. */
  export interface IEntry {
    /** The part's name, as the command line gives it. */
    name: string;

    /** The excursion it is cut as (`FamilyConicExcursion.PARTS`), or none when its sections come from `dump`. */
    excursion?: string;

    /**
     * A `FamilyConicBody.ts --dump=<file>` of the part's observed sections, read from `test`, each already in its course's chart with its
     * invented points flagged (the air provider's floor and reach), which break the conversion as a closure does.
     */
    dump?: string;

    /** The course point in the excursion's chart, mm: the section is converted about it. */
    course: C.P;
  }

  /** The parts, the nose first: its course runs down the median plane 11 mm in front of x 100 (`FamilyConicBody.ts nose --nose-vertical`). */
  export const ENTRIES: IEntry[] = [
    { name: "nose", excursion: "nose", course: [11, 0] },
    // The armpit's slit and vault cutters: their sections are the air round each course (`FamilyConicBody.ts axilla` and `vault`, `IPart.air`).
    { name: "axilla", dump: ".shots/family-conic-convert/axilla.rows.json", course: [0, 0] },
    { name: "vault", dump: ".shots/family-conic-convert/vault.rows.json", course: [0, 0] },
  ];

  /** Arclength step a section is resampled at before conversion, mm. */
  const STEP_MM: number = 1;

  /** The converter's tolerance, mm: the reference pack's own fit tolerance (policy `toleranceMm` 0.2). */
  const TOLERANCE_MM: number = 0.2;

  /** One converted station. */
  export interface IStation {
    /** Height of the level plane, mm. */
    y: number;

    /** The converter's status. */
    status: V.IResult["status"];

    /** The converter's largest sampled error, mm. */
    errorMm: number;

    /** Arcs on the skin. */
    skin: number;

    /** Arcs on the invented closure. */
    closure: number;

    /** Every arc, in the course's chart: controls and middle weight, and whether it lies on the closure. */
    arcs: { controls: V.IArc["controls"]; weight: number; closure: boolean }[];
  }

  /** A closed polygon resampled every `step` of arclength, with a flag carried from the nearest original vertex. */
  function resample(points: readonly C.P[], flags: readonly boolean[], step: number): { points: C.P[]; flags: boolean[] } {
    const n: number = points.length;
    const along: number[] = [0];
    for (let i: number = 0; i < n; ++i) along.push(along[i]! + Math.hypot(points[(i + 1) % n]![0] - points[i]![0], points[(i + 1) % n]![1] - points[i]![1]));
    const total: number = along[n]!;
    const count: number = Math.max(8, Math.round(total / step));
    const out: C.P[] = [];
    const outFlags: boolean[] = [];
    let i: number = 0;
    for (let k: number = 0; k < count; ++k) {
      const s: number = (total * k) / count;
      while (along[i + 1]! < s) ++i;
      const t: number = (s - along[i]!) / Math.max(1e-12, along[i + 1]! - along[i]!);
      const [a, b] = [points[i]!, points[(i + 1) % n]!];
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      outFlags.push(t < 0.5 ? flags[i]! : flags[(i + 1) % n]!);
    }
    return { points: out, flags: outFlags };
  }
  /** The closed C1 Hermite curve through points one parameter unit apart, with Catmull-Rom tangents, as the converter's source. */
  function curve(points: readonly C.P[], breaks: number[]): V.ICurve {
    const n: number = points.length;
    const at = (i: number): C.P => points[((i % n) + n) % n]!;
    const tangent = (i: number): C.P => [(at(i + 1)[0] - at(i - 1)[0]) / 2, (at(i + 1)[1] - at(i - 1)[1]) / 2];
    const hermite = (t: number, order: number): V.Point => {
      const w: number = ((t % n) + n) % n;
      const i: number = Math.min(n - 1, Math.floor(w));
      const u: number = w - i;
      const [p0, p1, m0, m1] = [at(i), at(i + 1), tangent(i), tangent(i + 1)];
      const b: number[] =
        order === 0 ? [2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2]
        : order === 1 ? [6 * u ** 2 - 6 * u, 3 * u ** 2 - 4 * u + 1, -6 * u ** 2 + 6 * u, 3 * u ** 2 - 2 * u]
        : order === 2 ? [12 * u - 6, 6 * u - 4, -12 * u + 6, 6 * u - 2]
        : order === 3 ? [12, 6, -12, 6]
        : [0, 0, 0, 0];
      return [b[0]! * p0[0] + b[1]! * m0[0] + b[2]! * p1[0] + b[3]! * m1[0], b[0]! * p0[1] + b[1]! * m0[1] + b[2]! * p1[1] + b[3]! * m1[1]];
    };
    return { domain: [0, n], breaks, closed: true, evaluate: (t: number): V.Point => hermite(t, 0), derivative: (t: number, order: 1 | 2 | 3 | 4 | 5): V.Point => hermite(t, order) };
  }

  /** Convert one section about the course point. */
  export function convert(section: X.ISection, course: C.P, invented?: readonly boolean[]): Omit<IStation, "y"> {
    const shifted: C.P[] = section.points.map((p: C.P): C.P => [p[0] - course[0], p[1] - course[1]]);
    // `ends` (the excursion's closure ends) exists where the excursion carries it; a section read from elsewhere has none.
    const ends: readonly [C.P, C.P] | undefined = (section as X.ISection & { ends?: readonly [C.P, C.P] }).ends;
    const behind: number | null = ends === undefined ? null : Math.min(ends[0][0], ends[1][0]) - course[0];
    const flags: boolean[] = invented !== undefined && invented.length === shifted.length ? [...invented] : shifted.map((p: C.P): boolean => behind !== null && p[0] < behind - 0.01);
    const even = resample(shifted, flags, STEP_MM);
    const n: number = even.points.length;
    const breaks: number[] = even.flags.map((f: boolean, i: number): number => (f !== even.flags[(i + 1) % n] ? i + 1 : -1)).filter((i: number): boolean => i > 0 && i < n);
    const result: V.IResult = approximateAutoMovieRecoveryConicsAhn(curve(even.points, breaks), { toleranceMm: TOLERANCE_MM, maximumArcs: 256, maximumDepth: 24 });
    const arcs: IStation["arcs"] = result.arcs.map((arc: V.IArc) => ({ controls: arc.controls, weight: arc.weight, closure: even.flags[Math.min(n - 1, Math.floor((arc.domain[0] + arc.domain[1]) / 2))] === true }));
    const closure: number = arcs.filter((a): boolean => a.closure).length;
    return { status: result.status, errorMm: result.maximumSampleErrorMm, skin: arcs.length - closure, closure, arcs };
  }

  /** Convert every section of the named part and write the table and the arcs. */
  export async function main(): Promise<void> {
    const name: string = process.argv[2] ?? "nose";
    const entry: IEntry | undefined = ENTRIES.find((e: IEntry): boolean => e.name === name);
    if (entry === undefined) throw new Error("No convert entry " + name);
    const root: string = path.resolve(process.cwd(), "..");
    let stations: IStation[];
    if (entry.dump !== undefined) {
      // A dump's rows: `y` is the station along the part's course.
      const dumped = JSON.parse(await fs.readFile(path.resolve(process.cwd(), entry.dump), "utf8")) as { rows: { s: number; points: C.P[]; invented: boolean[] | null }[] };
      stations = dumped.rows.map((row): IStation => ({ y: row.s, ...convert({ points: row.points } as X.ISection, entry.course, row.invented ?? undefined) }));
    } else {
      const part: X.IPart | undefined = X.PARTS.find((p: X.IPart): boolean => p.name === entry.excursion);
      if (part === undefined) throw new Error("No excursion " + entry.excursion);
      const source: R.ISource = await R.load(root);
      stations = X.sections(source, part)
        .filter((row): boolean => row.section !== null)
        .map((row): IStation => ({ y: row.y, ...convert(row.section!, entry.course) }));
    }
    const out: string = path.join(root, "test/.shots/family-conic-convert", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    // Families: runs of stations with one skin-arc count.
    const families: string[] = [];
    for (const station of stations) {
      const last: string | undefined = families.at(-1);
      const key: string = String(station.skin);
      if (last !== undefined && last.split(":")[0] === key) families[families.length - 1] = key + ":" + last.split(":")[1]!.split("-")[0] + "-" + station.y;
      else families.push(key + ":" + station.y + "-" + station.y);
    }
    const lines: string[] = [
      "# " + name + " converted by " + "approximateAutoMovieRecoveryConicsAhn at " + TOLERANCE_MM + " mm, resampled every " + STEP_MM + " mm",
      "level-y  status  skin-arcs  closure-arcs  max-error-mm",
      ...stations.map((s: IStation): string => [s.y.toFixed(1).padStart(7), s.status.padStart(8), String(s.skin).padStart(9), String(s.closure).padStart(12), s.errorMm.toFixed(3).padStart(12)].join("  ")),
      "",
      "# runs of one skin-arc count (count: from-to level)",
      ...families,
    ];
    await fs.writeFile(path.join(out, name + ".convert.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, name + ".convert.json"), JSON.stringify({ name, toleranceMm: TOLERANCE_MM, stations }));
    process.stdout.write(JSON.stringify({ event: "convert-complete", part: name, out, stations: stations.length }) + "\n");
  }
}

if (/FamilyConicConvert\.c?[jt]s$/.test(process.argv[1] ?? ""))
  FamilyConicConvert.main().catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
    process.exitCode = 1;
  });
