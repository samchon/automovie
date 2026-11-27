import {
  AutoMovieNodeKind,
  IAutoMovieModel,
  IAutoMovieNode,
  IAutoMoviePropArticulation,
  IAutoMoviePropSpec,
  IAutoMovieScene,
  type IAutoMovieSceneToNodes,
  IAutoMovieTransform,
} from "@automovie/interface";

import { lowerSkeletonNodes } from "./lowerSkeletonNodes";
import { placementNodePrefix } from "./placementNodePrefix";

/*
 * Lower scene rest placements, cameras/lights and registered
 * skeleton/prop-articulation subtrees into general nodes. Supplied registries
 * must resolve each required model and may not conflict; explicit partial-model
 * callers retain placements while omitting unregistered subtrees. composeScene
 * separately rejects duplicate ids, missing parents and cycles.
 */
export function sceneToNodes(
  props: IAutoMovieSceneToNodes.IProps,
): IAutoMovieNode[] {
  const {
    scene,
    models,
    props: propSpecs,
    allowPartialModels = false,
  }: {
    scene: IAutoMovieScene;
    models?: Record<string, IAutoMovieModel>;
    props?: Record<string, IAutoMoviePropSpec>;
    allowPartialModels?: boolean;
  } = props;
  const nodes: IAutoMovieNode[] = [];

  for (const placement of scene.nodes) {
    nodes.push({
      id: placement.id,
      name: null,
      parent: null,
      kind: "group",
      transform: placement.transform,
      mesh: null,
      camera: null,
      light: null,
      skin: null,
    });
    if (models === undefined && propSpecs === undefined) continue;
    const spec: IAutoMoviePropSpec | undefined = propSpecs?.[placement.model];
    const model: IAutoMovieModel | undefined = models?.[placement.model];
    if (spec !== undefined && model !== undefined)
      throw new Error(
        `sceneToNodes scene "${scene.id}" resolves model "${placement.model}" at node "${placement.id}" in BOTH the props and models registries: the registries contradict (a forged prop carries its own model)`,
      );
    if (spec !== undefined) {
      if (spec.articulation !== null)
        nodes.push(
          ...lowerArticulationNodes(
            spec.articulation,
            placementNodePrefix(placement.id),
            placement.id,
          ),
        );
      continue;
    }
    if (model === undefined && allowPartialModels) continue;
    if (model === undefined)
      throw new Error(
        `sceneToNodes scene "${scene.id}" places model "${placement.model}" at node "${placement.id}" but the registry has no such model`,
      );
    if (model.skeleton === null) continue;
    nodes.push(
      ...lowerSkeletonNodes({
        skeleton: model.skeleton,
        prefix: placementNodePrefix(placement.id),
        rootParent: placement.id,
      }),
    );
  }

  for (const camera of scene.cameras)
    nodes.push({
      id: camera.id,
      name: null,
      parent: null,
      kind: "camera",
      transform: camera.transform,
      mesh: null,
      camera: camera.id,
      light: null,
      skin: null,
    });

  for (const light of scene.lights)
    nodes.push({
      id: light.id,
      name: null,
      parent: null,
      kind: "light",
      transform: light.transform,
      mesh: null,
      camera: null,
      light: light.id,
      skin: null,
    });

  return nodes;
}

/*
 * Lower a prop's articulation joints under its placement: ids and parent refs
 * take the placement prefix, a `null` parent seats directly under the placement
 * group (props declare their own root joint: no synthetic root is added, unlike
 * the skeleton lowering), and every other node field (kind, transform, payload
 * refs) carries verbatim (`forgeProp` already gated well-formedness).
 */
const lowerArticulationNodes: (
  articulation: IAutoMoviePropArticulation,
  prefix: string,
  rootParent: string,
) => IAutoMovieNode[] = (
  articulation: IAutoMoviePropArticulation,
  prefix: string,
  rootParent: string,
): IAutoMovieNode[] =>
  articulation.nodes.map(
    (
      node: IAutoMovieNode,
    ): {
      id: string;
      parent: string;
      name: string | null;
      kind: AutoMovieNodeKind;
      transform: IAutoMovieTransform;
      mesh: string | null;
      camera: string | null;
      light: string | null;
      skin: string | null;
    } => ({
      ...node,
      id: `${prefix}${node.id}`,
      parent: node.parent === null ? rootParent : `${prefix}${node.parent}`,
    }),
  );
