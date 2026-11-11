import { AUTOMOVIE_CAPTURE_OPTIONS } from "./AUTOMOVIE_CAPTURE_OPTIONS";
import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";

/**
 * Split the options of `automovie capture` into the host's own, `AUTOMOVIE_CAPTURE_OPTIONS`, and the capture request's, which `parseAutoMovieCapturePlanRequest` reads.
 *
 * | Option | Meaning | Absent |
 * | --- | --- | --- |
 * | `--module <file>` | The subject module whose `subjects` the draw page offers | Required unless `--file` |
 * | `--file <video>` | An encoded video file captured from its own frames instead of a drawn subject | A drawn subject |
 * | `--props <file>` | A JSON file whose value the module's `subjects` is called with, for subjects built from data a host computes | `null` |
 * | `--out <folder>` | The capture's root folder | `media/capture/<subject>` |
 * | `--backend <software\|gpu>` | How the browser draws | `software` |
 *
 * Every other option is left for the request reader, which refuses one it does not know. It throws for `--module` beside `--file`, neither of them, an empty value of any host option, and a backend that is not `software` or `gpu`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates the host's options with their meaning and absent value, says where the rest go, and states every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The host's keys are removed before the request is read, so the request grammar stays one grammar for the address, the command and props, and a host key cannot be mistaken for a request key.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the listed options that takes the host's keys out, then the checks; the list is the one the README test reads.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No subject module is guessed from the folder: a capture names what it draws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the options.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per command.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh map and keeps nothing.
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

  /** The request's own options, for the request reader. */
  request: Map<string, string>;
} {
  const request: Map<string, string> = new Map(values);
  const taken: Map<string, string> = new Map();
  for (const key of AUTOMOVIE_CAPTURE_OPTIONS) {
    const value: string | undefined = request.get(key);
    request.delete(key);
    if (value === undefined) continue;
    if (value.trim() === "") throw new Error(`Capture option --${key} needs a value`);
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
  return { module, file, props: taken.get("props") ?? null, out, backend, request };
}
