import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { AutoMovieLoftRelief, AutoMovieViewChain, type IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicRelief, AutoMovieHumanConicSection, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicProject as P } from "./FamilyConicProject";

/**
 * f1's relief nets at coarser grids (issue #3197, stage B2): the plan, the mechanical rewrite of the modules from it, and the readings
 * of the round that follows. It reads no reference data and builds no figure.
 *
 * Usage, from `test/` after `pnpm conic:build`, each writing under `test/.shots/family-conic-coarse/`:
 * - `node .shots/esbuild/FamilyConicCoarse.cjs --plan` writes `<time>/plan.txt` and `plan.json`: for every net a module stores (a twin
 *   follows its original), its class bound, its stored grid, the grid chosen and the difference of the two surfaces. The decision is
 *   made here, before any module changes.
 * - `--modules=<time>` rewrites the rows, columns and heights of the plan's changed nets in their modules and nothing else of their text.
 * - `--revert=<net>,<net>` puts the named nets' lines back as the last commit holds them, for a control run or a net ruled back.
 * - `--check=<time>` reads the rebuilt bundle against the plan: every changed net holds the plan's heights and every other its own.
 * - `--cells=<accepted>,<new>` reads two deviation rounds' `owners.json` and `deviation.json` and lists, per owner, the cells whose mean
 *   moved by more than `MOVED.meanMm` or whose sharpest fold rose by more than `MOVED.foldDeg`, into `cells.<new>.txt`.
 * - `--frames=<accepted>,<new>` reads two figure rounds' generated frames and lists, per frame, how many pixels differ and where, into
 *   `frames.<new>.pixels.txt`: a pointer to the frames to open, not a verdict.
 *
 * The rule of the plan, fixed before the run:
 * - `SYMMETRISED` nets become the mean of themselves and their mirror image first (`FamilyConicProject.symmetrised`); the wall under
 *   them is a reflected half and the reference is symmetric, so their asymmetry is their fit's.
 * - Each net is tried on the twelve grids of `SHARES` by rows, by columns and by both, each count at least 7, a mirrored net's column
 *   count made odd. A grid is admitted when the largest difference of its least-squares projection from the net's surface, rounded as
 *   stored and read at `CHECK` samples a spacing, is within the net's bound: `BOUND.feature` for `FEATURES`, `BOUND.other` for the rest.
 * - The admitted grid with the fewest stored heights is chosen; a net with none keeps its grid and its heights.
 */
namespace FamilyConicCoarse {
  type Family = AutoMovieHumanConicLoft.IFamily;

  /** The nets made their own mirror image before anything else: the trunk's two nets that go once round it. */
  const SYMMETRISED: string[] = ["trunk.low", "trunk.crown"];

  /** The nets that carry what a person is recognised by (the issue's acceptance: eyes, nose, mouth), which take the closer bound. */
  const FEATURES: string[] = ["trunk.eyes", "trunk.mouth", "trunk.face", "trunk.chin", "nose.floor", "nose.under", "nose.side"];

  /** The largest difference of a coarse net's surface from the stored net's, mm, by class: the supervisor's ruling of 2026-11-14 on the issue. */
  const BOUND: { feature: number; other: number } = { feature: 0.1, other: 0.25 };

  /** The shares of its rows and columns a net is tried at, the survey's. */
  const SHARES: [string, number][] = [["3/4", 3 / 4], ["2/3", 2 / 3], ["1/2", 1 / 2], ["1/3", 1 / 3]];

  /** Samples a stored control spacing the projection is fitted on. */
  const FIT: number = 4;

  /** Samples a control spacing the difference is read at: another count than `FIT`, so the reading does not fall on the fitted samples alone. */
  const CHECK: number = 5;

  /** Decimal places of a stored height: the modules write hundredths of a millimetre, and a mirror pair's mean ends on a thousandth. */
  const DECIMALS: { height: number; mean: number } = { height: 2, mean: 3 };

