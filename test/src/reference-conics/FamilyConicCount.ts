import fs from "node:fs/promises";
import path from "node:path";
import type { IAutoMovieLoftRelief } from "@automovie/engine";
import { type AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1, AutoMovieHumanF1Placing } from "@automovie/human";

/**
 * The count of what f1 is stored as (issue #3197, step 1): per part and in total, the families' and cutters' knots and fields, the relief
 * nets' heights, the placing table and the figure's own constants. It changes nothing and reads no reference data.
 *
 * Usage, from `test/` after `pnpm conic:build`: `node .shots/esbuild/FamilyConicCount.cjs`. It writes `count.txt` and `count.json` under
 * `test/.shots/family-conic-count/<time>/`.
 *
 * How each number is counted:
 *
 * - A family's or cutter's numbers come from the objects the figure builds from, `AutoMovieHumanF1.FAMILIES` and `CUTTERS`: its wall is
 *   knots times fields (what each module's header calls its independent numbers), and its knots' stations, turn halves, tips and roll are
 *   listed beside it. A mirrored member is stored once and counted once.
 * - A relief net is its `rows * columns` heights; its exact zeros are counted apart, with how many of them the three outer rings hold
 *   by the engine's rule (`IAutoMovieLoftRelief.heights`).
 * - The placing table is `AutoMovieHumanF1Placing`: every number of `CHAIN`, `POINTS` and `DIRECTIONS`, generated full-precision data.
 * - The figure's constants cannot be found by reflection (they are module-private), so the tool reads the tracked sources' text: every
 *   `const UPPER_CASE` of `AutoMovieHumanF1.ts`, `AutoMovieHumanConicLoft.ts` and `AutoMovieHumanConicSection.ts` with the numeric literals
 *   of its initializer. `CONSTANTS` holds each one's class and note by name; a constant the list does not name is reported as
 *   unclassified, so a new constant cannot be missed silently. Literals written inline in `construction` (join seeds, blend widths,
 *   counts) are scanned by key and listed apart.
 */
namespace FamilyConicCount {
  /** What a constant is, as the issue asks them apart: a number of the shape, of the tessellation, or of an operator's search or tolerance. */
  type Class = "shape" | "tessellation" | "search";

