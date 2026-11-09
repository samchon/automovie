import fs from "node:fs/promises";
import path from "node:path";

import { CaptureComparison } from "../inspection/CaptureComparison";
import { CaptureManifest } from "../inspection/CaptureManifest";
import { CaptureSelection } from "../inspection/CaptureSelection";
import { HumanNodeArtifacts } from "./HumanNodeArtifacts";
import { NodeCaptureSheet } from "./NodeCaptureSheet";

/**
 * Contact sheets and before/after pairs of one capture packet. A part's sheet
 * for one stage and frame mode has one row per selection the part owns (each
 * curve alone, the part, its neighbours) followed by one unavailable cell per
 * neighbour it could not draw; the whole figure has its own sheets, followed
 * by its unavailable parts. A row lists its own cameras. Sheets of more than
 * {@link ROWS} rows continue on numbered pages.
 */
export namespace NodeCaptureOutputs {
  /** Rows per sheet page. */
  export const ROWS: number = 6;

  /** Colour legend per stage, matching `CaptureSpecs` and `NodeCaptureRender`. */
  export const LEGEND: Readonly<Record<CaptureSelection.Stage, string>> = {
    original:
      "outlines: teal -Z (left lateral), magenta +Z, orange +X anterior, purple -X | blue: fullness shoulder lines | dark: axis | aids: grey axis, violet rectangle, light grey chords, black ticks/divisions, sky-blue tangents, pink extrema, orange planes, green control polygons | frame triad red X green Y blue Z | black crosses: datums | reference: light blue-grey clay",
    loft: "generated loft: grey layer rings, guides at phases 0 teal, 90 purple, 180 magenta, 270 orange, light grey course",
    "loft-clay": "generated loft curves over default clay, lines depth-tested",
    clay: "generated default clay alone (raw loft, final skin not run)",
    reference: "each view pairs our clay (left) with the registered MetaHuman f1 reference mesh as clay (right), same camera and frame",
  };

  /** One written sheet. */
  export interface ISheet {
    /** Path relative to the packet. */
    file: string;

    /** SHA-256 of its bytes. */
    sha256: string;

    /** Owning part, `whole` or `request`. */
    owner: string;

    /** Stage, or `all` for the request sheet. */
    stage: string;

    /** Frame mode, or `all`. */
    frame: string;

    /** Page number from 1. */
    page: number;

    /** Drawn and unavailable cells on the page. */
    cells: { drawn: number; unavailable: number };
  }

  /** Parts one multi-part row left out of its camera fit as outliers. */
  export interface IOutlying {
    /** Selection id. */
    selection: string;

    /** Frame mode. */
    frame: CaptureManifest.FrameMode;

    /** Outlying parts and their farthest distance from the row's median, display metres. */
    parts: { name: string; distance: number }[];

    /** The distance limit, display metres. */
    limit: number;

    /** Parts whose non-finite framing points were left out of the fit, with their counts. */
    invalid?: { name: string; dropped: number; total: number }[];
  }

  /** Written comparison outputs. */
  export interface ICompared {
    /** The earlier packet. */
    earlier: string;

    /** Its tool. */
    tool: string;

    /** Written pairs. */
    pairs: (CaptureComparison.IPair & { file: string; sha256: string })[];

    /** Earlier frames without a new partner, with causes. */
    unpaired: { file: string; cause: string }[];

    /** Earlier frames that cannot be reproduced, with causes. */
    refused: { file: string; cause: string }[];

    /** Comparison sheet paths relative to the packet. */
    sheets: string[];
  }

