import {
  type IAutoMovieRasterComparison,
  compareAutoMovieRasters,
  encodeAutoMovieRasterPng,
} from "@automovie/viewer";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { readCapturePng } from "./readCapturePng";

/**
 * Compare the stills a capture just wrote against the stills of the same name in an earlier round, to read what a correction changed and what it left alone.
 *
 * Each still with a counterpart is compared pixel by pixel by the viewer's comparison at `tolerance`. A changed still gets a difference image `diff-<still>` beside it, the newer picture in dimmed grey with every changed pixel in magenta. `comparison.json` lists every compared still with its changed pixel count, their share of the picture, the largest channel difference and the box that holds the change, and lists the stills the earlier round does not have under `missing`.
 *
 * It throws naming the still when a pair differs in size, which means the two rounds were not drawn at one raster.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, the pairing rule, both outputs with their content and the refusal with its meaning.
 * @evidence contracts/development/implementation.md#principled-implementation Stills are paired by name, which carries the film second and the view, so a pair is the same moment through the same camera; the measure and the difference image are the viewer's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the stills, then one record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A still without a counterpart is reported as missing instead of counted as unchanged, and no verdict is stored: the reader knows what was meant to change.
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
  const frames: (Omit<IAutoMovieRasterComparison, "image"> & {
    frame: string;
  })[] = [];
  const missing: string[] = [];
  for (const frame of props.frames) {
    if (!earlier.has(frame)) {
      missing.push(frame);
      continue;
    }
    let comparison: IAutoMovieRasterComparison;
    try {
      comparison = compareAutoMovieRasters(
        await readCapturePng(path.join(props.reference, frame)),
        await readCapturePng(path.join(props.directory, frame)),
        props.tolerance,
      );
    } catch (error) {
      throw new Error(
        `${frame} cannot be compared against ${props.reference}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    const { image, ...numbers } = comparison;
    if (comparison.changed > 0)
      await writeFile(
        path.join(props.directory, `diff-${frame}`),
        encodeAutoMovieRasterPng(image),
      );
    frames.push({ frame, ...numbers });
  }

  const file: string = path.join(props.directory, "comparison.json");
  const changed: number = frames.filter(
    (entry: { changed: number }): boolean => entry.changed > 0,
  ).length;
  await writeFile(
    file,
    JSON.stringify(
      {
        reference: props.reference,
        tolerance: props.tolerance,
        compared: frames.length,
        changed,
        missing,
        frames,
      },
      null,
      2,
    ),
    "utf8",
  );
  return { file, compared: frames.length, changed, missing };
}