  /**
   * The figure's constants by name: class and what each is, read from its declaration and its use in `AutoMovieHumanF1.construction`. The
   * scan finds the constants and their numbers; this list only names them.
   */
  const CONSTANTS: Record<string, [Class, string]> = {
    TOE_LEAST: ["shape", "least shoulder of a toe's arcs"],
    TOE_DOME: ["shape", "a toe's dome length as a share of its section's reach"],
    TOE_TURN: ["tessellation", "largest ring turn between a toe's phases"],
    TOE_CAP_RINGS: ["tessellation", "rings of a toe's dome"],
    CROTCH: ["shape", "the trunk's split: its seam's web knots, corner and fair"],
    FANS: ["shape", "the hand's and the foot's splits: web lines, corner, reach, fair, rail (columns and rows are tessellation)"],
    PHASE_TURN: ["tessellation", "largest ring turn between a limb's phases"],
    ARM_TO_MM: ["shape", "where the arm's face ends and the hand's family takes over"],
    WRIST: ["shape", "the wrist band's rail (its count and rows are tessellation)"],
    THUMB_CHORD_MM: ["shape", "blend width of the thumb's merge"],
    THUMB_FAIR_MM: ["shape", "fairing radius of the thumb's merge"],
    EAR_FAIR_MM: ["shape", "fairing radii of the ear's three merges"],
    EAR_SEED_LINES: ["search", "station lines an ear part's merge is seeded on"],
    ROOT_MM: ["shape", "how far behind its first joint the thumb's capsule closes"],
    LAYER_MM: ["tessellation", "station spacing of every family's layers"],
    ARMSCYE_MARGIN_MM: ["shape", "the armscye loop's margin outside the arm's ring"],
    ARMPIT_DROP_MM: ["shape", "the loop's floor against the armpit's crease"],
    ARMPIT_ROUND_MM: ["shape", "rounding of the loop at the armpit"],
    ARM_RAILS_MM: ["shape", "the arm band's rail per clock, 24 values"],
    ARMPIT_SINK_MM: ["shape", "the band's sink behind the armpit"],
    RAIL_MM: ["shape", "band rails of the arm, the leg and the breast"],
    BREAST_CHEST_MM: ["shape", "the breast port's loop on the chest, 8 values"],
    NOSE_RAILS_MM: ["shape", "the nose band's rail per clock, 32 values"],
    NOSE_MARGIN_MM: ["shape", "the nose loop's margin"],
    NOSE_SUBNASAL_MM: ["shape", "the nose loop's margin under the nose"],
    NOSE_PROFILES: ["shape", "the nose band's profiles per clock"],
    WEB_LAYER_MM: ["tessellation", "layer spacing near a digit's web"],
    CROWN_MM: ["tessellation", "station from which the crown's layers are cut by ring travel"],
    TRUNK_FACE_LAYERS: ["tessellation", "the face's layer window and spacing"],
    TRUNK_PHASE: ["tessellation", "largest phase step of the trunk"],
    FINGER_LAYER_MM: ["tessellation", "layer spacing of a finger"],
    FINGER_TURN: ["tessellation", "largest ring turn between a finger's phases"],
    WEB_REACH_MM: ["tessellation", "how far the thumb's fine layers reach"],
    FOLD: ["tessellation", "layer refinement by sagitta and turn, with its crease windows"],
    BAND: ["tessellation", "a band's default columns and rows"],
    THIGH_COLUMNS: ["tessellation", "columns of each thigh's band"],
    SHOULDER_COLUMNS: ["tessellation", "columns of each shoulder's band"],
    ARMSCYE_ROWS: ["tessellation", "rows of each shoulder's band"],
    BREAST_LAYER_MM: ["tessellation", "layer spacing of the breast"],
    BREAST_PITCH_MM: ["tessellation", "phase pitch of the breast"],
    NOSE_COLUMNS: ["tessellation", "columns of the nose's band"],
    NOSTRIL_RIM_MM: ["shape", "how far the nostril's cutter is drawn in, and its blend width"],
    NOSTRIL_LAYER_MM: ["tessellation", "layer spacing of the nostril's cutter"],
    NOSTRIL_MOUTH_MM: ["shape", "how far the nostril's cutter is carried past its mouth"],
    NOSTRIL_SPREAD_MM: ["shape", "how far the cutter spreads past its mouth"],
    AXILLA_LAYER_MM: ["tessellation", "layer spacing of the armpit's cutter"],
    AXILLA_SEED: ["search", "where the armpit's cut is seeded"],
    BREAST_FAN_FILL_MM: ["shape", "radius of the fill at the breast's fan point"],
    // The conic model's own constants, shared by every family.
    OWN_LEAST: ["shape", "model: share under which a cap coordinate keeps the shared factor"],
    CAP_KNOTS: ["tessellation", "model: knots and default rings of a cap"],
    TAPER: ["shape", "model: bounds of a cap's taper"],
    REFINE: ["tessellation", "model: when a station is added between two"],
    PHASE_MM: ["tessellation", "model: phase pitch at the widest section"],
    SPACING_SAMPLES: ["tessellation", "model: phases a ring's turn is read on"],
    EDGE: ["shape", "model: bound of every share"],
    FAIR: ["shape", "model: largest shoulder"],
    CORNER: ["shape", "model: largest share of the way to a box corner for a guide"],
  };

  /** Keys whose value inside a shape block is a mesh density, counted as tessellation (`IFan.columns`, `IFan.rows`, `WRIST.count`). */
  const TESSELLATION_KEYS: string = "columns|rows|count|phases|fine|rings";

