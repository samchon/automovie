import { readFile, writeFile } from "node:fs/promises";
import { PNG } from "pngjs";

/**
 * Compose captured Viewer stills into a bounded PNG sheet in input order.
 * Nearest-neighbor thumbnails preserve exact sampled pixels. The JSON sidecar
 * maps every cell to its film second and source file; sheets are review media
 * and never enter a delivered film. Only one decoded source is retained at once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Compose captured Viewer stills into a bounded PNG sheet in input order) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Compose captured Viewer stills into a bounded PNG sheet in input order) directly over its typed inputs (`options`) as nested iteration of depth 3 (every over [ options.columns, options.w; some over options.frames; for-of over options.frames.entries()), delegating to `Number.isSafeInteger`, `Number.isFinite`, `Math.min`, `Math.ceil`, `PNG.sync.read`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 4, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 71 lines and 14 top-level statements that reuses `Number.isSafeInteger`, `Number.isFinite`, `Math.min`, `Math.ceil`, `PNG.sync.read` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 4 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `options`; the dominant cost is nested iteration of depth 3 (every over [ options.columns, options.w; some over options.frames; for-of over options.frames.entries()), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 3 calls per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body touches I/O, timers, listeners or process state; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
export async function writeViewerFrameSheet(options: {
  /** Ordered actual capture results, not invented frame paths. */
  frames: readonly { file: string; seconds: number }[];
  /** Destination PNG; its parent must already exist. */
  output: string;
  /** Positive number of thumbnail columns. */
  columns: number;
  /** Positive thumbnail pixel width. */
  width: number;
  /** Positive thumbnail pixel height. */
  height: number;
  /** Maximum total output pixels, checked before allocation. */
  maximumPixels: number;
}): Promise<{ file: string; index: string; width: number; height: number }> {
  if (
    options.frames.length === 0 ||
    ![
      options.columns,
      options.width,
      options.height,
      options.maximumPixels,
    ].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    options.frames.some(
      (frame: (typeof options.frames)[number]): boolean =>
        !Number.isFinite(frame.seconds) || frame.seconds < 0,
    )
  )
    throw new Error("Invalid Viewer frame-sheet dimensions, times or budget");
  const columns: number = Math.min(options.columns, options.frames.length);
  const rows: number = Math.ceil(options.frames.length / columns);
  const width: number = columns * options.width;
  const height: number = rows * options.height;
  if (
    !Number.isSafeInteger(width * height) ||
    width * height > options.maximumPixels
  )
    throw new Error("Viewer frame sheet exceeds its pixel budget");
  const sheet: PNG = new PNG({ width, height });
  sheet.data.fill(0);
  const cells: {
    row: number;
    column: number;
    file: string;
    seconds: number;
  }[] = [];
  for (const [index, frame] of options.frames.entries()) {
    const source: PNG = PNG.sync.read(await readFile(frame.file));
    const row: number = Math.floor(index / columns);
    const column: number = index % columns;
    for (let y: number = 0; y < options.height; y++)
      for (let x: number = 0; x < options.width; x++) {
        const from: number =
          (Math.floor((y * source.height) / options.height) * source.width +
            Math.floor((x * source.width) / options.width)) *
          4;
        const to: number =
          ((row * options.height + y) * width + column * options.width + x) * 4;
        sheet.data.set(source.data.subarray(from, from + 4), to);
      }
    cells.push({ row, column, file: frame.file, seconds: frame.seconds });
  }
  await writeFile(options.output, PNG.sync.write(sheet));
  const index: string = `${options.output}.json`;
  await writeFile(
    index,
    JSON.stringify(
      {
        width,
        height,
        columns,
        rows,
        cellWidth: options.width,
        cellHeight: options.height,
        cells,
      },
      null,
      2,
    ),
    "utf8",
  );
  return { file: options.output, index, width, height };
}