  /** Beyond which a cell's owner is listed by `--cells`: its mean distance by 0.1 mm, its sharpest fold by 10 degrees (the stage's brief). */
  const MOVED: { meanMm: number; foldDeg: number } = { meanMm: 0.1, foldDeg: 10 };

  /** How far a colour channel must differ, of 255, for a pixel to count as changed: above the rasteriser's rounding of a shade. */
  const PIXEL: number = 8;

  /** One net's row of the plan. */
  interface IPlanned {
    net: string;
    family: string;
    bound: number;
    mirrored: boolean;
    symmetrised: boolean;
    before: { rows: number; columns: number; stored: number };
    after: { rows: number; columns: number; stored: number };
    grid: string;
    changed: boolean;
    /** The chosen net's surface against the net's own (after symmetrising, for a symmetrised net). */
    difference: P.IDifference;
    /** For a symmetrised net, the chosen net's surface against the stored, asymmetric one. */
    fromStored?: P.IDifference;
    /** The heights the module stores for a changed net: every one, or a mirrored net's half. */
    heights?: number[];
  }

  /** Whether the body's reflection maps the net's window and directions onto themselves (`FamilyConicCompact`'s rule). */
  function reflective(relief: IAutoMovieLoftRelief): boolean {
    const middle: number = relief.phases[0] + AutoMovieLoftRelief.width(relief) / 2;
    return Math.abs(Math.sin(middle)) < 1e-4 && Math.abs(relief.axis[2]) < 1e-9 && (relief.turn === undefined || (Math.abs(relief.turn[0]) < 1e-9 && Math.abs(relief.turn[1]) < 1e-9));
  }

  /** The wall's polar radius of a family at a station and a phase, mm, for the slope's reading; stations are held to the knots' range. */
  function radius(family: Family): (station: number, phase: number) => number {
    const read: (s: number) => number[] = AutoMovieHumanConicLoft.reader(family);
    const sections: Map<number, AutoMovieViewChain.ISection> = new Map();
    return (station: number, phase: number): number => {
      const s: number = Math.min(family.knots.at(-1)!, Math.max(family.knots[0]!, station));
      let section: AutoMovieViewChain.ISection | undefined = sections.get(s);
      if (section === undefined) sections.set(s, (section = AutoMovieHumanConicSection.chain(read(s), family.layout)));
      const r: number = AutoMovieViewChain.radius(section, phase);
      return Number.isFinite(r) ? r : 1;
    };
  }

  /** The module file of a family. */
  function moduleOf(root: string, family: string): string {
    return path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1" + family.split(".").map((word: string): string => word[0]!.toUpperCase() + word.slice(1)).join("") + ".ts");
  }

  /** The nets a module stores, with their families. */
  function stored(): { family: Family; mirroredFamily: boolean; relief: IAutoMovieLoftRelief }[] {
    return AutoMovieHumanF1.FAMILIES.flatMap((m: AutoMovieHumanF1.IMember) => (m.family.reliefs ?? []).filter((relief: IAutoMovieLoftRelief): boolean => AutoMovieHumanConicRelief.stored(relief) > 0).map((relief: IAutoMovieLoftRelief) => ({ family: m.family, mirroredFamily: m.mirrored, relief })));
  }

  const fix = (x: number, digits: number = 3): string => x.toFixed(digits);
  const pad = (value: string | number, width: number): string => String(value).padStart(width);
  const lead = (value: string, width: number): string => value.padEnd(width);