  /** Keys of the literals `construction` writes inline, by class: mesh densities, operator searches and tolerances, and blend widths (`value`). */
  const INLINE: Record<string, Class> = { count: "tessellation", rows: "tessellation", tolerance: "search", grazing: "search", from: "search", to: "search", phase: "search", phases: "search", value: "shape" };

  /** The sources whose constants are scanned, from the repository's root. */
  const SOURCES: string[] = ["packages/human/src/generation/f1/AutoMovieHumanF1.ts", "packages/human/src/generation/conic/AutoMovieHumanConicLoft.ts", "packages/human/src/generation/conic/AutoMovieHumanConicSection.ts"];

  /**
   * The record's "Measured" table (`packages/human/docs/work/f1-conic-families.md`), conic numbers and stored heights by family, for the
   * comparison the count ends with. The record lists the leg twice; both rows are kept.
   */
  const RECORD: { family: string; conic: number; heights: number }[] = [
    { family: "trunk", conic: 341, heights: 48460 },
    { family: "arm", conic: 588, heights: 3679 },
    { family: "leg", conic: 693, heights: 3121 },
    { family: "leg", conic: 861, heights: 2839 },
    { family: "plate", conic: 77, heights: 0 },
    { family: "helix", conic: 78, heights: 0 },
    { family: "antihelix", conic: 65, heights: 0 },
    { family: "concha", conic: 39, heights: 0 },
    { family: "breast", conic: 105, heights: 0 },
    { family: "nose", conic: 105, heights: 0 },
    { family: "nostril", conic: 39, heights: 0 },
  ];

  /** The part a family is counted under: the ear's and the nose's pieces together, the fingers and the toes each as one part. */
  function partOf(name: string): string {
    if (name.startsWith("finger.")) return "fingers";
    if (name.startsWith("toe.")) return "toes";
    if (["plate", "helix", "antihelix", "concha"].includes(name)) return "ear";
    if (name === "nostril") return "nose";
    if (name === "axilla") return "armpit";
    return name;
  }

  /** One relief net's row of the count. */
  interface INet {
    name: string;
    rows: number;
    columns: number;
    heights: number;
    zeros: number;
    /** Heights of the three outer rings, which the engine's rule holds at zero. */
    ring: number;
    stations: [number, number];
    phases: [number, number];
    /** Smallest and largest height, mm. */
    amplitude: [number, number];
    cast: "fixed" | "turning";
  }

  /** One family's or cutter's row of the count. */
  interface IRow {
    part: string;
    name: string;
    role: "family" | "cutter";
    mirrored: boolean;
    anchors: number;
    arcs: number;
    knots: number;
    fields: number;
    wall: number;
    units: Record<AutoMovieHumanConicSection.Unit, number>;
    centres: number;
    halves: number;
    /** Closed ends, and the numbers they hold (`from`, `tip`, a `centre`'s two). */
    tips: number;
    tipNumbers: number;
    /** The roll's knots and values together. */
    roll: number;
    nets: INet[];
  }

  /** One scanned constant. */
  interface IConstant {
    file: string;
    line: number;
    name: string;
    class: Class | "unclassified";
    note: string;
    /** Numeric literals of the block that are not mesh densities. */
    numbers: number;
    /** Numeric literals under `TESSELLATION_KEYS`. */
    density: number;
  }

