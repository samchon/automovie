import fs from "node:fs/promises";
import path from "node:path";

import { HUMAN_DEBUG_CAMERAS } from "../contracts/HUMAN_DEBUG_CAMERAS";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { HumanDebugCaptureSession } from "./HumanDebugCaptureSession";
import type { IHumanDebugBatchItem } from "./IHumanDebugBatchItem";
import type { IHumanDebugFrame } from "./IHumanDebugFrame";

/**
 * Render every part of one person and save the images as evidence.
 *
 * The subjects are the whole figure and every registered piece entry (each registered argument as
 * its own entry), narrowed by `pieces` globs over the entry names; each is drawn from every camera
 * of `cameras`. Each frame is written as `<subject>.<camera>.png` beside a `<subject>.<camera>.json`
 * receipt holding the response headers' facts (source hash, PNG SHA-256, capture time, canonical
 * options, GPU) and the page's snapshot, under `<evidence>/<person>/<round>/`. A failed frame is
 * listed with its error and the batch continues, so one broken piece does not hide the others. The
 * first frame binds the batch to the source on disk and every later frame keeps that source, so a
 * batch is one generation per subject and one source throughout, however often files are saved.
 *
 * @param session The capture session.
 * @param directory Evidence directory of the round.
 * @param entries Piece entries `<name>` or `<name>:<argument>`, null for the whole figure.
 * @param cameras Camera names.
 * @param options Options every frame starts from.
 * @param nonce `fresh` nonce shared by the round's frames, or null.
 * @param keep Keep the page's loaded source from the first frame too, so batches of several people share one source.
 * @param left Whether the client already left; the frames not yet started are then not drawn.
 * @returns One item per frame, in drawing order.
 */
export async function HumanDebugBatch(
  session: HumanDebugCaptureSession,
  directory: string,
  entries: readonly (string | null)[],
  cameras: readonly (keyof typeof HUMAN_DEBUG_CAMERAS)[],
  options: IHumanDebugOptions,
  nonce: string | null,
  keep: boolean = false,
  left: () => boolean = (): boolean => false,
): Promise<IHumanDebugBatchItem[]> {
  await fs.mkdir(directory, { recursive: true });
  const items: IHumanDebugBatchItem[] = [];
  for (const piece of entries)
    for (const camera of cameras) {
      const name: string = (piece ?? "whole").replace(/[^A-Za-z0-9_.-]/g, "-") + "." + camera;
      try {
        // The first frame binds the batch to the current source; the rest keep it, so saves during the
        // batch never regenerate the person and every frame of the round shares one source.
        const frame: IHumanDebugFrame = await session.frame({ ...options, piece, camera }, nonce, keep || items.length !== 0, left);
        const png: string = path.join(directory, name + ".png");
        await fs.writeFile(png, frame.png);
        await fs.writeFile(
          path.join(directory, name + ".json"),
          JSON.stringify(
            {
              source: frame.source,
              pngSha256: frame.pngSha256,
              capturedUtc: frame.capturedUtc,
              cache: frame.cache,
              attempts: frame.attempts,
              query: frame.query,
              snapshot: frame.snapshot,
            },
            null,
            2,
          ),
        );
        items.push({
          piece,
          camera,
          file: png,
          source: frame.source,
          pngSha256: frame.pngSha256,
          notices: frame.snapshot.notices,
          error: null,
        });
      } catch (error) {
        console.error(error);
        items.push({
          piece,
          camera,
          file: null,
          source: null,
          pngSha256: null,
          notices: [],
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  return items;
}

/** Helpers of {@link HumanDebugBatch}: the entry selection of the batch route. */
export namespace HumanDebugBatch {
  /**
   * The entries a `pieces` glob list keeps; `whole` names the whole figure.
   *
   * @param all Every entry, null for the whole figure.
   * @param globs Globs over entry names; empty keeps every entry.
   */
  export function select(all: readonly (string | null)[], globs: readonly string[]): (string | null)[] {
    return all.filter(
      (entry: string | null): boolean =>
        globs.length === 0 ||
        globs.some((glob: string): boolean => HumanDebugPattern.expression(glob).test(entry ?? "whole")),
    );
  }
}
