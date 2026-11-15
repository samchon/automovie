import fs from "node:fs/promises";
import path from "node:path";

/**
 * The whole-figure gate as a table: one round of `FamilyConicFigure.ts --owners` and `FamilyConicDeviation.ts --owners` on a changed tree
 * read against the accepted round, every cell of the figure and not only the changed region's (the Human skill's supervision, step 7).
 *
 * Usage, from `test/` after `pnpm conic:build`:
 * `node .shots/esbuild/FamilyConicGate.cjs --figure=<accepted>,<new> --deviation=<accepted>,<new>`, each a round's directory name under
 * `test/.shots/family-conic-figure/` and `test/.shots/family-conic-deviation/`. It writes `test/.shots/family-conic-gate/<new deviation
 * round>.txt` and reads only the rounds' receipts, never the reference.
 *
 * A round passes when it is one piece with the accepted round's faults, none (a fault is a piece's diagnostics list, so none is an
 * empty list as the accepted round's); its `deviation.json` holds the accepted `meanMm` and `shareBeyond1Mm` to their four decimals; and every 30 mm cell of `owners.json`
 * holds the same owners, each owner's area within `LIMITS.areaShare` or `LIMITS.areaMm2` and its mean distance within `LIMITS.meanMm` of
 * the accepted round's. Every cell that differs at all is listed, passing or not, then every owner row that differs beyond the reading
 * thresholds `READ` with its fold and farthest distance, and the frames whose bytes differ, so the reader knows which frames to open
 * beside the accepted ones. `--accepted=<text>` records under the verdict the supervisor's ruling on a round the limits refuse.
 */
namespace FamilyConicGate {
  /**
   * How far a cell's owner may stand from the accepted round's: its area by 1 % or 2 mm2, whichever is larger (a cell's edge triangles
   * change hands when a vertex moves in the last place) and its mean signed distance by 0.02 mm (twice the receipts' 0.01 mm rounding).
   * The sharpest fold is listed and not judged: it is the sharpest single edge of the cell, which a retriangulation of a traced join
   * changes by tens of degrees without the skin moving (the round of 2026-11-14T09-15-57.224Z: 24.8 degrees on the helix's ridge with
   * every mean within 0.04 mm, on inputs that differed by 4.7e-12 at most).
   */
  const LIMITS: { areaShare: number; areaMm2: number; meanMm: number } = { areaShare: 0.01, areaMm2: 2, meanMm: 0.02 };

  /** Beyond which an owner row is listed for reading: its mean by 0.005 mm, its area by 0.5 mm2 or its sharpest fold by 1 degree. */
  const READ: { meanMm: number; areaMm2: number; foldDeg: number } = { meanMm: 0.005, areaMm2: 0.5, foldDeg: 1 };

  /** One owner's share of a cell, as `owners.json` lists it. */
  interface IOwner {
    owner: string;
    areaMm2: number;
    meanMm: number;
    farthestMm: number;
    foldDeg: number;
  }

  /** One cell of `owners.json`. */
  interface ICell {
    centreMm: [number, number, number];
    owners: IOwner[];
  }

  /** A figure round's receipt. */
  interface IReceipt {
    pieces: { name: string; vertices: number; triangles: number }[];
    faults: unknown[];
    frames: { file: string; sha256: string }[];
  }