  /** The count's row of one member. */
  function row(family: AutoMovieHumanConicLoft.IFamily, role: "family" | "cutter", mirrored: boolean): IRow {
    const units: AutoMovieHumanConicSection.Unit[] = AutoMovieHumanConicSection.units(family.layout);
    if (units.length !== family.values.length) throw new Error(family.name + ": " + family.values.length + " fields stored for a layout of " + units.length);
    const tips: AutoMovieHumanConicLoft.ITip[] = [];
    for (const tip of family.tips ?? []) if (tip !== null) tips.push(tip);
    return {
      part: partOf(family.name),
      name: family.name,
      role,
      mirrored,
      anchors: family.layout.anchors.length,
      arcs: family.layout.mirror ? family.layout.anchors.length - 1 : family.layout.anchors.length,
      knots: family.knots.length,
      fields: family.values.length,
      wall: family.values.reduce((sum: number, field: number[]): number => sum + field.length, 0),
      units: { mm: units.filter((u: string): boolean => u === "mm").length, share: units.filter((u: string): boolean => u === "share").length, angle: units.filter((u: string): boolean => u === "angle").length },
      centres: family.centres.length,
      halves: family.halves.length,
      tips: tips.length,
      tipNumbers: tips.reduce((sum: number, tip: AutoMovieHumanConicLoft.ITip): number => sum + 2 + (tip.centre === undefined ? 0 : 2), 0),
      roll: family.roll === undefined ? 0 : family.roll.knots.length + family.roll.values.length,
      nets: (family.reliefs ?? []).map((relief: IAutoMovieLoftRelief): INet => {
        if (relief.heights.length !== relief.rows * relief.columns) throw new Error(relief.name + ": " + relief.heights.length + " heights for " + relief.rows + " x " + relief.columns);
        if (relief.shift !== undefined) throw new Error(relief.name + ": a station map is stored, which this count does not list");
        return {
          name: relief.name,
          rows: relief.rows,
          columns: relief.columns,
          heights: relief.heights.length,
          zeros: relief.heights.filter((h: number): boolean => h === 0).length,
          ring: relief.rows * relief.columns - Math.max(0, relief.rows - 6) * Math.max(0, relief.columns - 6),
          stations: relief.stations,
          phases: relief.phases,
          amplitude: [Math.min(...relief.heights), Math.max(...relief.heights)],
          cast: relief.turn === undefined ? "fixed" : "turning",
        };
      }),
    };
  }

  /** A source's text with its comments and strings blanked, line structure kept. */
  function bare(text: string): string {
    return text
      .replace(/\/\*[\s\S]*?\*\//g, (m: string): string => m.replace(/[^\n]/g, " "))
      .replace(/\/\/[^\n]*/g, "")
      .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, (m: string): string => m.replace(/[^\n]/g, " "));
  }

  /** How many numeric literals a stretch of bare source holds. */
  function literals(code: string): number {
    return (code.match(/(?<![\w$.])-?\d+(?:\.\d+)?(?:e[-+]?\d+)?(?![\w$])/g) ?? []).length;
  }

  /** Every `const UPPER_CASE` of a source with its initializer's numeric literals. */
  function scan(file: string, text: string): IConstant[] {
    const lines: string[] = bare(text).split("\n");
    const out: IConstant[] = [];
    for (let i: number = 0; i < lines.length; ++i) {
      const head: RegExpMatchArray | null = lines[i]!.match(/^ {0,2}(?:export )?const ([A-Z][A-Z0-9_]*)\b/);
      if (head === null) continue;
      const start: number = lines[i]!.indexOf(" = ");
      if (start < 0) continue;
      // The initializer runs to the first `;` at bracket depth zero.
      let code: string = "";
      let depth: number = 0;
      let done: boolean = false;
      for (let j: number = i; j < lines.length && !done; ++j) {
        const piece: string = j === i ? lines[j]!.slice(start + 3) : lines[j]!;
        for (const c of piece) {
          if ("([{".includes(c)) ++depth;
          else if (")]}".includes(c)) --depth;
          else if (c === ";" && depth === 0) {
            done = true;
            break;
          }
          code += c;
        }
        code += "\n";
      }
      const keyed: RegExp = new RegExp("\\b(?:" + TESSELLATION_KEYS + "): *-?\\d+(?:\\.\\d+)?", "g");
      const density: number = (code.match(keyed) ?? []).length;
      const numbers: number = literals(code.replace(keyed, ""));
      if (numbers + density === 0) continue;
      const known: [Class, string] | undefined = CONSTANTS[head[1]!];
      out.push({ file, line: i + 1, name: head[1]!, class: known?.[0] ?? "unclassified", note: known?.[1] ?? "not named in the tool's list", numbers, density });
    }
    return out;
  }

