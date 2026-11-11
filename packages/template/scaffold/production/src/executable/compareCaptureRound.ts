import { encodeAutoMovieRasterPng } from "@automovie/render";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { compareCaptureStill } from "./compareCaptureStill";
import { readCapturePng } from "./readCapturePng";
import { summarizeCaptureComparison } from "./summarizeCaptureComparison";

/**
 * Compare the stills a capture just wrote against the stills of the same name in an earlier round, to read what a correction changed and what it left alone.
 *
 * Each still with a counterpart is compared pixel by pixel at `tolerance`. A changed still gets a difference image `diff-<still>` beside it, the newer picture in dimmed grey with every changed pixel in magenta. `comparison.json` lists every compared still with its changed pixel count, their share of the picture, the largest channel difference and the box that holds the change, and lists the stills the earlier round does not have under `missing`.
 *
 * It throws naming the still when a pair differs in size, which means the two rounds were not drawn at one raster, and naming the file when a still of either round cannot be decoded.
 *
 * This function reads and writes the files. What one pair reports is `compareCaptureStill` and what the record says is `summarizeCaptureComparison`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, the pairing rule, both outputs with their content, both refusals, and which functions decide.
 * @evidence contracts/development/implementation.md#principled-implementation Stills are paired by name, which carries the film second and the view, so a pair is the same moment through the same camera.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the stills that reads a pair and writes its difference image, then one record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A still the earlier round does not have is not read or compared, so the record lists it as missing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pixels of the compared stills; a difference image is encoded only for a still that changed.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each pair is read and compared once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One pair of pictures and one difference image are held at a time.
 */
export async function compareCaptureRound(props: {
  /** Folder of the stills just written; the difference images and the record go here. */
  directory: string;

  /** Folder of the earlier round. */
  reference: string;

  /** File names of the stills to compare. */
  frames: readonly string[];

  /** Largest channel difference, in bytes, that still counts as unchanged. */
  tolerance: number;
}): Promise<{
  /** Path of the written `comparison.json`. */
  file: string;

  /** Number of stills that had a counterpart. */
  compared: number;

  /** Number of compared stills with at least one changed pixel. */
  changed: number;

  /** Stills the earlier round does not have. */
  missing: string[];
}> {
  const earlier: Set<string> = new Set(await readdir(props.reference));
  const entries: ReturnType<typeof compareCaptureStill>["entry"][] = [];
  for (const frame of props.frames) {
    if (!earlier.has(frame)) continue;
    const pair: ReturnType<typeof compareCaptureStill> = compareCaptureStill({
      frame,
      earlier: await readCapturePng(path.join(props.reference, frame)),
      later: await readCapturePng(path.join(props.directory, frame)),
      tolerance: props.tolerance,
    });
    if (pair.difference !== undefined)
      await writeFile(
        path.join(props.directory, pair.difference.file),
        encodeAutoMovieRasterPng(pair.difference.image),
      );
    entries.push(pair.entry);
  }

  const record: ReturnType<typeof summarizeCaptureComparison> =
    summarizeCaptureComparison({
      reference: props.reference,
      tolerance: props.tolerance,
      frames: props.frames,
      entries,
    });
  const file: string = path.join(props.directory, "comparison.json");
  await writeFile(file, JSON.stringify(record, null, 2), "utf8");
  return {
    file,
    compared: record.compared,
    changed: record.changed,
    missing: record.missing,
  };
}