  /** Compare the two rounds and write the table. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const pair = (flag: string): [string, string] => {
      const value: string[] | undefined = process.argv.find((a: string): boolean => a.startsWith(flag + "="))?.slice(flag.length + 1).split(",");
      if (value === undefined || value.length !== 2) throw new Error(flag + "=<accepted>,<new> is required");
      return [value[0]!, value[1]!];
    };
    const [figureOld, figureNew]: [string, string] = pair("--figure");
    const [deviationOld, deviationNew]: [string, string] = pair("--deviation");
    const read = async <X>(...parts: string[]): Promise<X> => JSON.parse(await fs.readFile(path.join(root, "test/.shots", ...parts), "utf8")) as X;
    const note: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--accepted="))?.slice(11);
    const lines: string[] = ["whole-figure gate: accepted figure " + figureOld + " and deviation " + deviationOld + "; new figure " + figureNew + " and deviation " + deviationNew, ""];
    const failures: string[] = [];

    // The figure: pieces, faults and frames.
    const [a, b]: IReceipt[] = [await read<IReceipt>("family-conic-figure", figureOld, "receipt.json"), await read<IReceipt>("family-conic-figure", figureNew, "receipt.json")];
    lines.push("pieces: accepted " + JSON.stringify(a!.pieces) + "; new " + JSON.stringify(b!.pieces), "faults: accepted " + JSON.stringify(a!.faults) + "; new " + JSON.stringify(b!.faults));
    if (b!.pieces.length !== 1) failures.push("the figure is " + b!.pieces.length + " pieces");
    if (b!.faults.length > 0 || JSON.stringify(a!.faults) !== JSON.stringify(b!.faults)) failures.push("the faults differ from the accepted round's or are not empty");
    const hashes: Map<string, string> = new Map(a!.frames.map((frame: { file: string; sha256: string }): [string, string] => [frame.file, frame.sha256]));
    const changed: string[] = b!.frames.filter((frame: { file: string; sha256: string }): boolean => hashes.get(frame.file) !== frame.sha256).map((frame: { file: string }): string => frame.file);
    lines.push("frames: " + b!.frames.length + " in the new round, " + changed.length + " whose bytes differ from the accepted round's" + (changed.length === 0 ? "" : ": " + changed.join(", ")), "");

    // The deviation: the two summary numbers to their four decimals.
    const [c, d]: { meanMm: number; shareBeyond1Mm: number }[] = [await read<{ meanMm: number; shareBeyond1Mm: number }>("family-conic-deviation", deviationOld, "deviation.json"), await read<{ meanMm: number; shareBeyond1Mm: number }>("family-conic-deviation", deviationNew, "deviation.json")];
    lines.push("meanMm: accepted " + c!.meanMm + ", new " + d!.meanMm, "shareBeyond1Mm: accepted " + c!.shareBeyond1Mm + ", new " + d!.shareBeyond1Mm, "");
    if (c!.meanMm.toFixed(4) !== d!.meanMm.toFixed(4)) failures.push("meanMm moved");
    if (c!.shareBeyond1Mm.toFixed(4) !== d!.shareBeyond1Mm.toFixed(4)) failures.push("shareBeyond1Mm moved");

    // The owners: every cell, every owner.
    const [e, f]: { cells: ICell[] }[] = [await read<{ cells: ICell[] }>("family-conic-deviation", deviationOld, "owners.json"), await read<{ cells: ICell[] }>("family-conic-deviation", deviationNew, "owners.json")];
    const key = (cell: ICell): string => cell.centreMm.join(",");
    const accepted: Map<string, ICell> = new Map(e!.cells.map((cell: ICell): [string, ICell] => [key(cell), cell]));
    const fresh: Map<string, ICell> = new Map(f!.cells.map((cell: ICell): [string, ICell] => [key(cell), cell]));
    const rows: string[] = [];
    let differing: number = 0;
    let failing: number = 0;
    const worst: { areaMm2: number; meanMm: number; foldDeg: number; farthestMm: number } = { areaMm2: 0, meanMm: 0, foldDeg: 0, farthestMm: 0 };
    const listed: string[] = [];
    let owned: number = 0;
    for (const name of new Set([...accepted.keys(), ...fresh.keys()])) {
      const [old, now]: (ICell | undefined)[] = [accepted.get(name), fresh.get(name)];
      if (old === undefined || now === undefined) {
        ++differing;
        ++failing;
        rows.push(["FAIL", name, "cell only in the " + (old === undefined ? "new" : "accepted") + " round"].join("\t"));
        continue;
      }
      const owners: Map<string, IOwner> = new Map(old.owners.map((owner: IOwner): [string, IOwner] => [owner.owner, owner]));
      const notes: string[] = [];
      let fail: boolean = false;
      for (const owner of now.owners) {
        const before: IOwner | undefined = owners.get(owner.owner);
        owners.delete(owner.owner);
        if (before === undefined) {
          fail = true;
          notes.push(owner.owner + " is new (" + owner.areaMm2 + " mm2)");
          continue;
        }
        const [area, mean, fold]: number[] = [Math.abs(owner.areaMm2 - before.areaMm2), Math.abs(owner.meanMm - before.meanMm), Math.abs(owner.foldDeg - before.foldDeg)];
        worst.areaMm2 = Math.max(worst.areaMm2, area!);
        worst.meanMm = Math.max(worst.meanMm, mean!);
        worst.foldDeg = Math.max(worst.foldDeg, fold!);
        worst.farthestMm = Math.max(worst.farthestMm, Math.abs(owner.farthestMm - before.farthestMm));
        ++owned;
        if (mean! > READ.meanMm || area! > READ.areaMm2 || fold! > READ.foldDeg) listed.push([name, owner.owner, "area " + before.areaMm2 + " -> " + owner.areaMm2, "mean " + before.meanMm + " -> " + owner.meanMm, "farthest " + before.farthestMm + " -> " + owner.farthestMm, "fold " + before.foldDeg + " -> " + owner.foldDeg].join("\t"));
        if (JSON.stringify(owner) === JSON.stringify(before)) continue;
        const beyond: boolean = area! > Math.max(LIMITS.areaMm2, LIMITS.areaShare * before.areaMm2) || mean! > LIMITS.meanMm;
        fail = fail || beyond;
        notes.push(owner.owner + ": area " + before.areaMm2 + " -> " + owner.areaMm2 + ", mean " + before.meanMm + " -> " + owner.meanMm + ", fold " + before.foldDeg + " -> " + owner.foldDeg + (beyond ? " BEYOND" : ""));
      }
      for (const gone of owners.keys()) {
        fail = true;
        notes.push(gone + " is gone");
      }
      if (notes.length === 0) continue;
      ++differing;
      if (fail) ++failing;
      rows.push([fail ? "FAIL" : "within", name, notes.join("; ")].join("\t"));
    }
    if (failing > 0) failures.push(failing + " cells beyond the limits");
    lines.push(
      "cells: " + accepted.size + " accepted, " + fresh.size + " new; " + differing + " differ in any listed number, " + failing + " beyond the limits (area " + LIMITS.areaShare * 100 + " % or " + LIMITS.areaMm2 + " mm2, mean " + LIMITS.meanMm + " mm; the fold is listed, not judged)",
      "largest differences over the " + owned + " owner rows both rounds hold: area " + worst.areaMm2.toFixed(2) + " mm2, mean " + worst.meanMm.toFixed(3) + " mm, farthest " + worst.farthestMm.toFixed(2) + " mm, fold " + worst.foldDeg.toFixed(1) + " degrees",
      "",
      ["verdict", "cell centre, mm", "owners that differ"].join("\t"),
      ...rows,
      "",
      listed.length + " owner rows differ beyond the reading thresholds (mean " + READ.meanMm + " mm, area " + READ.areaMm2 + " mm2, fold " + READ.foldDeg + " degree):",
      ["cell centre, mm", "owner", "area, mm2", "mean, mm", "farthest, mm", "fold, degrees"].join("\t"),
      ...listed,
      "",
      failures.length === 0 ? "PASS" : "FAIL: " + failures.join("; "),
      ...(note === undefined ? [] : ["supervisor's ruling: " + note]),
    );
    const out: string = path.join(root, "test/.shots/family-conic-gate");
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, deviationNew + ".txt"), lines.join("\n") + "\n");
    process.stdout.write([...lines.slice(0, 10), ...lines.slice(note === undefined ? -1 : -2), "out " + path.join(out, deviationNew + ".txt")].join("\n") + "\n");
    if (failures.length > 0) process.exitCode = 1;
  }
}
void FamilyConicGate.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