  /** Every number in a value, and how many of them are neither 0 nor 1 nor -1. */
  function numbers(value: unknown): [number, number] {
    if (typeof value === "number") return [1, value === 0 || Math.abs(value) === 1 ? 0 : 1];
    if (value === null || typeof value !== "object") return [0, 0];
    return Object.values(value as object).reduce((sum: [number, number], x: unknown): [number, number] => {
      const [a, b]: [number, number] = numbers(x);
      return [sum[0] + a, sum[1] + b];
    }, [0, 0]);
  }

  /** Count the figure and write the two files. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const rows: IRow[] = [
      ...AutoMovieHumanF1.FAMILIES.map((member: AutoMovieHumanF1.IMember): IRow => row(member.family, "family", member.mirrored)),
      ...AutoMovieHumanF1.CUTTERS.map((cutter: { family: AutoMovieHumanConicLoft.IFamily; mirrored: boolean }): IRow => row(cutter.family, "cutter", cutter.mirrored)),
    ];

    // The placing table.
    const chain: [number, number] = numbers(AutoMovieHumanF1Placing.CHAIN);
    const points: [number, number] = numbers(AutoMovieHumanF1Placing.POINTS);
    const directions: [number, number] = numbers(AutoMovieHumanF1Placing.DIRECTIONS);
    const placing = {
      chain: { entries: AutoMovieHumanF1Placing.CHAIN.length, numbers: chain[0], other: chain[1] },
      points: { entries: Object.keys(AutoMovieHumanF1Placing.POINTS).length, numbers: points[0], other: points[1] },
      directions: { entries: Object.keys(AutoMovieHumanF1Placing.DIRECTIONS).length, numbers: directions[0], other: directions[1] },
      courses: { entries: Object.keys(AutoMovieHumanF1Placing.COURSES).length, names: Object.values(AutoMovieHumanF1Placing.COURSES).reduce((sum: number, names: string[]): number => sum + names.length, 0) },
    };

    // The constants, and the literals `construction` writes inline.
    const constants: IConstant[] = [];
    const inline: Record<string, number> = {};
    for (const file of SOURCES) {
      const text: string = await fs.readFile(path.join(root, file), "utf8");
      constants.push(...scan(file, text));
      if (!file.endsWith("AutoMovieHumanF1.ts")) continue;
      const code: string = bare(text);
      const body: string = code.slice(code.indexOf("export function construction("), code.indexOf("export function create("));
      for (const match of body.matchAll(new RegExp("\\b(" + Object.keys(INLINE).join("|") + "): *-?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?", "g"))) inline[match[1]!] = (inline[match[1]!] ?? 0) + 1;
    }

    // The f1 modules that declare a family the figure does not list.
    const listed: Set<string> = new Set(rows.map((r: IRow): string => r.name));
    const directory: string = path.join(root, "packages/human/src/generation/f1");
    const unlisted: { file: string; name: string; header: string }[] = [];
    for (const file of (await fs.readdir(directory)).filter((f: string): boolean => f.endsWith(".ts")).sort((a: string, b: string): number => a.localeCompare(b))) {
      const text: string = await fs.readFile(path.join(directory, file), "utf8");
      if (!text.includes("AutoMovieHumanConicLoft.IFamily = {")) continue;
      const name: string | undefined = text.match(/^ {2}name: "([^"]+)"/m)?.[1];
      if (name === undefined || listed.has(name)) continue;
      unlisted.push({ file, name, header: text.match(/(\d[\d,]*) independent numbers/)?.[0] ?? "no count in its header" });
    }

    // Totals.
    const sum = (pick: (r: IRow) => number, of: IRow[] = rows): number => of.reduce((total: number, r: IRow): number => total + pick(r), 0);
    const nets = (of: IRow[] = rows): INet[] => of.flatMap((r: IRow): INet[] => r.nets);
    const heights = (of: IRow[] = rows): number => nets(of).reduce((total: number, n: INet): number => total + n.heights, 0);
    const zeros = (of: IRow[] = rows): number => nets(of).reduce((total: number, n: INet): number => total + n.zeros, 0);
    const families: IRow[] = rows.filter((r: IRow): boolean => r.role === "family");
    const cutters: IRow[] = rows.filter((r: IRow): boolean => r.role === "cutter");
    const beside = (r: IRow): number => r.knots + r.halves + r.tipNumbers + r.roll;
    const byClass = (c: Class | "unclassified"): number => constants.filter((k: IConstant): boolean => k.class === c).reduce((total: number, k: IConstant): number => total + k.numbers, 0);
    const density: number = constants.reduce((total: number, k: IConstant): number => total + k.density, 0);
    const inlineBy = (c: Class): number => Object.entries(inline).reduce((total: number, [key, n]: [string, number]): number => total + (INLINE[key] === c ? n : 0), 0);
    const totals = {
      families: families.length,
      cutters: cutters.length,
      wall: { families: sum((r: IRow): number => r.wall, families), cutters: sum((r: IRow): number => r.wall, cutters) },
      knotStations: sum((r: IRow): number => r.knots),
      halves: sum((r: IRow): number => r.halves),
      tips: { ends: sum((r: IRow): number => r.tips), numbers: sum((r: IRow): number => r.tipNumbers) },
      roll: sum((r: IRow): number => r.roll),
      nets: nets().length,
      heights: heights(),
      zeros: zeros(),
      ringZeros: nets().reduce((total: number, n: INet): number => total + n.ring, 0),
      placing: placing.chain.numbers + placing.points.numbers + placing.directions.numbers,
      constants: { shape: byClass("shape"), search: byClass("search"), tessellation: byClass("tessellation") + density, unclassified: byClass("unclassified") },
      inline: { shape: inlineBy("shape"), search: inlineBy("search"), tessellation: inlineBy("tessellation") },
    };
    const shape: number = totals.wall.families + totals.wall.cutters + totals.knotStations + totals.halves + totals.tips.numbers + totals.roll + totals.heights + totals.placing + totals.constants.shape + totals.inline.shape;

    const pad = (value: string | number, width: number): string => String(value).padStart(width);
    const lead = (value: string, width: number): string => value.padEnd(width);
    const lines: string[] = [];
    lines.push("f1 as stored: the count (issue #3197, step 1)");
    lines.push("");
    lines.push("TOTALS");
    lines.push("  shape numbers in all                 " + pad(shape, 7) + "   (every row below but tessellation and search)");
    lines.push("  families / cutters                   " + pad(totals.families, 7) + " / " + totals.cutters + "   (a mirrored member is stored and counted once)");
    lines.push("  wall numbers, knots x fields         " + pad(totals.wall.families + totals.wall.cutters, 7) + "   families " + totals.wall.families + ", cutters " + totals.wall.cutters);
    lines.push("  knot stations                        " + pad(totals.knotStations, 7));
    lines.push("  turn halves                          " + pad(totals.halves, 7));
    lines.push("  tip numbers                          " + pad(totals.tips.numbers, 7) + "   in " + totals.tips.ends + " closed ends");
    lines.push("  roll numbers                         " + pad(totals.roll, 7));
    lines.push("  relief nets                          " + pad(totals.nets, 7));
    lines.push("  relief heights                       " + pad(totals.heights, 7) + "   exact zeros " + totals.zeros + ", of which the three outer rings hold at most " + totals.ringZeros);
    lines.push("  placing numbers (generated)          " + pad(totals.placing, 7) + "   chain " + placing.chain.numbers + ", points " + placing.points.numbers + ", directions " + placing.directions.numbers);
    lines.push("  constants, shape                     " + pad(totals.constants.shape, 7) + "   in constant blocks; inline in construction() " + totals.inline.shape);
    lines.push("  constants, search and tolerance      " + pad(totals.constants.search, 7) + "   inline " + totals.inline.search + "   (not shape, not a saving)");
    lines.push("  constants, tessellation              " + pad(totals.constants.tessellation, 7) + "   inline " + totals.inline.tessellation + "   (counted apart, never a saving)");
    if (totals.constants.unclassified > 0) lines.push("  constants, UNCLASSIFIED              " + pad(totals.constants.unclassified, 7) + "   name them in CONSTANTS");
    lines.push("");
    lines.push("BY PART");
    lines.push("  " + lead("part", 10) + pad("families", 9) + pad("cutters", 8) + pad("wall", 7) + pad("beside", 7) + pad("nets", 6) + pad("heights", 9) + pad("zeros", 8));
    const parts: string[] = [...new Set(rows.map((r: IRow): string => r.part))];
    for (const part of parts) {
      const of: IRow[] = rows.filter((r: IRow): boolean => r.part === part);
      lines.push("  " + lead(part, 10) + pad(of.filter((r: IRow): boolean => r.role === "family").length, 9) + pad(of.filter((r: IRow): boolean => r.role === "cutter").length, 8) + pad(sum((r: IRow): number => r.wall, of), 7) + pad(sum(beside, of), 7) + pad(nets(of).length, 6) + pad(heights(of), 9) + pad(zeros(of), 8));
    }
    lines.push("  (beside: knot stations, turn halves, tip numbers and roll numbers)");
    lines.push("");
    lines.push("FAMILIES AND CUTTERS");
    lines.push("  " + lead("name", 15) + lead("role", 8) + lead("twin", 5) + pad("anchors", 8) + pad("arcs", 5) + pad("knots", 6) + pad("fields", 7) + pad("wall", 6) + pad("mm", 4) + pad("share", 6) + pad("angle", 6) + pad("centres", 8) + pad("halves", 7) + pad("tips", 5) + pad("roll", 5));
    for (const r of rows)
      lines.push("  " + lead(r.name, 15) + lead(r.role, 8) + lead(r.mirrored ? "yes" : "no", 5) + pad(r.anchors, 8) + pad(r.arcs, 5) + pad(r.knots, 6) + pad(r.fields, 7) + pad(r.wall, 6) + pad(r.units.mm, 4) + pad(r.units.share, 6) + pad(r.units.angle, 6) + pad(r.centres, 8) + pad(r.halves, 7) + pad(r.tips, 5) + pad(r.roll, 5));
    lines.push("  (mm, share, angle: fields by unit; a field holds one number per knot)");
    lines.push("");
    lines.push("RELIEF NETS");
    lines.push("  " + lead("net", 24) + pad("rows", 5) + pad("cols", 5) + pad("heights", 8) + pad("zeros", 7) + pad("ring", 6) + "  " + lead("stations, mm", 18) + lead("phases, rad", 20) + lead("heights, mm", 20) + "cast");
    for (const n of nets())
      lines.push("  " + lead(n.name, 24) + pad(n.rows, 5) + pad(n.columns, 5) + pad(n.heights, 8) + pad(n.zeros, 7) + pad(n.ring, 6) + "  " + lead(n.stations[0] + " .. " + n.stations[1], 18) + lead(n.phases[0].toFixed(4) + " .. " + n.phases[1].toFixed(4), 20) + lead(n.amplitude[0].toFixed(2) + " .. " + n.amplitude[1].toFixed(2), 20) + n.cast);
    lines.push("  (ring: the heights of the three outer rings, zero by the engine's rule)");
    lines.push("");
    lines.push("PLACING TABLE (AutoMovieHumanF1Placing, generated, full precision)");
    lines.push("  chain       " + pad(placing.chain.entries, 5) + " entries " + pad(placing.chain.numbers, 6) + " numbers, " + placing.chain.other + " of them not 0 or +-1");
    lines.push("  points      " + pad(placing.points.entries, 5) + " entries " + pad(placing.points.numbers, 6) + " numbers, " + placing.points.other + " of them not 0 or +-1");
    lines.push("  directions  " + pad(placing.directions.entries, 5) + " entries " + pad(placing.directions.numbers, 6) + " numbers, " + placing.directions.other + " of them not 0 or +-1");
    lines.push("  courses     " + pad(placing.courses.entries, 5) + " entries " + pad(placing.courses.names, 6) + " point names (no numbers)");
    lines.push("");
    lines.push("CONSTANTS (scanned from the tracked sources; numbers / of them mesh densities under " + TESSELLATION_KEYS + ")");
    for (const c of ["shape", "search", "tessellation", "unclassified"] as const) {
      const of: IConstant[] = constants.filter((k: IConstant): boolean => k.class === c);
      if (of.length === 0) continue;
      lines.push("  " + c);
      for (const k of of) lines.push("    " + lead(k.name, 20) + pad(k.numbers, 5) + " /" + pad(k.density, 3) + "  " + lead(path.basename(k.file) + ":" + k.line, 36) + k.note);
    }
    lines.push("  inline in construction(), by key: " + Object.entries(inline).map(([key, n]: [string, number]): string => key + " " + n + " (" + INLINE[key] + ")").join(", "));
    lines.push("");
    lines.push("MODULES THAT DECLARE A FAMILY THE FIGURE DOES NOT LIST (not in FAMILIES or CUTTERS, so not counted above)");
    for (const u of unlisted) lines.push("  " + u.file + ": \"" + u.name + "\", " + u.header);
    if (unlisted.length === 0) lines.push("  none");
    lines.push("");
    lines.push("AGAINST THE RECORD'S \"Measured\" TABLE (f1-conic-families.md)");
    lines.push("  " + lead("family", 12) + pad("record", 8) + pad("stored", 8) + pad("record", 10) + pad("stored", 8) + "   (conic numbers, then heights)");
    for (const entry of RECORD) {
      const r: IRow | undefined = rows.find((x: IRow): boolean => x.name === entry.family);
      if (r === undefined) continue;
      const stored: number = r.nets.reduce((total: number, n: INet): number => total + n.heights, 0);
      lines.push("  " + lead(entry.family, 12) + pad(entry.conic, 8) + pad(r.wall + r.knots, 8) + pad(entry.heights, 10) + pad(stored, 8) + "   " + (entry.conic === r.wall + r.knots && entry.heights === stored ? "same" : "differs: stored is " + r.knots + " knots x (" + r.fields + " fields + the station), record's is " + entry.conic / (r.fields + 1) + " knots' worth"));
    }
    lines.push("  (the record's conic numbers and each module's header count a knot's station with its fields; 'wall' above is the fields alone)");
    lines.push("  families the record's table does not list: " + rows.filter((r: IRow): boolean => !RECORD.some((entry): boolean => entry.family === r.name) && !r.name.startsWith("finger.") && !r.name.startsWith("toe.")).map((r: IRow): string => r.name + " " + r.wall + (r.nets.length === 0 ? "" : " + " + r.nets.reduce((total: number, n: INet): number => total + n.heights, 0) + " heights")).join(", "));
    lines.push("  fingers: " + rows.filter((r: IRow): boolean => r.name.startsWith("finger.")).map((r: IRow): string => r.name.slice(7) + " " + r.wall).join(", ") + " (record: 65 to 147 each)");
    lines.push("  toes: " + rows.filter((r: IRow): boolean => r.name.startsWith("toe.")).map((r: IRow): string => r.name.slice(4) + " " + r.wall).join(", ") + " (record: 39 to 65 each)");

    const out: string = path.join(root, "test", ".shots", "family-conic-count", new Date().toISOString().replace(/[:.]/g, "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "count.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "count.json"), JSON.stringify({ totals: { ...totals, shape }, rows, placing, constants, inline, unlisted, record: RECORD }, null, 1) + "\n");
    process.stdout.write(lines.slice(0, 40).join("\n") + "\nout " + out + "\n");
  }
}
void FamilyConicCount.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
