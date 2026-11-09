import type { CaptureSelection } from "./CaptureSelection";
import type { NodeCanvasTypes } from "./NodeCanvasTypes";

/**
 * Records of the one-shot capture's `manifest.json` and the check that it is
 * complete: every planned cell (frame mode, selection, stage, camera) has
 * exactly one record, a drawn record carries its file, SHA-256 and resolved
 * camera, an unavailable record carries its cause, and every timing is a
 * finite non-negative number. The check reads only the records, so a cell
 * that was skipped or drawn empty cannot pass as complete.
 */
export namespace CaptureManifest {
  /** Frame modes: each part in its own segment frame, or the figure as it stands. */
  export type FrameMode = "local" | "world";

  /** One planned cell. */
  export interface IKey {
    /** Frame mode. */
    frame: FrameMode;

    /** Selection id. */
    selection: string;

    /** Stage. */
    stage: CaptureSelection.Stage;

    /** Camera name. */
    camera: string;
  }

  /** Separately measured phases of one cell, milliseconds. */
  export interface IMilliseconds {
    /** Building the cell's display meshes and curves from the prepared source. */
    display: number;

    /** Rasterization including any reference-background lookup. */
    raster: number;

    /** PNG encoding. */
    encode: number;

    /** PNG file write. */
    write: number;
  }

  /** One cell record. */
  export interface IFrame extends IKey {
    /** `drawn`, or `unavailable` with its cause. */
    status: "drawn" | "unavailable";

    /** Cause of an unavailable cell; null when drawn. */
    cause: string | null;

    /** PNG path relative to the packet; null when unavailable. */
    file: string | null;

    /** SHA-256 of the PNG bytes; null when unavailable. */
    sha256: string | null;

    /** Resolved camera; null when unavailable before framing. */
    resolved: NodeCanvasTypes.Camera | null;

    /** Selection kind, copied from the selection. */
    kind: CaptureSelection.ISelection["kind"];

    /** Selected part the row belongs to; null for the whole figure. */
    owner: string | null;

    /** Drawable parts drawn in the cell. */
    parts: string[];

    /** The one curve of a curve row; null for every curve of `parts`. */
    curve: string | null;

    /** Frame the cell is drawn in: the part's root or the curve's own segment frame (local), or `world`. */
    displayFrame: string;

    /** Related names not drawn in the cell, with causes. */
    unavailable: { name: string; cause: string }[];

    /** Drawn line ids, each once. */
    curves: string[];

    /** Drawn mesh ids, reference first. */
    meshes: string[];

    /** Line visibility rule. */
    lineMode: "xray" | "depth";

    /** Reference-background cache facts, when the cell drew a reference. */
    referenceBackground: NodeCanvasTypes.ReferenceBackground | null;

    /** Phase timings. */
    milliseconds: IMilliseconds;
  }

  /** Every planned cell for the given selections, frame modes and per-selection camera names. */
  export function plan(selections: readonly CaptureSelection.ISelection[], frames: readonly FrameMode[], cameras: (selection: CaptureSelection.ISelection) => string[]): IKey[] {
    const out: IKey[] = [];
    for (const frame of frames)
      for (const selection of selections)
        for (const stage of selection.stages)
          for (const camera of cameras(selection)) out.push({ frame, selection: selection.id, stage, camera });
    return out;
  }

  /** Stable text of a key. */
  export function key(k: IKey): string {
    return `${k.frame}|${k.selection}|${k.stage}|${k.camera}`;
  }

  /**
   * Problems that make the records incomplete against the plan; empty when
   * complete. Lists missing, duplicated and unplanned cells, drawn cells
   * without file, hash or camera, unavailable cells without cause, and
   * non-finite or negative timings.
   */
  export function problems(planned: readonly IKey[], frames: readonly IFrame[]): string[] {
    const out: string[] = [];
    const want: Set<string> = new Set(planned.map(key));
    const seen: Map<string, number> = new Map();
    for (const f of frames) {
      const k: string = key(f);
      seen.set(k, (seen.get(k) ?? 0) + 1);
      if (!want.has(k)) out.push(`unplanned cell ${k}`);
      if (f.status === "drawn") {
        if (f.file === null || f.file.length === 0) out.push(`drawn cell without file ${k}`);
        if (f.sha256 === null || !/^[0-9a-f]{64}$/.test(f.sha256)) out.push(`drawn cell without SHA-256 ${k}`);
        if (f.resolved === null) out.push(`drawn cell without resolved camera ${k}`);
      } else if (f.cause === null || f.cause.trim().length === 0) out.push(`unavailable cell without cause ${k}`);
      for (const [phase, ms] of Object.entries(f.milliseconds) as [string, number][])
        if (!(Number.isFinite(ms) && ms >= 0)) out.push(`cell ${k} has invalid ${phase} time ${ms}`);
    }
    for (const k of want) if (!seen.has(k)) out.push(`missing cell ${k}`);
    for (const [k, n] of seen) if (n > 1) out.push(`cell ${k} recorded ${n} times`);
    return out;
  }
}
