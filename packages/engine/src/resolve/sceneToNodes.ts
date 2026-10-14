import {
  AutoMovieNodeKind,
  IAutoMovieModel,
  IAutoMovieNode,
  IAutoMoviePropArticulation,
  IAutoMoviePropSpec,
  IAutoMovieScene,
  IAutoMovieTransform,
} from "@automovie/interface";

import { lowerSkeletonNodes } from "./lowerSkeletonNodes";
import { placementNodePrefix } from "./placementNodePrefix";

/**
 * Lower scene rest placements, cameras/lights and registered skeleton/prop-articulation subtrees into general nodes. Supplied registries must resolve each required model and may not conflict; explicit partial-model callers retain placements while omitting unregistered subtrees. composeScene separately rejects duplicate ids, missing parents and cycles.
 *
 * @evidence contracts/common.md#principled-implementation Lower scene placements/cameras/lights and registered skeleton/articulation subtrees into rest nodes, requiring registry resolution unless explicit partial-model policy applies.
 * @evidence contracts/common.md#clear-and-simple-design Skeleton lowering/prefix helpers own shared representation and composeScene owns graph uniqueness/parent/cycle admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registry conflicts/missing required models throw; placements-only, rigid and partial modes are current caller policies, not fixture omissions.
 * @evidence contracts/common.md#meaningful-documentation Props identify registry keys, partial semantics and borrowed transforms; skeleton roots are fresh while scene/articulation nested data remains borrowed.
 * @evidence contracts/performance.md#efficient-algorithms P placements, C cameras, L lights and B/J lowered bones/joints require proportional node wrappers/id text, without geometry or population expansion.
 * @evidence contracts/performance.md#reuse-equivalent-work All lowering uses shared naming; mutable scene/model records prevent retaining a graph solely by scene id.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns node wrappers/array and source transforms remain borrowed; partial arrays release on failure without native graph handles or tasks.
 */
export const sceneToNodes: (props: {
  scene: IAutoMovieScene;
  models?: Record<string, IAutoMovieModel>;
  props?: Record<string, IAutoMoviePropSpec>;
  allowPartialModels?: boolean;
}) => IAutoMovieNode[] = (props: {
  /** The staged scene to lower. */
  scene: IAutoMovieScene;
  /** Placed models by model id; omit for a placements-only lowering. */
  models?: Record<string, IAutoMovieModel>;
  /**
   * Forged props by prop node id (= model id, the staging join `forgeProp`
   * gates). A placement resolving here lowers its articulation joints under the
   * placement group, the placement pass `IAutoMoviePropSpec` promises.
   */
  props?: Record<string, IAutoMoviePropSpec>;
  /**
   * Permit a partial registry, retaining placements but omitting unregistered
   * model subtrees. Only resolver callers that deliberately own a subset (such
   * as articulated-prop inspection) should use this escape hatch.
   */
  allowPartialModels?: boolean;
}): IAutoMovieNode[] => {
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
};

/**
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