  /** Write every contact sheet; a sheet holding a row with outlying parts names them in a red header line. */
  export async function sheets(out: string, frames: readonly CaptureManifest.IFrame[], images: ReadonlyMap<string, Buffer>, expanded: CaptureSelection.IOutput, size: number, stamp: string, outlying: readonly IOutlying[] = []): Promise<ISheet[]> {
    const written: ISheet[] = [];
    const modes: CaptureManifest.FrameMode[] = (["local", "world"] as const).filter((m: CaptureManifest.FrameMode): boolean => frames.some((f: CaptureManifest.IFrame): boolean => f.frame === m));
    const cellOf: (f: CaptureManifest.IFrame) => NodeCaptureSheet.ICell = (f: CaptureManifest.IFrame): NodeCaptureSheet.ICell => ({
      title: f.curve ?? f.selection,
      subtitle: `${f.stage} | ${f.camera} | ${f.frame}:${f.displayFrame}`,
      png: f.status === "drawn" ? (images.get(CaptureManifest.key(f)) ?? null) : null,
      cause: f.status === "drawn" ? (images.has(CaptureManifest.key(f)) ? null : "PNG bytes not retained") : f.cause,
    });
    const owners: (string | null)[] = [...expanded.matched, null];
    for (const owner of owners)
      for (const frame of modes)
        for (const stage of CaptureSelection.STAGES) {
          const selections: CaptureSelection.ISelection[] = expanded.selections.filter((s: CaptureSelection.ISelection): boolean => s.owner === owner && s.stages.includes(stage));
          const rows: NodeCaptureSheet.ICell[][] = [];
          for (const s of selections) {
            const own: CaptureManifest.IFrame[] = frames.filter((f: CaptureManifest.IFrame): boolean => f.selection === s.id && f.stage === stage && f.frame === frame);
            // The reference sheet pairs each view: our clay, then the reference clay.
            const row: NodeCaptureSheet.ICell[] =
              stage === "reference"
                ? own.flatMap((f: CaptureManifest.IFrame): NodeCaptureSheet.ICell[] => {
                    const clay: CaptureManifest.IFrame | undefined = frames.find((c: CaptureManifest.IFrame): boolean => c.selection === s.id && c.stage === "clay" && c.frame === frame && c.camera === f.camera);
                    return clay === undefined ? [cellOf(f)] : [cellOf(clay), cellOf(f)];
                  })
                : own.map(cellOf);
            if (row.length !== 0) rows.push(row);
          }
          if (rows.length === 0) continue;
          const missing: { name: string; cause: string }[] = selections.flatMap((s: CaptureSelection.ISelection): { name: string; cause: string }[] => s.unavailable);
          for (let k: number = 0; k < missing.length; k += 8)
            rows.push(missing.slice(k, k + 8).map((u: { name: string; cause: string }): NodeCaptureSheet.ICell => ({ title: u.name, subtitle: `${owner === null ? "figure part" : `neighbour of ${owner}`} | ${stage}`, png: null, cause: u.cause })));
          const pages: number = Math.ceil(rows.length / ROWS);
          for (let p: number = 0; p < pages; ++p) {
            const name: string = owner ?? "whole";
            const file: string = path.posix.join("sheets", `${name}.${stage}.${frame}${pages > 1 ? `.p${p + 1}` : ""}.png`);
            const page: NodeCaptureSheet.ICell[][] = rows.slice(p * ROWS, (p + 1) * ROWS);
            const alert: string = outlying
              .filter((o: IOutlying): boolean => o.frame === frame && selections.some((s: CaptureSelection.ISelection): boolean => s.id === o.selection))
              .map((o: IOutlying): string =>
                [
                  ...(o.parts.length === 0 ? [] : [`${o.selection}: ${o.parts.map((x: { name: string; distance: number }): string => `${x.name} ${x.distance.toFixed(2)} m`).join(", ")} from the median (limit ${o.limit.toFixed(2)} m)`]),
                  ...(o.invalid ?? []).map((x: { name: string; dropped: number; total: number }): string => `${o.selection}: ${x.name} has ${x.dropped} of ${x.total} framing points NaN or infinite`),
                ].join(" | "),
              )
              .join(" | ");
            const png: Buffer = await NodeCaptureSheet.compose(`f1 ${name} | stage ${stage} | frame ${frame} | page ${p + 1}/${pages} | ${stamp}`, page, size, LEGEND[stage], alert.length === 0 ? "" : `LEFT OUT OF THE CAMERA FIT: ${alert}`);
            written.push(await save(out, file, png, { owner: name, stage, frame, page: p + 1, cells: count(page) }));
          }
        }
    if (expanded.unavailable.length !== 0) {
      const rows: NodeCaptureSheet.ICell[][] = [];
      for (let k: number = 0; k < expanded.unavailable.length; k += 8)
        rows.push(expanded.unavailable.slice(k, k + 8).map((u: { name: string; cause: string }): NodeCaptureSheet.ICell => ({ title: u.name, subtitle: "requested", png: null, cause: u.cause })));
      const png: Buffer = await NodeCaptureSheet.compose(`f1 requested but unavailable | ${stamp}`, rows, size);
      written.push(await save(out, "sheets/request.unavailable.png", png, { owner: "request", stage: "all", frame: "all", page: 1, cells: count(rows) }));
    }
    return written;
  }

