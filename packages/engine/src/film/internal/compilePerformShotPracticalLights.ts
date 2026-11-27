import type {
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieFlameCue,
  IAutoMovieLight,
  IAutoMovieModel,
  IAutoMoviePerformShotProps,
  IAutoMoviePointLight,
  IAutoMovieSceneNode,
  IAutoMovieSpotLight,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { appendLightMotionsArtifact } from "../../validation/internal/appendLightMotionsArtifact";
import { compilePracticalLightMotion } from "./compilePracticalLightMotion";
import { compileAutoMovieFlameFlicker } from "../flame/internal/compileAutoMovieFlameFlicker";

/*
 * Resolve practical bindings against the staged scene and models and bake them
 * after the shot's object clips are assembled. Generated clips are appended
 * after authored light clips in binding order. The ordinary light gate checks
 * the merged population, including collisions with authored channels, and
 * findings on generated clips carry their source binding path. A binding an
 * admitted flame cue names gets that flame's flicker on its intensity track,
 * keyed on the flame's grid within the binding's `on` interval.
 */
export function compilePerformShotPracticalLights(
  props: IAutoMoviePerformShotProps,
  objectMotions: readonly IAutoMovieClip[],
  lightMotions: IAutoMovieClip[] | undefined,
  out: IAutoMovieViolationCollector,
): IAutoMovieClip[] | undefined {
  if (props.practicalLights === undefined || props.practicalLights.length === 0)
    return lightMotions;

  const scene: typeof props.staged.scene = props.staged.scene;
  const lights: Map<string, IAutoMovieLight> = new Map(
    scene.lights.map((light: IAutoMovieLight): [string, IAutoMovieLight] => [
      light.id,
      light,
    ]),
  );
  const nodes: Map<string, IAutoMovieSceneNode> = new Map(
    scene.nodes.map(
      (node: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [
        node.id,
        node,
      ],
    ),
  );
  const models: Map<string, IAutoMovieModel> = new Map(
    (props.models ?? []).map(
      (model: IAutoMovieModel): [string, IAutoMovieModel] => [model.id, model],
    ),
  );
  const clips: IAutoMovieClip[] = [...(lightMotions ?? [])];
  const sources: Map<number, string> = new Map();

  for (const [index, binding] of props.practicalLights.entries()) {
    const path: string = `$input.practicalLights[${index}]`;
    const start: number = out.items.length;
    const candidate: IAutoMovieLight | undefined = lights.get(binding.light);
    const light: IAutoMoviePointLight | IAutoMovieSpotLight | undefined =
      candidate?.type === "point" || candidate?.type === "spot"
        ? candidate
        : undefined;
    if (light === undefined)
      out.push(
        "type",
        `${path}.light`,
        "must name a staged point or spot light",
        binding.light,
      );

    const prop: IAutoMovieSceneNode | undefined = nodes.get(binding.prop);
    const model: IAutoMovieModel | undefined =
      prop === undefined ? undefined : models.get(prop.model);
    const emitter: IAutoMovieAffordance | undefined = model?.affordances?.find(
      (item: IAutoMovieAffordance): boolean => item.id === binding.emitter,
    );
    if (prop === undefined)
      out.push("type", `${path}.prop`, "must name a staged prop", binding.prop);
    else if (model === undefined)
      out.push(
        "type",
        `${path}.prop`,
        "must name a prop with a registered model",
        prop.model,
      );
    else if (emitter === undefined || emitter.rides !== undefined)
      out.push(
        "type",
        `${path}.emitter`,
        "must name a fixed affordance of the prop model",
        binding.emitter,
      );

    if (
      out.items.length !== start ||
      light === undefined ||
      prop === undefined ||
      emitter === undefined
    )
      continue;

    // A flame cue naming this binding makes the light flicker with it; the
    // binding's `on` stays authoritative for when both burn.
    const flame: IAutoMovieFlameCue | undefined = props.flames?.find(
      (cue: IAutoMovieFlameCue): boolean => cue.light === binding.id,
    );
    try {
      const clip: IAutoMovieClip = compilePracticalLightMotion({
        id: binding.id,
        duration: props.performance.duration,
        light,
        prop,
        objectMotions,
        emitter,
        sampleTimes: binding.sampleTimes,
        on: binding.on,
        ...(flame === undefined
          ? {}
          : {
              flicker: compileAutoMovieFlameFlicker(
                { ...flame, on: binding.on },
                props.performance.duration,
              ),
            }),
      });
      sources.set(clips.length, path);
      clips.push(clip);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      out.push("type", path, error.message, binding);
    }
  }

  const findings: IAutoMovieConstraintViolation[] = [];
  appendLightMotionsArtifact(
    clips,
    "$input.lightMotions",
    new Map(
      scene.lights.map(
        (light: IAutoMovieLight): [string, IAutoMovieLight["type"]] => [
          light.id,
          light.type,
        ],
      ),
    ),
    findings,
  );
  for (const finding of findings) {
    const address: RegExpExecArray | null =
      /^\$input\.lightMotions\[(\d+)\]/.exec(finding.path);
    const source: string | undefined =
      address === null ? undefined : sources.get(Number(address[1]));
    out.items.push(
      source === undefined || address === null
        ? finding
        : { ...finding, path: source + finding.path.slice(address[0].length) },
    );
  }
  return clips;
}
