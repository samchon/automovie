import type { CaptureManifest } from "./CaptureManifest";
import type { CaptureSelection } from "./CaptureSelection";
import type { NodeCanvasTypes } from "./NodeCanvasTypes";

/**
 * Before/after pairing for `node:capture --compare <earlier packet>`. An
 * earlier `node:capture` manifest gives its own cells with their resolved
 * cameras, which the new run reproduces exactly. An earlier `node:arm-specs`
 * manifest records only a file, a camera name and an elbow pose per frame:
 * its frames are 2D-spec overlays of the whole arm in the humerus frame, so
 * each maps to that part's `original` stage at the same-named camera (its
 * joint obliques to the port close-ups), fitted afresh because no resolved
 * camera was recorded. A posed earlier frame the new run does not draw is
 * refused with its cause rather than paired with a neutral frame.
 */
export namespace CaptureComparison {
  /** One earlier frame and the cell that reproduces it. */
  export interface IEarlier extends CaptureManifest.IKey {
    /** PNG path relative to the earlier packet. */
    file: string;

    /** Its resolved camera, when the earlier manifest recorded one. */
    resolved: NodeCanvasTypes.Camera | null;
  }

  /** The earlier packet read as cells. */
  export interface IRead {
    /** `node:capture` or `node:arm-specs`. */
    tool: string;

    /** Frames that map to a reproducible cell. */
    frames: IEarlier[];

    /** Frames that cannot be reproduced, with causes. */
    refused: { file: string; cause: string }[];
  }

  /** One before/after pair. */
  export interface IPair {
    /** The cell both frames show. */
    key: CaptureManifest.IKey;

    /** Earlier PNG, relative to the earlier packet. */
    earlier: string;

    /** New PNG, relative to the new packet. */
    current: string;

    /** True when the new frame used the earlier frame's recorded camera exactly. */
    exactCamera: boolean;
  }

  /** Camera names of `node:arm-specs` packets and their capture equivalents. */
  export const ARM_SPECS_CAMERAS: Readonly<Record<string, string>> = {
    front: "front",
    left: "left",
    right: "right",
    back: "back",
    top: "top",
    bottom: "bottom",
    "elbow-oblique": "closeup.elbow",
    "wrist-oblique": "closeup.wrist",
  };

  /**
   * Read an earlier manifest.
   *
   * @param manifest Parsed `manifest.json`.
   * @param part The part an earlier single-part tool drew (`arm.left` for `node:arm-specs`).
   */
  export function read(manifest: unknown, part: string): IRead {
    if (!isRecord(manifest)) throw new Error("The earlier manifest is not an object");
    if (manifest.tool === "node:capture") {
      const frames: IEarlier[] = [];
      const refused: { file: string; cause: string }[] = [];
      for (const f of array(manifest.frames)) {
        if (!isRecord(f)) continue;
        if (f.status !== "drawn" || typeof f.file !== "string") {
          refused.push({ file: String(f.file ?? f.selection), cause: `earlier cell was ${String(f.status)}: ${String(f.cause)}` });
          continue;
        }
        frames.push({ frame: f.frame as CaptureManifest.FrameMode, selection: String(f.selection), stage: f.stage as CaptureSelection.Stage, camera: String(f.camera), file: f.file, resolved: (f.resolved ?? null) as NodeCanvasTypes.Camera | null });
      }
      return { tool: "node:capture", frames, refused };
    }
    if (typeof manifest.side === "string" && Array.isArray(manifest.frames)) {
      const frames: IEarlier[] = [];
      const refused: { file: string; cause: string }[] = [];
      for (const f of manifest.frames as unknown[]) {
        if (!isRecord(f) || typeof f.file !== "string") continue;
        const camera: string | undefined = typeof f.camera === "string" ? ARM_SPECS_CAMERAS[f.camera] : undefined;
        const pose: number = typeof f.pose === "number" ? f.pose : 0;
        if (camera === undefined) refused.push({ file: f.file, cause: `camera ${String(f.camera)} has no capture equivalent` });
        else if (pose !== 0) refused.push({ file: f.file, cause: `earlier elbow pose ${pose} rad is not drawn by this run, which draws the neutral pose` });
        else frames.push({ frame: "world", selection: `${part}/part`, stage: "original", camera, file: f.file, resolved: null });
      }
      return { tool: "node:arm-specs", frames, refused };
    }
    throw new Error("The earlier manifest is neither a node:capture nor a node:arm-specs manifest");
  }

  /**
   * Pair earlier frames with drawn new cells of the same key. An earlier
   * frame whose cell the new run did not draw stays unpaired with the new
   * cell's cause, or `not planned` when the new run has no such cell.
   */
  export function pair(earlier: readonly IEarlier[], current: readonly CaptureManifest.IFrame[], key: (k: CaptureManifest.IKey) => string): { pairs: IPair[]; unpaired: { file: string; cause: string }[] } {
    const byKey: Map<string, CaptureManifest.IFrame> = new Map(current.map((f: CaptureManifest.IFrame): [string, CaptureManifest.IFrame] => [key(f), f]));
    const pairs: IPair[] = [];
    const unpaired: { file: string; cause: string }[] = [];
    for (const e of earlier) {
      const now: CaptureManifest.IFrame | undefined = byKey.get(key(e));
      if (now === undefined) unpaired.push({ file: e.file, cause: `not planned: ${key(e)}` });
      else if (now.status !== "drawn" || now.file === null) unpaired.push({ file: e.file, cause: `new cell unavailable: ${now.cause}` });
      else
        pairs.push({
          key: { frame: e.frame, selection: e.selection, stage: e.stage, camera: e.camera },
          earlier: e.file,
          current: now.file,
          exactCamera: e.resolved !== null && now.resolved !== null && JSON.stringify(e.resolved) === JSON.stringify(now.resolved),
        });
    }
    return { pairs, unpaired };
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function array(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }
}