  /** Write the before/after pairs and their sheets. */
  export async function pairs(out: string, earlierDir: string, earlier: CaptureComparison.IRead, frames: readonly CaptureManifest.IFrame[], images: ReadonlyMap<string, Buffer>, height: number, size: number): Promise<ICompared> {
    const paired: { pairs: CaptureComparison.IPair[]; unpaired: { file: string; cause: string }[] } = CaptureComparison.pair(earlier.frames, frames, CaptureManifest.key);
    const written: (CaptureComparison.IPair & { file: string; sha256: string })[] = [];
    const rows: NodeCaptureSheet.ICell[][] = [];
    await fs.mkdir(path.join(out, "pairs"), { recursive: true });
    for (const [k, p] of paired.pairs.entries()) {
      const before: Buffer = await fs.readFile(path.join(earlierDir, p.earlier));
      const after: Buffer = images.get(CaptureManifest.key(p.key)) ?? (await fs.readFile(path.join(out, p.current)));
      const title: string = `${p.key.selection} | ${p.key.stage} | ${p.key.camera} | ${p.key.frame}${p.exactCamera ? " | exact earlier camera" : " | camera refitted by name"}`;
      const png: Buffer = await NodeCaptureSheet.pair(title, { label: p.earlier, png: before }, { label: p.current, png: after }, height);
      const file: string = path.posix.join("pairs", `${String(k + 1).padStart(3, "0")}.${p.key.stage}.${p.key.camera}.png`);
      await fs.writeFile(path.join(out, file), png);
      written.push({ ...p, file, sha256: HumanNodeArtifacts.hash(png) });
      rows.push([
        { title: `BEFORE ${p.earlier}`, subtitle: title, png: before, cause: null },
        { title: `AFTER ${p.current}`, subtitle: title, png: after, cause: null },
      ]);
    }
    for (const u of [...paired.unpaired, ...earlier.refused]) rows.push([{ title: `BEFORE ${u.file}`, subtitle: "no new partner", png: null, cause: u.cause }]);
    const sheetFiles: string[] = [];
    const pages: number = Math.ceil(rows.length / ROWS);
    for (let p: number = 0; p < pages; ++p) {
      const file: string = `sheets/compare${pages > 1 ? `.p${p + 1}` : ""}.png`;
      const png: Buffer = await NodeCaptureSheet.compose(`f1 before/after | ${path.basename(earlierDir)} (${earlier.tool}) | page ${p + 1}/${pages}`, rows.slice(p * ROWS, (p + 1) * ROWS), size);
      await fs.writeFile(path.join(out, file), png);
      sheetFiles.push(file);
    }
    return { earlier: earlierDir, tool: earlier.tool, pairs: written, unpaired: paired.unpaired, refused: earlier.refused, sheets: sheetFiles };
  }

  async function save(out: string, file: string, png: Buffer, facts: Omit<ISheet, "file" | "sha256">): Promise<ISheet> {
    await fs.mkdir(path.join(out, path.dirname(file)), { recursive: true });
    await fs.writeFile(path.join(out, file), png);
    return { file, sha256: HumanNodeArtifacts.hash(png), ...facts };
  }

  function count(rows: readonly (readonly NodeCaptureSheet.ICell[])[]): { drawn: number; unavailable: number } {
    const cells: NodeCaptureSheet.ICell[] = rows.flat();
    return { drawn: cells.filter((c: NodeCaptureSheet.ICell): boolean => c.png !== null).length, unavailable: cells.filter((c: NodeCaptureSheet.ICell): boolean => c.png === null).length };
  }
}
