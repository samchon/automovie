import type {
  IAutoMovieAffordance,
  IAutoMovieFlameCue,
  IAutoMovieModel,
  IAutoMoviePerformShotProps,
  IAutoMoviePracticalLightBinding,
  IAutoMovieSceneNode,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateColor } from "../../validation/validateColor";
import { heskestadFlameHeight } from "./heskestadFlameHeight";

/**
 * Smallest open-fire diameter, metres: `(1.5 / 7.5)²`, where the puffing
 * frequency `1.5 D^(−1/2)` reaches 7.5 Hz, the most the 1/120 s light key grid
 * resolves at 16 keys per period. Written as the literal 0.04 because the
 * floating-point square of 0.2 lies one unit in the last place above it.
 */
const MIN_OPEN_DIAMETER: number = 0.04;

/**
 * Admit a shot's flame cues against the staged nodes, the registered models and
 * the shot's practical light bindings, and return detached copies.
 *
 * Each cue needs a nonblank id unique in the shot, a staged node whose model is
 * registered, an emitter that is a fixed affordance of that model, a
 * nonnegative safe-integer seed and a positive finite size. An open fire also
 * needs a positive Heskestad height and a diameter of at least 0.04 m. An `on`
 * interval is `0 <= start < end <= duration`. `light` names a binding of this
 * shot on the same node and emitter, which no other cue names; `emission` is
 * present exactly when `light` is absent, with a positive finite luminance and
 * a valid colour. Findings join `out` under `$input.flames`; on any finding,
 * including an earlier gate's, the result is absent.
 */
export function admitPerformShotFlames(
  props: Pick<
    IAutoMoviePerformShotProps,
    "flames" | "models" | "practicalLights"
  >,
  nodes: readonly IAutoMovieSceneNode[],
  duration: number,
  out: IAutoMovieViolationCollector,
): IAutoMovieFlameCue[] | undefined {
  if (props.flames === undefined) return undefined;
  const staged: Map<string, string> = new Map(
    nodes.map((node: IAutoMovieSceneNode): [string, string] => [
      node.id,
      node.model,
    ]),
  );
  const models: Map<string, IAutoMovieModel> = new Map(
    (props.models ?? []).map(
      (model: IAutoMovieModel): [string, IAutoMovieModel] => [model.id, model],
    ),
  );
  const bindings: Map<string, IAutoMoviePracticalLightBinding> = new Map(
    (props.practicalLights ?? []).map(
      (
        binding: IAutoMoviePracticalLightBinding,
      ): [string, IAutoMoviePracticalLightBinding] => [binding.id, binding],
    ),
  );
  const ids: Set<string> = new Set();
  const bound: Set<string> = new Set();

  for (const [index, cue] of props.flames.entries()) {
    const path: string = `$input.flames[${index}]`;
    if (typeof cue.id !== "string" || cue.id.trim().length === 0)
      out.push("type", `${path}.id`, "flame id must be nonblank", cue.id);
    else if (ids.has(cue.id))
      out.push(
        "type",
        `${path}.id`,
        "flame id must be unique in the shot",
        cue.id,
      );
    else ids.add(cue.id);

    const model: IAutoMovieModel | undefined = models.get(
      staged.get(cue.node) ?? "",
    );
    const emitter: IAutoMovieAffordance | undefined = model?.affordances?.find(
      (entry: IAutoMovieAffordance): boolean => entry.id === cue.emitter,
    );
    if (!staged.has(cue.node))
      out.push(
        "type",
        `${path}.node`,
        "must name a staged prop node",
        cue.node,
      );
    else if (model === undefined)
      out.push(
        "type",
        `${path}.node`,
        "must name a prop with a registered model",
        cue.node,
      );
    else if (emitter === undefined || emitter.rides !== undefined)
      out.push(
        "type",
        `${path}.emitter`,
        "must name a fixed affordance of the prop model",
        cue.emitter,
      );

    if (!Number.isSafeInteger(cue.seed) || cue.seed < 0)
      out.push(
        "range",
        `${path}.seed`,
        "flame seed must be a nonnegative safe integer",
        cue.seed,
      );
    appendSize(cue.size, `${path}.size`, out);

    if (
      cue.on !== undefined &&
      !(0 <= cue.on[0] && cue.on[0] < cue.on[1] && cue.on[1] <= duration)
    )
      out.push(
        "range",
        `${path}.on`,
        "flame interval must satisfy 0 <= start < end <= duration",
        cue.on,
      );

    if (cue.light !== undefined) {
      const binding: IAutoMoviePracticalLightBinding | undefined = bindings.get(
        cue.light,
      );
      if (binding === undefined)
        out.push(
          "type",
          `${path}.light`,
          "must name a practical light binding of the shot",
          cue.light,
        );
      else if (binding.prop !== cue.node || binding.emitter !== cue.emitter)
        out.push(
          "type",
          `${path}.light`,
          "must name a binding on the flame's own node and emitter",
          cue.light,
        );
      else if (
        JSON.stringify(binding.on ?? null) !== JSON.stringify(cue.on ?? null)
      )
        out.push(
          "type",
          `${path}.on`,
          "a flame and the light it motivates must burn over the same interval",
          cue.on,
        );
      else if (bound.has(cue.light))
        out.push(
          "type",
          `${path}.light`,
          "a binding may be named by one flame only",
          cue.light,
        );
      else bound.add(cue.light);
      if (cue.emission !== undefined)
        out.push(
          "type",
          `${path}.emission`,
          "a flame bound to a light takes its emission from that light; omit emission",
          cue.emission,
        );
    } else if (cue.emission === undefined)
      out.push(
        "type",
        `${path}.emission`,
        "a flame without a light needs an emission",
        cue.emission,
      );
    else {
      out.positive(
        `${path}.emission.luminance`,
        cue.emission.luminance,
        "flame luminance (cd/m²)",
      );
      validateColor(cue.emission.color, `${path}.emission.color`, out);
    }
  }
  if (out.items.length > 0) return undefined;
  return props.flames.map(
    (cue: IAutoMovieFlameCue): IAutoMovieFlameCue => structuredClone(cue),
  );
}

/**
 * Check one flame size: positive finite dimensions, and for an open fire a
 * diameter of at least 0.04 m and a positive Heskestad height.
 */
function appendSize(
  size: IAutoMovieFlameCue["size"],
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  if (size.kind === "small") {
    out.positive(`${path}.height`, size.height, "small flame height (m)");
    out.positive(`${path}.radius`, size.radius, "small flame radius (m)");
  } else if (size.kind === "ember")
    out.positive(`${path}.radius`, size.radius, "ember radius (m)");
  else if (size.kind === "open") {
    out.positive(
      `${path}.heatRelease`,
      size.heatRelease,
      "open fire heat release (kW)",
    );
    out.positive(`${path}.diameter`, size.diameter, "open fire diameter (m)");
    if (!(size.diameter >= MIN_OPEN_DIAMETER))
      out.push(
        "range",
        `${path}.diameter`,
        `open fire diameter must be at least ${MIN_OPEN_DIAMETER} m, where its puffing frequency reaches the 7.5 Hz the light key grid resolves`,
        size.diameter,
      );
    else if (!(heskestadFlameHeight(size.heatRelease, size.diameter) > 0))
      out.push(
        "range",
        `${path}.heatRelease`,
        "open fire Heskestad height 0.235 Q^0.4 - 1.02 D must be positive",
        size.heatRelease,
      );
  } else
    out.push(
      "type",
      `${path}.kind`,
      'flame size kind must be "small", "open" or "ember"',
      size,
    );
}
