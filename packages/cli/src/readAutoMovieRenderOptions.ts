import { AUTOMOVIE_RENDER_OPTIONS } from "./AUTOMOVIE_RENDER_OPTIONS";
import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";

/**
 * Split the options of `automovie render` into the command's own, `AUTOMOVIE_RENDER_OPTIONS`, and the request's, which `parseAutoMovieCapturePlanRequest` reads for the request's `subject`.
 *
 * | Option | Meaning | Absent |
 * | --- | --- | --- |
 * | `--module <file>` | The subject module whose `subjects` the draw page offers | Required |
 * | `--props <file>` | A JSON file whose value the module's `subjects` is called with | `null` |
 * | `--out <folder>` | Where `film.mp4` and `render-report.json` go | `media/automovie/<subject>/videos` |
 * | `--backend <software\|gpu>` | How the browser draws | `software` |
 *
 * Every other option is left for the request reader, which names the subject as `capture` and the inspector do; a render draws the subject's whole clock through its own camera, so `renderAutoMovie` refuses any request key but `subject`. It throws for an empty value of its own options, a missing `--module`, and a backend that is not `software` or `gpu`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates the command's options with their meaning and absent value, says where the rest go and which of them a render admits, and states every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The command's keys are removed before the request is read, as `capture` and `inspect` do, so the subject has one name and one reader in every host.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the listed options that takes them out, then the checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No module is guessed from the folder.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the options.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per command.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and keeps nothing.
 */
export function readAutoMovieRenderOptions(values: ReadonlyMap<string, string>): {
  /** Subject module path, relative to the production or absolute. */
  module: string;

  /** Path of the props JSON file, or null for none. */
  props: string | null;

  /** The output folder, or null for the default. */
  out: string | null;

  /** How the browser draws. */
  backend: AutoMovieCaptureBackend;

  /** The request's own options, for the request reader. */
  request: Map<string, string>;
} {
  const request: Map<string, string> = new Map(values);
  const taken: Map<string, string> = new Map();
  for (const key of AUTOMOVIE_RENDER_OPTIONS) {
    const value: string | undefined = request.get(key);
    request.delete(key);
    if (value === undefined) continue;
    if (value.trim() === "") throw new Error(`Render option --${key} needs a value`);
    taken.set(key, value);
  }
  const module: string | undefined = taken.get("module");
  if (module === undefined) throw new Error("Render needs --module <subject module>, the module whose subjects the draw page offers");
  const backend: string = taken.get("backend") ?? "software";
  if (backend !== "software" && backend !== "gpu")
    throw new Error(`Render --backend "${backend}" is not software or gpu`);
  return { module, props: taken.get("props") ?? null, out: taken.get("out") ?? null, backend, request };
}
