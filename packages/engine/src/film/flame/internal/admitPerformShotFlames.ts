import type {
  IAutoMovieFlameCue,
  IAutoMoviePerformShotProps,
  IAutoMovieSceneNode,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { appendFlamesArtifact } from "../../../validation/internal/appendFlamesArtifact";

/**
 * Admit a shot's flame cues against the staged nodes, the registered models and
 * the shot's practical light bindings, and return detached copies.
 *
 * {@link appendFlamesArtifact} checks each cue with the models and bindings the
 * props hold: an id unique in the shot, a staged node whose model is
 * registered, an emitter that is a fixed affordance of that model, a
 * nonnegative safe-integer seed and a positive finite size. An open fire also
 * needs a positive Heskestad height and a diameter of at least 0.04 m. An `on`
 * interval is `0 <= start < end <= duration`. `light` names a binding of this
 * shot on the same node and emitter, burning over the same interval, which no
 * other cue names; `emission` is present exactly when `light` is absent, with a
 * positive finite luminance and a valid colour. Findings join `out` under
 * `$input.flames`; on any finding, including an earlier gate's, the result is
 * absent.
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
  appendFlamesArtifact(props.flames, nodes, duration, out, {
    models: props.models ?? [],
    bindings: props.practicalLights ?? [],
  });
  if (out.items.length > 0) return undefined;
  return props.flames.map(
    (cue: IAutoMovieFlameCue): IAutoMovieFlameCue => structuredClone(cue),
  );
}
