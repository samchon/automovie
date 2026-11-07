import { readFile, writeFile } from "node:fs/promises";
import { PNG } from "pngjs";

/**
 * Compose captured Viewer stills into a bounded PNG sheet in input order.
 * Nearest-neighbor thumbnails preserve exact sampled pixels. The JSON sidecar
 * maps every cell to its film second and source file; sheets are review media
 * and never enter a delivered film. Only one decoded source is retained at once.
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
