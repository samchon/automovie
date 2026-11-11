import type { IAutoMovieRasterImage } from "@automovie/viewer";
import { readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

import { CaptureDirectory } from "./CaptureDirectory";
import { formatCaptureSeconds } from "./formatCaptureSeconds";
import { isCaptureOwnedFile } from "./isCaptureOwnedFile";
import { readCapturePng } from "./readCapturePng";
import { runCaptureFfmpeg } from "./runCaptureFfmpeg";

/**
 * Sample an encoded video file into stills and contact sheets, for reading a delivered or generated file frame by frame as a capture of the film is read.
 *
 * The installed FFmpeg decodes `[from, to)` of the file and keeps `rate` stills per second, each the file's frame nearest its second, at the file's own raster. They are written as `t<seconds>.png` with the seconds counted in the file's own time, put on sheets captioned with the second, and listed in `manifest.json`, into `out` or `media/automovie/files/<file name>/<from>-<to>/`. The stills carry the file's pixels untouched; only sheet cells are captioned. A file that ends before `to` yields the stills it has.
 *
 * It throws when the file does not exist, when the window is not `0 <= from < to`, when the rate is not positive, and when no frame of the file lies in the window.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, the sampling rule and its time base, the outputs and their folder, what is left untouched, the short-file case and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Seeking before the input makes FFmpeg decode from the window's first frame and count time from it, and its rate filter keeps the frame nearest each sample, so still `k` shows second `from + k / rate` of the file.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the request, open the folder, decode, then name and index each still in order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stills are not resized or stamped, a still at or past `to` is deleted instead of listed, and an empty result throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One FFmpeg run decodes the window once; each still is decoded once more for its sheet cell.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The folder, sheets, manifest, rounds and comparison are the capture directory's, shared with the film capture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources FFmpeg has ended before the stills are read, and one decoded still is held at a time.
 */
export async function captureEncodedStills(props: {
  /** Path of the video file. */
  file: string;

  /** First second of the window, inclusive, in the file's time. */
  from: number;

  /** End second of the window, exclusive. */
  to: number;

  /** Stills per second. */
  rate: number;

  /** Output folder, or undefined for the default under `media/automovie/files`. */
  out: string | undefined;

  /** Round, comparison, tolerance and sheet layout of the run. */
  layout: Omit<CaptureDirectory.ILayout, "base">;
}): Promise<CaptureDirectory.IReport> {
  const { file, from, to, rate } = props;
  if (
    !(await stat(file)
      .then((entry: { isFile(): boolean }): boolean => entry.isFile())
      .catch((): boolean => false))
  )
    throw new Error(`No video file at ${file}`);
  if (!(0 <= from && from < to && Number.isFinite(to)))
    throw new Error("The window must satisfy 0 <= from < to");
  if (!(rate > 0 && Number.isFinite(rate)))
    throw new Error("--rate must be a positive number of stills per second");

  const output: CaptureDirectory = await CaptureDirectory.open({
    ...props.layout,
    base:
      props.out ??
      path.join(
        "media",
        "automovie",
        "files",
        path.basename(file),
        `${formatCaptureSeconds(from)}-${formatCaptureSeconds(to)}`,
      ),
  });

  // Decode the window once; FFmpeg numbers its stills from zero.
  runCaptureFfmpeg([
    "-y",
    "-ss",
    String(from),
    "-i",
    file,
    "-t",
    String(to - from),
    "-vf",
    `fps=${rate}`,
    "-pix_fmt",
    "rgb24",
    "-start_number",
    "0",
    path.join(output.directory, "s%05d.png"),
  ]);

  // The folder was cleared of owned names when it was opened, so every owned `s<number>.png` in it is FFmpeg's; a number grows a digit past 99999, so the stills are ordered by number.
  const decoded: string[] = (await readdir(output.directory))
    .filter(
      (entry: string): boolean =>
        /^s\d/u.test(entry) && isCaptureOwnedFile(entry),
    )
    .sort(
      (a: string, b: string): number =>
        Number(a.slice(1, -4)) - Number(b.slice(1, -4)),
    );

  // Name each still by its second, and drop any the rate filter emitted at or past the window's end.
  const times: number[] = [];
  let raster: { width: number; height: number } | null = null;
  for (const [index, entry] of decoded.entries()) {
    const seconds: number = from + index / rate;
    if (seconds >= to - 1e-9) {
      await rm(path.join(output.directory, entry));
      continue;
    }
    const name: string = `t${formatCaptureSeconds(seconds)}.png`;
    await rename(
      path.join(output.directory, entry),
      path.join(output.directory, name),
    );
    const image: IAutoMovieRasterImage = await readCapturePng(
      path.join(output.directory, name),
    );
    raster ??= { width: image.width, height: image.height };
    await output.record(image, {
      file: name,
      seconds,
      view: undefined,
      caption: `${seconds.toFixed(2)}s`,
    });
    times.push(seconds);
  }
  if (times.length === 0)
    throw new Error(`No frame of ${file} lies in [${from}, ${to}) seconds`);

  return output.close({ file, from, to, rate, raster, times });
}
