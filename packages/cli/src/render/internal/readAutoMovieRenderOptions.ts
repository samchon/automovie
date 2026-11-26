import { AUTOMOVIE_RENDER_OPTIONS } from "./AUTOMOVIE_RENDER_OPTIONS";
import type { AutoMovieCliRenderTypes } from "../AutoMovieCliRenderTypes";
import { readAutoMoviePageTimeout } from "../../readAutoMoviePageTimeout";

/**
 * Split the options of `automovie render` into the command's own,
 * `AUTOMOVIE_RENDER_OPTIONS`, and the request's, which
 * `parseAutoMovieCapturePlanRequest` reads for the request's `subject`.
 *
 * | Option                              | Meaning                                                                                                             | Absent                             |
 * | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
 * | `--module <file>`                   | The subject module whose `subjects` the draw page offers                                                            | Required                           |
 * | `--props <file>`                    | A JSON file whose value the module's `subjects` is called with                                                      | `null`                             |
 * | `--out <folder>`                    | Where `film.mp4`, `render-report.json` and, with `--passes`, `controls/` go                                         | `media/automovie/<subject>/videos` |
 * | `--backend <software\|gpu>`         | How the browser draws                                                                                               | `software`                         |
 * | `--background <scene\|transparent>` | `transparent` renders a straight-alpha `film.mov` with no audio into `media/automovie/<subject>/transparent`        | `scene`                            |
 * | `--timeout-ms <milliseconds>`       | Per-call budget for page navigation, draw-function readiness, subject creation and drawing. Integer 1 to 2147483647 | `120000`                           |
 *
 * Every other option is left for the request reader, which names the subject as
 * `capture` and the inspector do; a render draws the subject's whole clock
 * through its own camera, so `renderAutoMovie` refuses any request key but
 * `subject` and `passes`. It throws for an empty value of its own options, a
 * missing `--module`, a backend that is not `software` or `gpu`, and a
 * background that is not `scene` or `transparent`.
 */
export function readAutoMovieRenderOptions(
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
  return {
    module,
    props: taken.get("props") ?? null,
    out: taken.get("out") ?? null,
    backend,
    timeout: readAutoMoviePageTimeout(taken.get("timeout-ms")),
    request,
    background,
  };
}
