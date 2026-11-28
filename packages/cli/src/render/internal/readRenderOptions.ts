import { AUTOMOVIE_RENDER_OPTIONS } from "./AUTOMOVIE_RENDER_OPTIONS";
import type { AutoMovieCliRenderTypes } from "../AutoMovieCliRenderTypes";
import { readPageTimeout } from "../../page/internal/readPageTimeout";

/*
 * Split the options of `automovie render` into the command's own,
 * `AUTOMOVIE_RENDER_OPTIONS`, and the request's, which
 * `parseCapturePlanRequest` reads for the request's `subject`.
 *
 * | Option                              | Meaning                                                                                                             | Absent                             |
 * | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
 * | `--module <file>`                   | The subject module whose `subjects` the draw page offers                                                            | Required                           |
 * | `--props <file>`                    | A JSON file whose value the module's `subjects` is called with                                                      | `null`                             |
 * | `--out <folder>`                    | Where `film.mp4`, `render-report.json` and, with `--passes`, `controls/` go                                         | `media/automovie/<subject>/videos` |
 * | `--backend <software\|gpu>`         | How the browser draws                                                                                               | `software`                         |
 * | `--background <scene\|transparent>` | `transparent` renders a straight-alpha `film.mov` with no audio into `media/automovie/<subject>/transparent`        | `scene`                            |
 * | `--timeout-ms <milliseconds>`       | Per-call budget for page navigation, draw-function readiness, subject creation and drawing. Integer 1 to 2147483647 | `120000`                           |
 * | `--checkpoint-dir <directory>`      | Retained native draw data for interrupted or repeated rendering                                                       | No checkpoint                      |
 * | `--checkpoint-identity <sha256>`    | Exact source inputs and dependencies, including native assets. Used with `--checkpoint-dir`                           | No checkpoint                      |
 *
 * Every other option is left for the request reader, which names the subject as
 * `capture` and the inspector do; a render draws the subject's whole clock
 * through its own camera, so `renderProduction` refuses any request key but
 * `subject` and `passes`. It throws for an empty value of its own options, a
 * missing `--module`, a backend that is not `software` or `gpu`, and a
 * background that is not `scene` or `transparent`.
 */
export function readRenderOptions(
  values: ReadonlyMap<string, string>,
): AutoMovieCliRenderTypes.Options {
  const request: Map<string, string> = new Map(values);
  const taken: Map<string, string> = new Map();
  for (const key of AUTOMOVIE_RENDER_OPTIONS) {
    const value: string | undefined = request.get(key);
    request.delete(key);
    if (value === undefined) continue;
    if (value.trim() === "")
      throw new Error(`Render option --${key} needs a value`);
    taken.set(key, value);
  }
  const module: string | undefined = taken.get("module");
  if (module === undefined)
    throw new Error(
      "Render needs --module <subject module>, the module whose subjects the draw page offers",
    );
  const backend: string = taken.get("backend") ?? "software";
  if (backend !== "software" && backend !== "gpu")
    throw new Error(`Render --backend "${backend}" is not software or gpu`);
  const background: string = taken.get("background") ?? "scene";
  if (background !== "scene" && background !== "transparent")
    throw new Error(
      `Render --background "${background}" is not scene or transparent`,
    );
  const checkpointDir: string | undefined = taken.get("checkpoint-dir");
  const checkpointIdentity: string | undefined = taken.get("checkpoint-identity");
  if ((checkpointDir === undefined) !== (checkpointIdentity === undefined))
    throw new Error("Render needs --checkpoint-dir and --checkpoint-identity together");
  if (checkpointIdentity !== undefined && !/^[a-f0-9]{64}$/u.test(checkpointIdentity))
    throw new Error("Render --checkpoint-identity needs 64 lowercase SHA-256 digits");
  return {
    module,
    props: taken.get("props") ?? null,
    out: taken.get("out") ?? null,
    backend,
    timeout: readPageTimeout(taken.get("timeout-ms")),
    request,
    background,
    checkpoint: checkpointDir === undefined
      ? null
      : { directory: checkpointDir, identity: checkpointIdentity! },
  };
}