  /** `--plan`: the decision record. */
  async function plan(base: string): Promise<void> {
    const rows: IPlanned[] = [];
    for (const { family, mirroredFamily, relief } of stored()) {
      const symmetrised: boolean = SYMMETRISED.includes(relief.name);
      if (symmetrised && (mirroredFamily || !reflective(relief))) throw new Error(relief.name + ": not a net the body's reflection maps onto itself");
      const own: IAutoMovieLoftRelief = symmetrised ? P.symmetrised(relief, DECIMALS.mean) : relief;
      const mirrored: boolean = !mirroredFamily && reflective(own) && P.symmetric(own);
      const bound: number = FEATURES.includes(relief.name) ? BOUND.feature : BOUND.other;
      const size = (r: number, c: number): number => r * (mirrored ? (c + 1) / 2 : c);
      const wall: (station: number, phase: number) => number = radius(family);
      let best: { label: string; net: IAutoMovieLoftRelief; difference: P.IDifference } | null = null;
      for (const [which, pick] of [["rows", [true, false]], ["columns", [false, true]], ["both", [true, true]]] as [string, [boolean, boolean]][])
        for (const [label, share] of SHARES) {
          const r: number = pick[0] ? Math.max(7, Math.round(relief.rows * share)) : relief.rows;
          const even: number = pick[1] ? Math.max(7, Math.round(relief.columns * share)) : relief.columns;
          const c: number = mirrored && even % 2 === 0 ? even + 1 : even;
          if (size(r, c) >= size(relief.rows, relief.columns)) continue;
          if (best !== null && size(r, c) >= size(best.net.rows, best.net.columns)) continue;
          const net: IAutoMovieLoftRelief = P.project(own, r, c, mirrored, DECIMALS.height, FIT);
          const difference: P.IDifference = P.difference(own, net, CHECK, wall);
          if (difference.max <= bound) best = { label: which + " " + label, net, difference };
        }
      const chosen: IAutoMovieLoftRelief = best?.net ?? own;
      const changed: boolean = best !== null || symmetrised;
      const kept: number = (chosen.columns + 1) / 2;
      rows.push({
        net: relief.name,
        family: family.name,
        bound,
        mirrored,
        symmetrised,
        before: { rows: relief.rows, columns: relief.columns, stored: AutoMovieHumanConicRelief.stored(relief) },
        after: { rows: chosen.rows, columns: chosen.columns, stored: size(chosen.rows, chosen.columns) },
        grid: best?.label ?? "its own",
        changed,
        difference: best?.difference ?? P.difference(own, own, CHECK, wall),
        ...(symmetrised ? { fromStored: P.difference(relief, chosen, CHECK, wall) } : {}),
        ...(changed ? { heights: mirrored ? chosen.heights.filter((_: number, i: number): boolean => i % chosen.columns < kept) : chosen.heights } : {}),
      });
      process.stdout.write(relief.name + ": " + relief.rows + "x" + relief.columns + " -> " + chosen.rows + "x" + chosen.columns + "\n");
    }
    const total = (pick: (row: IPlanned) => number): number => rows.reduce((sum: number, row: IPlanned): number => sum + pick(row), 0);
    const lines: string[] = [
      "f1's nets at coarser grids: the plan (issue #3197, stage B2). Written before any module changes; not revised after the frames.",
      "",
      "Rule: " + SYMMETRISED.join(" and ") + " become the mean of themselves and their mirror image. Each net is then tried at " + SHARES.map(([label]: [string, number]): string => label).join(", ") + " of its rows, of its",
      "columns and of both (at least 7 each; a mirrored net's columns odd), by the least-squares projection of its own surface on its own window,",
      "fitted at " + FIT + " samples a stored spacing, the three outer rings zero, heights rounded to " + DECIMALS.height + " decimals. A grid is admitted when the largest",
      "difference of the two surfaces, read at " + CHECK + " samples a spacing by the engine's evaluator, is within the bound: " + BOUND.feature + " mm for " + FEATURES.join(", ") + ";",
      BOUND.other + " mm for every other net. The admitted grid with the fewest stored heights is chosen. A twin follows its original.",
      "",
      "Stored heights: " + total((row: IPlanned): number => row.before.stored) + " before, " + total((row: IPlanned): number => row.after.stored) + " after, saved " + (total((row: IPlanned): number => row.before.stored) - total((row: IPlanned): number => row.after.stored)) + "; nets changed " + rows.filter((row: IPlanned): boolean => row.changed).length + " of " + rows.length + ".",
      "",
      "Differences are of the chosen net's surface from the net's own (for a symmetrised net, from its symmetrised surface; its line below",
      "gives the difference from the stored, asymmetric one). max, p99, rms in mm along the cast; slope in degrees (the wall's polar radius",
      "turns a phase step into millimetres; a proxy); at: station mm, phase rad of the largest difference.",
      "",
      "  " + lead("net", 20) + pad("bound", 6) + "  " + lead("form", 9) + pad("stored grid", 12) + pad("chosen", 9) + "  " + lead("by", 12) + pad("before", 7) + pad("after", 7) + pad("saved", 7) + pad("max", 7) + pad("p99", 7) + pad("rms", 7) + pad("slope", 7) + "  at",
    ];
    for (const row of rows) {
      lines.push("  " + lead(row.net, 20) + pad(row.bound, 6) + "  " + lead(row.mirrored ? "half" : "whole", 9) + pad(row.before.rows + "x" + row.before.columns, 12) + pad(row.after.rows + "x" + row.after.columns, 9) + "  " + lead(row.grid, 12) + pad(row.before.stored, 7) + pad(row.after.stored, 7) + pad(row.before.stored - row.after.stored, 7) + pad(fix(row.difference.max), 7) + pad(fix(row.difference.p99), 7) + pad(fix(row.difference.rms), 7) + pad(fix(row.difference.slope, 2), 7) + "  (" + fix(row.difference.at[0], 1) + ", " + fix(row.difference.at[1]) + ")");
      if (row.fromStored !== undefined) lines.push("  " + lead("", 20) + "symmetrised; from the stored net: max " + fix(row.fromStored.max) + ", p99 " + fix(row.fromStored.p99) + ", rms " + fix(row.fromStored.rms) + ", slope " + fix(row.fromStored.slope, 2) + " at (" + fix(row.fromStored.at[0], 1) + ", " + fix(row.fromStored.at[1]) + ")");
    }
    const over: IPlanned[] = rows.filter((row: IPlanned): boolean => row.difference.max > row.bound);
    lines.push("", over.length === 0 ? "No chosen net stands beyond its bound." : "BEYOND ITS BOUND: " + over.map((row: IPlanned): string => row.net).join(", "));
    const out: string = path.join(base, new Date().toISOString().replace(/[:.]/g, "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "plan.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "plan.json"), JSON.stringify(rows) + "\n");
    process.stdout.write(lines.slice(8, 9).join("\n") + "\nout " + out + "\n");
  }

