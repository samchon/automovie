import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMoviePracticalLightBinding,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { heskestadFlameHeight } from "../film/flame/heskestadFlameHeight";
import { isRecord } from "./isRecord";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateColor } from "./validateColor";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Smallest open-fire diameter, metres: `(1.5 / 7.5)²`, where the puffing
 * frequency `1.5 D^(−1/2)` reaches 7.5 Hz, the most the 1/120 s light key grid
 * resolves at 16 keys per period. Written as the literal 0.04 because the
 * floating-point square of 0.2 lies one unit in the last place above it.
 */
const MIN_OPEN_DIAMETER: number = 0.04;

/**
 * Check a shot's flame cues, appending findings under `$input.flames`.
 *
 * Structurally, every cue has a nonblank id unique in the shot, a staged node,
 * a nonblank emitter id, a nonnegative safe-integer seed and a positive finite
 * size; an open fire also needs a diameter of at least 0.04 m and a positive
 * Heskestad height. An `on` interval is `0 <= start < end <= duration`.
 * `emission`, a positive finite luminance with a valid colour, is present
 * exactly when `light` is absent, and no two cues name one `light`.
 *
 * `context` adds what only the caller holds. With `models`, the node's model
 * must be registered and the emitter must be a fixed affordance of it. With
 * `bindings`, the shot's practical light bindings, `light` must name one on the
 * cue's own node and emitter whose `on` equals the cue's. With `lights`, the
 * ids of the shot's light clips, `light` must name one, since a compiled shot
 * carries each binding as the clip of its id. Absent, those references are
 * checked for shape only.
 */
export function appendFlamesArtifact(
  flames: unknown,
  sceneNodes: readonly unknown[],
  duration: number,
  collector: IAutoMovieViolationCollector,
  context: {
    /** The registered models the cues' nodes stage. */
    models?: readonly IAutoMovieModel[];

    /** The shot's practical light bindings, at performance admission. */
    bindings?: readonly IAutoMoviePracticalLightBinding[];

    /** Ids of the compiled shot's light clips, at the artifact boundary. */
    lights?: ReadonlySet<string>;
  } = {},
): void {
  const root: string = "$input.flames";
  if (
    flames === undefined ||
    !validateArrayArtifact(flames, root, "flame cues", collector.items)
  )
    return;

  const staged: Map<string, string> = new Map();
  for (const node of sceneNodes)
    if (
      isRecord(node) &&
      typeof node.id === "string" &&
      typeof node.model === "string"
    )
      staged.set(node.id, node.model);
  const models: Map<string, IAutoMovieModel> | undefined =
    context.models === undefined
      ? undefined
      : new Map(
          context.models.map(
            (model: IAutoMovieModel): [string, IAutoMovieModel] => [
              model.id,
              model,
            ],
          ),
        );
  const bindings: Map<string, IAutoMoviePracticalLightBinding> | undefined =
    context.bindings === undefined
      ? undefined
      : new Map(
          context.bindings.map(
            (
              binding: IAutoMoviePracticalLightBinding,
            ): [string, IAutoMoviePracticalLightBinding] => [
              binding.id,
              binding,
            ],
          ),
        );
  const ids: Set<string> = new Set();
  const bound: Set<string> = new Set();

  for (const [index, cue] of flames.entries()) {
    const path: string = `${root}[${index}]`;
    if (!validateObjectArtifact(cue, path, "flame cue", collector.items))
      continue;

    if (typeof cue.id !== "string" || cue.id.trim().length === 0)
      collector.push("type", `${path}.id`, "flame id must be nonblank", cue.id);
    else if (ids.has(cue.id))
      collector.push(
        "type",
        `${path}.id`,
        "flame id must be unique in the shot",
        cue.id,
      );
    else ids.add(cue.id);

    appendPlace(cue, path, staged, models, collector);
    if (!Number.isSafeInteger(cue.seed) || (cue.seed as number) < 0)
      collector.push(
        "range",
        `${path}.seed`,
        "flame seed must be a nonnegative safe integer",
        cue.seed,
      );
    appendSize(cue.size, `${path}.size`, collector);

    const on: unknown = cue.on;
    if (
      on !== undefined &&
      !(
        Array.isArray(on) &&
        on.length === 2 &&
        typeof on[0] === "number" &&
        typeof on[1] === "number" &&
        0 <= on[0] &&
        on[0] < on[1] &&
        on[1] <= duration
      )
    )
      collector.push(
        "range",
        `${path}.on`,
        "flame interval must satisfy 0 <= start < end <= duration",
        on,
      );

    if (cue.light !== undefined) {
      appendLight(
        cue,
        path,
        { bindings, lights: context.lights, bound },
        collector,
      );
      if (cue.emission !== undefined)
        collector.push(
          "type",
          `${path}.emission`,
          "a flame bound to a light takes its emission from that light; omit emission",
          cue.emission,
        );
    } else if (cue.emission === undefined)
      collector.push(
        "type",
        `${path}.emission`,
        "a flame without a light needs an emission",
        cue.emission,
      );
    else if (!isRecord(cue.emission))
      collector.push(
        "type",
        `${path}.emission`,
        "flame emission must be a luminance and colour record",
        cue.emission,
      );
    else {
      collector.positive(
        `${path}.emission.luminance`,
        typeof cue.emission.luminance === "number"
          ? cue.emission.luminance
          : undefined,
        "flame luminance (cd/m²)",
      );
      validateColor(cue.emission.color, `${path}.emission.color`, collector);
    }
  }
}

