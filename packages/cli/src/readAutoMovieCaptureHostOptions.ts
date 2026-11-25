import { AUTOMOVIE_CAPTURE_OPTIONS } from "./AUTOMOVIE_CAPTURE_OPTIONS";
import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";
import { readAutoMoviePageTimeout } from "./readAutoMoviePageTimeout";

/**
 * Split the options of `automovie capture` into the host's own,
 * `AUTOMOVIE_CAPTURE_OPTIONS`, and the capture request's, which
 * `parseAutoMovieCapturePlanRequest` reads.
 *
 * | Option                        | Meaning                                                                                                                                              | Absent                    |
 * | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
 * | `--module <file>`             | The subject module whose `subjects` the draw page offers                                                                                             | Required unless `--file`  |
 * | `--file <video>`              | An encoded video file captured from its own frames instead of a drawn subject                                                                        | A drawn subject           |
 * | `--props <file>`              | A JSON file whose value the module's `subjects` is called with, for subjects built from data a host computes                                         | `null`                    |
 * | `--out <folder>`              | The capture's root folder                                                                                                                            | `media/capture/<subject>` |
 * | `--backend <software\|gpu>`   | How the browser draws                                                                                                                                | `software`                |
 * | `--timeout-ms <milliseconds>` | Per-call budget for draw-function readiness, subject description/creation and drawing, not a total build or render deadline; integer 1 to 2147483647 | `120000`                  |
 *
 * Every other option is left for the request reader, which refuses one it does
 * not know. It throws for `--module` beside `--file`, neither of them, an empty
 * value of any host option, and a backend that is not `software` or `gpu`.
 */
export function readAutoMovieCaptureHostOptions(
  values: ReadonlyMap<string, string>,
): {
  /** Subject module path, or null for a video file. */
  module: string | null;

  /** Video file path, or null for a drawn subject. */
  file: string | null;

  /** Path of the props JSON file, or null for none. */
  props: string | null;

  /** Root folder, or null for the default. */
  out: string | null;

  /** How the browser draws. */
  backend: AutoMovieCaptureBackend;

  /**
   * Per-call milliseconds for draw-function readiness, subject
   * description/creation and drawing, not a total build or render deadline.
   */
  timeout: number;

  /** The request's own options, for the request reader. */
  request: Map<string, string>;
} {
  const request: Map<string, string> = new Map(values);
  const taken: Map<string, string> = new Map();
  for (const key of AUTOMOVIE_CAPTURE_OPTIONS) {
    const value: string | undefined = request.get(key);
    request.delete(key);
    if (value === undefined) continue;
    if (value.trim() === "")
      throw new Error(`Capture option --${key} needs a value`);
    taken.set(key, value);
  }
  const module: string | null = taken.get("module") ?? null;
  const file: string | null = taken.get("file") ?? null;
  const out: string | null = taken.get("out") ?? null;
  const backend: string = taken.get("backend") ?? "software";
  if (module !== null && file !== null)
    throw new Error("Capture takes --module or --file, not both");
  if (module === null && file === null)
    throw new Error(
      "Capture needs --module <subject module> to draw a subject, or --file <video> to capture a video file",
    );
  if (backend !== "software" && backend !== "gpu")
    throw new Error(`Capture --backend "${backend}" is not software or gpu`);
  return {
    module,
    file,
    props: taken.get("props") ?? null,
    out,
    backend,
    timeout: readAutoMoviePageTimeout(taken.get("timeout-ms")),
    request,
  };
}