  /** The plan a directory holds. */
  async function load(base: string, name: string): Promise<IPlanned[]> {
    return JSON.parse(await fs.readFile(path.join(base, name, "plan.json"), "utf8")) as IPlanned[];
  }

  /** `--modules=<time>`: the changed nets' rows, columns and heights written into their modules. */
  async function modules(root: string, base: string, name: string): Promise<void> {
    const rows: IPlanned[] = (await load(base, name)).filter((row: IPlanned): boolean => row.changed);
    const receipt: string[] = [];
    for (const family of new Set(rows.map((row: IPlanned): string => row.family))) {
      const file: string = moduleOf(root, family);
      const text: string = await fs.readFile(file, "utf8");
      let done: number = 0;
      const lines: string[] = text.split("\n").map((line: string): string => {
        const match: RegExpMatchArray | null = line.match(/^( {4}\{"name":"([^"]+)", .*?)"rows":\d+, "columns":\d+, "heights":(?:\[[^\]]*\]|AutoMovieHumanConicRelief\.mirrored\(\d+, \d+, \[[^\]]*\]\))\},(\r?)$/);
        const row: IPlanned | undefined = match === null ? undefined : rows.find((candidate: IPlanned): boolean => candidate.family === family && candidate.net === match[2]);
        if (match === null || row === undefined) return line;
        ++done;
        const numbers: string = "[" + row.heights!.join(", ") + "]";
        receipt.push(row.net + "\t" + row.after.rows + " x " + row.after.columns + "\t" + row.heights!.length + " heights written as " + (row.mirrored ? "a half" : "a whole"));
        return match[1] + "\"rows\":" + row.after.rows + ", \"columns\":" + row.after.columns + ", \"heights\":" + (row.mirrored ? "AutoMovieHumanConicRelief.mirrored(" + row.after.rows + ", " + row.after.columns + ", " + numbers + ")" : numbers) + "}," + match[3];
      });
      const wanted: number = rows.filter((row: IPlanned): boolean => row.family === family).length;
      if (done !== wanted) throw new Error(file + ": " + done + " of " + wanted + " nets were found; nothing written");
      if (rows.some((row: IPlanned): boolean => row.family === family && row.mirrored) && !text.includes("AutoMovieHumanConicRelief\";")) throw new Error(file + ": it does not import the helper a half needs");
      await fs.writeFile(file, lines.join("\n"));
      receipt.push("wrote " + path.relative(root, file) + ": " + done + " nets");
    }
    await fs.writeFile(path.join(base, name, "modules.txt"), receipt.join("\n") + "\n");
    process.stdout.write(receipt.filter((line: string): boolean => line.startsWith("wrote")).join("\n") + "\n");
  }

  /**
   * `--revert=<net>,<net>`: the named nets' lines put back as the last commit holds them (`git show HEAD:<module>`), character for
   * character, for a control run or for a net ruled back to its stored grid. `--modules=<time>` writes the plan's nets again.
   */
  async function revert(root: string, names: string[]): Promise<void> {
    const { execFileSync } = await import("node:child_process");
    for (const family of new Set(names.map((name: string): string => name.split(".")[0]!))) {
      const file: string = moduleOf(root, family);
      const committed: string[] = execFileSync("git", ["show", "HEAD:" + path.relative(root, file).replaceAll("\\", "/")], { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 }).split("\n");
      const head = (line: string): string | undefined => line.match(/^ {4}\{"name":"([^"]+)", /)?.[1];
      let done: number = 0;
      const lines: string[] = (await fs.readFile(file, "utf8")).split("\n").map((line: string): string => {
        const name: string | undefined = head(line);
        if (name === undefined || !names.includes(name)) return line;
        const old: string | undefined = committed.find((candidate: string): boolean => head(candidate) === name);
        if (old === undefined) throw new Error(name + ": the last commit's module holds no such net");
        ++done;
        return old;
      });
      const wanted: number = names.filter((name: string): boolean => name.split(".")[0] === family).length;
      if (done !== wanted) throw new Error(file + ": " + done + " of " + wanted + " nets were found; nothing written");
      await fs.writeFile(file, lines.join("\n"));
      process.stdout.write("reverted in " + path.relative(root, file) + ": " + names.filter((name: string): boolean => name.split(".")[0] === family).join(", ") + "\n");
    }
  }

  /** `--check=<time>`: the rebuilt bundle against the plan. */
  async function check(base: string, name: string): Promise<void> {
    const rows: IPlanned[] = await load(base, name);
    const faults: string[] = [];
    const nets = stored();
    for (const row of rows) {
      const relief: IAutoMovieLoftRelief | undefined = nets.find((entry): boolean => entry.relief.name === row.net)?.relief;
      if (relief === undefined) faults.push(row.net + ": not in the bundle");
      else if (relief.rows !== row.after.rows || relief.columns !== row.after.columns || AutoMovieHumanConicRelief.stored(relief) !== row.after.stored) faults.push(row.net + ": the bundle holds " + relief.rows + " x " + relief.columns + " with " + AutoMovieHumanConicRelief.stored(relief) + " stored");
      else if (row.heights !== undefined) {
        const kept: number = (relief.columns + 1) / 2;
        const want: number[] = row.mirrored ? AutoMovieHumanConicRelief.mirrored(relief.rows, relief.columns, row.heights) : row.heights;
        if (want.length !== relief.heights.length || want.some((h: number, i: number): boolean => h !== relief.heights[i])) faults.push(row.net + ": its heights are not the plan's (" + kept + " stored columns)");
      }
    }
    const lines: string[] = ["the bundle against " + name + "/plan.json: " + rows.length + " nets, " + rows.filter((row: IPlanned): boolean => row.changed).length + " changed, " + faults.length + " faults", ...faults];
    await fs.writeFile(path.join(base, name, "check.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\n");
    if (faults.length > 0) process.exitCode = 1;
  }

  /** `--cells=<accepted>,<new>`: the owners' cells that moved, from two deviation rounds. */
  async function cells(root: string, base: string, accepted: string, fresh: string): Promise<void> {
    interface IOwner {
      owner: string;
      areaMm2: number;
      meanMm: number;
      farthestMm: number;
      foldDeg: number;
    }
    const directory: string = path.join(root, "test/.shots/family-conic-deviation");
    const read = async (round: string, file: string): Promise<Record<string, unknown>> => JSON.parse(await fs.readFile(path.join(directory, round, file), "utf8")) as Record<string, unknown>;
    const [a, b]: Record<string, unknown>[] = [await read(accepted, "owners.json"), await read(fresh, "owners.json")];
    const [da, db]: Record<string, unknown>[] = [await read(accepted, "deviation.json"), await read(fresh, "deviation.json")];
    const table = (owners: Record<string, unknown>): Map<string, IOwner> => new Map((owners.cells as { centreMm: number[]; owners: IOwner[] }[]).flatMap((cell): [string, IOwner][] => cell.owners.map((owner: IOwner): [string, IOwner] => [cell.centreMm.join(",") + " " + owner.owner, owner])));
    const [before, after]: Map<string, IOwner>[] = [table(a!), table(b!)];
    const listed: { owner: string; cell: string; before: IOwner | undefined; after: IOwner | undefined }[] = [];
    for (const key of new Set([...before!.keys(), ...after!.keys()])) {
      const [x, y]: (IOwner | undefined)[] = [before!.get(key), after!.get(key)];
      if (x === undefined || y === undefined || Math.abs(y.meanMm - x.meanMm) > MOVED.meanMm || y.foldDeg - x.foldDeg > MOVED.foldDeg) listed.push({ owner: (x ?? y)!.owner, cell: key.split(" ")[0]!, before: x, after: y });
    }
    const lines: string[] = [
      "accepted " + accepted + ", new " + fresh,
      "whole skin: meanMm " + String(da!.meanMm) + " -> " + String(db!.meanMm) + "; shareBeyond1Mm " + String(da!.shareBeyond1Mm) + " -> " + String(db!.shareBeyond1Mm),
      "owner rows: " + before!.size + " accepted, " + after!.size + " new; listed below: mean moved by more than " + MOVED.meanMm + " mm, sharpest fold risen by more than " + MOVED.foldDeg + " degrees, or in one round only: " + listed.length,
      "",
      ["owner", "cell centre mm", "mean before", "after", "fold before", "after", "farthest before", "after", "area before", "after"].join("\t"),
    ];
    for (const row of listed.sort((x, y): number => x.owner.localeCompare(y.owner) || x.cell.localeCompare(y.cell))) lines.push([row.owner, row.cell, row.before?.meanMm, row.after?.meanMm, row.before?.foldDeg, row.after?.foldDeg, row.before?.farthestMm, row.after?.farthestMm, row.before?.areaMm2, row.after?.areaMm2].join("\t"));
    const counts: Map<string, number> = new Map();
    for (const row of listed) counts.set(row.owner, (counts.get(row.owner) ?? 0) + 1);
    lines.push("", "by owner: " + [...counts].map(([owner, n]: [string, number]): string => owner + " " + n).join(", "));
    const file: string = path.join(base, "cells." + fresh + ".txt");
    await fs.writeFile(file, lines.join("\n") + "\n");
    process.stdout.write(lines.slice(1, 3).join("\n") + "\n" + lines.at(-1) + "\nout " + file + "\n");
  }

  /** `--frames=<accepted>,<new>`: the generated frames whose pixels differ, and where. */
  async function frames(root: string, base: string, accepted: string, fresh: string): Promise<void> {
    const directory: string = path.join(root, "test/.shots/family-conic-figure");
    const pixels = async (file: string): Promise<{ width: number; height: number; data: Uint8ClampedArray }> => {
      const image = await loadImage(file);
      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return { width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data };
    };
    const rows: { file: string; changed: number; share: number; box: string; most: number }[] = [];
    for (const file of (await fs.readdir(path.join(directory, fresh))).filter((f: string): boolean => f.endsWith(".generated.png")).sort((x: string, y: string): number => x.localeCompare(y))) {
      const [a, b] = [await pixels(path.join(directory, accepted, file)), await pixels(path.join(directory, fresh, file))];
      if (a.width !== b.width || a.height !== b.height) {
        rows.push({ file, changed: -1, share: 1, box: "sizes differ", most: 255 });
        continue;
      }
      let changed: number = 0;
      let most: number = 0;
      const box: number[] = [Infinity, Infinity, -Infinity, -Infinity];
      for (let i: number = 0; i < a.data.length; i += 4) {
        const d: number = Math.max(Math.abs(a.data[i]! - b.data[i]!), Math.abs(a.data[i + 1]! - b.data[i + 1]!), Math.abs(a.data[i + 2]! - b.data[i + 2]!));
        most = Math.max(most, d);
        if (d <= PIXEL) continue;
        ++changed;
        const [x, y]: [number, number] = [(i / 4) % a.width, Math.floor(i / 4 / a.width)];
        box[0] = Math.min(box[0]!, x);
        box[1] = Math.min(box[1]!, y);
        box[2] = Math.max(box[2]!, x);
        box[3] = Math.max(box[3]!, y);
      }
      rows.push({ file, changed, share: changed / (a.width * a.height), box: changed === 0 ? "-" : "x " + box[0] + ".." + box[2] + ", y " + box[1] + ".." + box[3], most });
    }
    const lines: string[] = ["accepted " + accepted + ", new " + fresh + "; generated frames; a pixel counts as changed when a channel differs by more than " + PIXEL + " of 255", "", ["frame", "changed pixels", "share", "largest channel difference", "region"].join("\t")];
    for (const row of rows.sort((x, y): number => y.changed - x.changed)) lines.push([row.file, row.changed, (100 * row.share).toFixed(2) + "%", row.most, row.box].join("\t"));
    const file: string = path.join(base, "frames." + fresh + ".pixels.txt");
    await fs.writeFile(file, lines.join("\n") + "\n");
    process.stdout.write(rows.length + " frames, " + rows.filter((row): boolean => row.changed !== 0).length + " with changed pixels\nout " + file + "\n");
  }

  /** Run the mode the arguments name. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const base: string = path.join(root, "test/.shots/family-conic-coarse");
    await fs.mkdir(base, { recursive: true });
    const value = (flag: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith(flag + "="))?.slice(flag.length + 1);
    if (process.argv.includes("--plan")) await plan(base);
    const written: string | undefined = value("--modules");
    if (written !== undefined) await modules(root, base, written);
    const back: string[] | undefined = value("--revert")?.split(",");
    if (back !== undefined) await revert(root, back);
    const checked: string | undefined = value("--check");
    if (checked !== undefined) await check(base, checked);
    const rounds: string[] | undefined = value("--cells")?.split(",");
    if (rounds !== undefined) await cells(root, base, rounds[0]!, rounds[1]!);
    const pair: string[] | undefined = value("--frames")?.split(",");
    if (pair !== undefined) await frames(root, base, pair[0]!, pair[1]!);
  }
}
void FamilyConicCoarse.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