/**
 * Check a cue's node and emitter: a staged node, and with the registry a
 * registered model carrying the emitter as a fixed affordance.
 */
function appendPlace(
  cue: Record<string, unknown>,
  path: string,
  staged: ReadonlyMap<string, string>,
  models: ReadonlyMap<string, IAutoMovieModel> | undefined,
  collector: IAutoMovieViolationCollector,
): void {
  if (typeof cue.node !== "string" || !staged.has(cue.node)) {
    collector.push(
      "type",
      `${path}.node`,
      "must name a staged prop node",
      cue.node,
    );
    return;
  }
  if (typeof cue.emitter !== "string" || cue.emitter.trim().length === 0) {
    collector.push(
      "type",
      `${path}.emitter`,
      "flame emitter must be a nonblank affordance id",
      cue.emitter,
    );
    return;
  }
  if (models === undefined) return;
  const model: IAutoMovieModel | undefined = models.get(staged.get(cue.node)!);
  const emitter: IAutoMovieAffordance | undefined = model?.affordances?.find(
    (entry: IAutoMovieAffordance): boolean => entry.id === cue.emitter,
  );
  if (model === undefined)
    collector.push(
      "type",
      `${path}.node`,
      "must name a prop with a registered model",
      cue.node,
    );
  else if (emitter === undefined || emitter.rides !== undefined)
    collector.push(
      "type",
      `${path}.emitter`,
      "must name a fixed affordance of the prop model",
      cue.emitter,
    );
}

/**
 * Check a bound cue's `light`: a nonblank id no other cue names, and with the
 * caller's context a binding on the cue's node and emitter burning over the
 * same interval, or a light clip of the compiled shot.
 */
function appendLight(
  cue: Record<string, unknown>,
  path: string,
  context: {
    bindings: ReadonlyMap<string, IAutoMoviePracticalLightBinding> | undefined;
    lights: ReadonlySet<string> | undefined;
    bound: Set<string>;
  },
  collector: IAutoMovieViolationCollector,
): void {
  const light: unknown = cue.light;
  if (typeof light !== "string" || light.trim().length === 0) {
    collector.push(
      "type",
      `${path}.light`,
      "flame light must be a nonblank binding id",
      light,
    );
    return;
  }
  const binding: IAutoMoviePracticalLightBinding | undefined =
    context.bindings?.get(light);
  if (context.bindings !== undefined && binding === undefined)
    collector.push(
      "type",
      `${path}.light`,
      "must name a practical light binding of the shot",
      light,
    );
  else if (
    binding !== undefined &&
    (binding.prop !== cue.node || binding.emitter !== cue.emitter)
  )
    collector.push(
      "type",
      `${path}.light`,
      "must name a binding on the flame's own node and emitter",
      light,
    );
  else if (
    binding !== undefined &&
    JSON.stringify(binding.on ?? null) !== JSON.stringify(cue.on ?? null)
  )
    collector.push(
      "type",
      `${path}.on`,
      "a flame and the light it motivates must burn over the same interval",
      cue.on,
    );
  else if (context.lights !== undefined && !context.lights.has(light))
    collector.push(
      "type",
      `${path}.light`,
      "must name a light clip of the shot",
      light,
    );
  else if (context.bound.has(light))
    collector.push(
      "type",
      `${path}.light`,
      "a binding may be named by one flame only",
      light,
    );
  else context.bound.add(light);
}

/**
 * Check one flame size: a known kind with positive finite dimensions, and for
 * an open fire a diameter of at least 0.04 m and a positive Heskestad height.
 */
function appendSize(
  size: unknown,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (!isRecord(size)) {
    collector.push("type", path, "flame size must be a record", size);
    return;
  }
  const length: (key: string) => number | undefined = (
    key: string,
  ): number | undefined =>
    typeof size[key] === "number" ? (size[key] as number) : undefined;
  if (size.kind === "small") {
    collector.positive(
      `${path}.height`,
      length("height"),
      "small flame height (m)",
    );
    collector.positive(
      `${path}.radius`,
      length("radius"),
      "small flame radius (m)",
    );
  } else if (size.kind === "ember")
    collector.positive(`${path}.radius`, length("radius"), "ember radius (m)");
  else if (size.kind === "open") {
    const heatRelease: number | undefined = length("heatRelease");
    const diameter: number | undefined = length("diameter");
    collector.positive(
      `${path}.heatRelease`,
      heatRelease,
      "open fire heat release (kW)",
    );
    collector.positive(`${path}.diameter`, diameter, "open fire diameter (m)");
    if (!(diameter! >= MIN_OPEN_DIAMETER))
      collector.push(
        "range",
        `${path}.diameter`,
        `open fire diameter must be at least ${MIN_OPEN_DIAMETER} m, where its puffing frequency reaches the 7.5 Hz the light key grid resolves`,
        diameter,
      );
    else if (
      heatRelease! > 0 &&
      Number.isFinite(heatRelease) &&
      !(heskestadFlameHeight(heatRelease!, diameter!) > 0)
    )
      collector.push(
        "range",
        `${path}.heatRelease`,
        "open fire Heskestad height 0.235 Q^0.4 - 1.02 D must be positive",
        heatRelease,
      );
  } else
    collector.push(
      "type",
      `${path}.kind`,
      'flame size kind must be "small", "open" or "ember"',
      size.kind,
    );
}
