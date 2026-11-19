import type {
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieModel,
  IAutoMoviePerformShotProps,
  IAutoMoviePointLight,
  IAutoMovieSceneNode,
  IAutoMovieSpotLight,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { appendLightMotionsArtifact } from "../validation/appendLightMotionsArtifact";
import { compilePracticalLightMotion } from "./compilePracticalLightMotion";

/**
 * Resolve practical bindings against the staged scene and models and bake them
 * after the shot's object clips are assembled. Generated clips are appended
 * after authored light clips in binding order. The ordinary light gate checks
 * the merged population, including collisions with authored channels, and
 * findings on generated clips carry their source binding path.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Index staged and model names, resolve each fixed emitter, bake against the admitted object sequence, and run the canonical light artifact gate over authored and generated tracks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This stage owns reference resolution and source paths. Motion, switching and channel admission remain in the existing compiler and artifact gate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown scene or model references and moving emitter affordances produce findings. Invalid generated tracks and duplicate authored/generated channels are refused by the same gate as ordinary light tracks.
 * @evidence contracts/development/common.md#meaningful-documentation States the order of object and light assembly, the result's clip order and the diagnostic address.
 * @evidence contracts/development/implementation.md#efficient-algorithms No bindings is a pass-through. Otherwise index source populations once, search each named model's affordances, delegate the bake by binding and check the combined light clips once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared lookup tables serve every binding and all conflict checks share the canonical artifact pass.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only clip records and the caller's findings escape. Scene and model lookup tables are local and no renderer is acquired.
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
