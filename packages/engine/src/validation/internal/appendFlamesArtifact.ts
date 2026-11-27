import type {
  IAutoMovieAffordance,
  IAutoMovieFlameCue,
  IAutoMovieModel,
  IAutoMoviePracticalLightBinding,
  IAutoMovieSceneNode,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { heskestadFlameHeight } from "../../film/flame/internal/heskestadFlameHeight";
import { validateColor } from "./validateColor";

/**
 * Check a shot's flame cues, appending findings under `$input.flames`.
 *
 * Every cue has an id unique in the shot, a staged node, a nonnegative
 * safe-integer seed and a positive finite size; an open fire also needs a
 * diameter of at least 0.04 m and a positive Heskestad height. An `on` interval
 * is `0 <= start < end <= duration`. `emission`, a positive finite luminance
 * with a valid colour, is present exactly when `light` is absent, and no two
 * cues name one `light`.
 *
 * `context` adds what only the caller holds. With `models`, the node's model
 * must be registered and the emitter must be a fixed affordance of it. With
 * `bindings`, the shot's practical light bindings, `light` must name one on the
 * cue's own node and emitter whose `on` equals the cue's. With `lights`, the
 * ids of the shot's light clips, `light` must name one, since a compiled shot
 * carries each binding as the clip of its id. Absent, those references are not
 * resolved.
 */
export function appendFlamesArtifact(
  flames: readonly IAutoMovieFlameCue[] | undefined,
  sceneNodes: readonly Pick<IAutoMovieSceneNode, "id" | "model">[],
  duration: number,
  collector: IAutoMovieViolationCollector,
  context: {
    /** The registered models the cues' nodes stage. */
    models?: readonly FlameEmitterModel[];

    /** The shot's practical light bindings, at performance admission. */
    bindings?: readonly IAutoMoviePracticalLightBinding[];

    /** Ids of the compiled shot's light clips, at the artifact boundary. */
    lights?: ReadonlySet<string>;
  } = {},
): void {
  const root: string = "$input.flames";
  if (flames === undefined) return;

  const staged: Map<string, string> = new Map(
    sceneNodes.map(
      (node: Pick<IAutoMovieSceneNode, "id" | "model">): [string, string] => [
        node.id,
        node.model,
      ],
    ),
  );
  const models: Map<string, FlameEmitterModel> | undefined =
    context.models === undefined
      ? undefined
      : new Map(
          context.models.map(
            (model: FlameEmitterModel): [string, FlameEmitterModel] => [
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

  flames.forEach((cue: IAutoMovieFlameCue, index: number): void => {
    const path: string = `${root}[${index}]`;
    if (ids.has(cue.id))
      collector.push(
        "type",
        `${path}.id`,
        "flame id must be unique in the shot",
        cue.id,
      );
    else ids.add(cue.id);

    appendPlace(cue, path, staged, models, collector);
    if (cue.seed < 0)
      collector.push(
        "range",
        `${path}.seed`,
        "flame seed must be a nonnegative safe integer",
        cue.seed,
      );
    appendSize(cue.size, `${path}.size`, collector);

    const on: IAutoMovieFlameCue["on"] = cue.on;
    if (on !== undefined && !(0 <= on[0] && on[0] < on[1] && on[1] <= duration))
      collector.push(
        "range",
        `${path}.on`,
        "flame interval must satisfy 0 <= start < end <= duration",
        on,
      );

    if (cue.light !== undefined) {
      appendLight(
        cue,
        cue.light,
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
    else {
      collector.positive(
        `${path}.emission.luminance`,
        cue.emission.luminance,
        "flame luminance (cd/m²)",
      );
      validateColor(cue.emission.color, `${path}.emission.color`, collector);
    }
  });
}

/** A flame uses its registered model only to find the declared emitter. */
type FlameEmitterModel = Pick<IAutoMovieModel, "id" | "affordances">;

/**
 * Smallest open-fire diameter, metres: `(1.5 / 7.5)²`, where the puffing
 * frequency `1.5 D^(−1/2)` reaches 7.5 Hz, the most the 1/120 s light key grid
 * resolves at 16 keys per period. Written as the literal 0.04 because the
 * floating-point square of 0.2 lies one unit in the last place above it.
 */
const MIN_OPEN_DIAMETER: number = 0.04;

/**
 * Check a cue's node and emitter: a staged node, and with the registry a
 * registered model carrying the emitter as a fixed affordance.
 */
function appendPlace(
  cue: IAutoMovieFlameCue,
  path: string,
  staged: ReadonlyMap<string, string>,
  models: ReadonlyMap<string, FlameEmitterModel> | undefined,
  collector: IAutoMovieViolationCollector,
): void {
  const modelId: string | undefined = staged.get(cue.node);
  if (modelId === undefined) {
    collector.push(
      "type",
      `${path}.node`,
      "must name a staged prop node",
      cue.node,
    );
    return;
  }
  if (models === undefined) return;
  const model: FlameEmitterModel | undefined = models.get(modelId);
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
 * Check a bound cue's `light`: an id no other cue names, and with the caller's
 * context a binding on the cue's node and emitter burning over the same
 * interval, or a light clip of the compiled shot.
 */
function appendLight(
  cue: IAutoMovieFlameCue,
  light: string,
  path: string,
  context: {
    bindings: ReadonlyMap<string, IAutoMoviePracticalLightBinding> | undefined;
    lights: ReadonlySet<string> | undefined;
    bound: Set<string>;
  },
  collector: IAutoMovieViolationCollector,
): void {
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
 * Check one flame size: positive finite dimensions, and for an open fire a
 * diameter of at least 0.04 m and a positive Heskestad height.
 */
function appendSize(
  size: IAutoMovieFlameCue["size"],
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (size.kind === "small") {
    collector.positive(`${path}.height`, size.height, "small flame height (m)");
    collector.positive(`${path}.radius`, size.radius, "small flame radius (m)");
  } else if (size.kind === "ember")
    collector.positive(`${path}.radius`, size.radius, "ember radius (m)");
  else {
    const heatRelease: number = size.heatRelease;
    const diameter: number = size.diameter;
    collector.positive(
      `${path}.heatRelease`,
      heatRelease,
      "open fire heat release (kW)",
    );
    collector.positive(`${path}.diameter`, diameter, "open fire diameter (m)");
    if (!(diameter >= MIN_OPEN_DIAMETER))
      collector.push(
        "range",
        `${path}.diameter`,
        `open fire diameter must be at least ${MIN_OPEN_DIAMETER} m, where its puffing frequency reaches the 7.5 Hz the light key grid resolves`,
        diameter,
      );
    else if (
      heatRelease > 0 &&
      !(heskestadFlameHeight(heatRelease, diameter) > 0)
    )
      collector.push(
        "range",
        `${path}.heatRelease`,
        "open fire Heskestad height 0.235 Q^0.4 - 1.02 D must be positive",
        heatRelease,
      );
  }
}
