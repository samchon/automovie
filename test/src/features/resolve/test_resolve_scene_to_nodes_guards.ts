import {
  composeScene,
  lowerSkeletonNodes,
  sceneToNodes,
} from "@automovie/engine";
import { AutoMovieAssetOrigin, IAutoMovieModelPart, IAutoMovieSkeleton, IAutoMovieBody, IAutoMovieAffordance, IAutoMovieMaterial, AutoMovieHumanoidBone, IAutoMovieProfile, IAutoMovieNode, IAutoMovieScene } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { namedFacts, qclose, throwsError, vclose } from "../internal/predicates";

const scene: (nodeId: string, modelRef: string) => IAutoMovieScene = (nodeId: string, modelRef: string): IAutoMovieScene => ({
  id: "scene-g",
  name: null,
  nodes: [
    {
      id: nodeId,
      model: modelRef,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
});

/**
 * `sceneToNodes` is a lossless bridge: with a model registry supplied every
 * placed ref must resolve; without one it lowers placements only. Duplicate
 * node ids are rejected downstream by `composeScene`'s index guard: the bridge
 * does not duplicate that gate, so the downstream contract is pinned here.
 *
 * Scenarios:
 *
 * 1. Registry omitted → placements-only lowering: no bone subtree, no throw.
 * 2. Registry supplied and the ref resolves → the subtree lowers (the positive
 *    twin of the throw).
 * 3. Registry supplied but the placed model is missing → throws naming the scene,
 *    model, and node.
 * 4. A crafted id collision (a placement literally named like a lowered bone node)
 *    passes the bridge and is rejected by `composeScene` downstream: the
 *    documented division of guard labor.
 * 5. `lowerSkeletonNodes` defaults: no prefix → the bare S1 names, no `rootParent`
 *    → the synthetic root is a graph root (the twin of the bridge paths, which
 *    always pass both).
 * 6. Mutating one returned synthetic root cannot change another lowered root or later default roots.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual sceneToNodes/lowerSkeletonNodes/composeScene; checks registry/namespace refusal and root defaults, then mutates returned root vectors to reject escaped shared private identity storage.
 * @evidence contracts/testing.md#independent-expectations Missing registries permit placement-only output, present registries must resolve every model, and duplicate concrete ids are ambiguous. A synthetic motion root starts at zero translation, identity quaternion and unit scale; mutating one owned result must not change independently created results.
 * @evidence contracts/testing.md#distinguishing-cases Covers omitted/present/missing registry, a lowered-node collision, bare root/prefix defaults and root mutation versus sibling/future calls. Placement/pose world parity belongs to test_resolve_scene_to_nodes rather than these admission/ownership cases.
 * @evidence contracts/testing.md#execution-ownership The exported test_resolve_scene_to_nodes_guards owns portable synchronous bridge/default cases through actual output; it creates no new Human asset or inspection host and replaces no foreign methods.
 */
export function test_resolve_scene_to_nodes_guards(): void {
  const model: { id: string; name: string | null; origin: AutoMovieAssetOrigin; parts: IAutoMovieModelPart[]; skeleton: IAutoMovieSkeleton | null; body: IAutoMovieBody | null; affordances?: IAutoMovieAffordance[] | null; materials: IAutoMovieMaterial[]; asset: string | null; imported?: { profile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"; lod: Array<{ level: "hero" | "near" | "far"; asset: string; digest: string; profile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1"; humanoidBones: Array<{ bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }>; }>; assets: Array<{ path: string; digest: string; }>; humanoidBones: Array<{ bone: AutoMovieHumanoidBone; node: number; weighted: boolean; }>; }; profiles?: IAutoMovieProfile[]; } = { ...createModel(), id: "hero" };

  const bare: IAutoMovieNode[] = sceneToNodes({ scene: scene("actor", "hero") });
  TestValidator.equals(
    "registry omitted lowers placements only",
    bare.length,
    1,
  );

  const lowered: IAutoMovieNode[] = sceneToNodes({
    scene: scene("actor", "hero"),
    models: { hero: model },
  });
  TestValidator.predicate(
    "resolving ref lowers the subtree",
    lowered.some((node: IAutoMovieNode) : boolean => node.id === "actor/hips"),
  );

  TestValidator.predicate(
    "missing model ref throws",
    throwsError(
      () : IAutoMovieNode[] =>
        sceneToNodes({
          scene: scene("actor", "ghost"),
          models: { hero: model },
        }),
      ["ghost", "actor", "scene-g"],
    ),
  );

  // A placement literally named like the actor's lowered hip bone node.
  const colliding: IAutoMovieScene = {
    ...scene("actor", "hero"),
    nodes: [
      ...scene("actor", "hero").nodes,
      ...scene("actor/hips", "hero").nodes,
    ],
  };
  const nodes: IAutoMovieNode[] = sceneToNodes({ scene: colliding, models: { hero: model } });
  TestValidator.predicate(
    "id collisions are rejected downstream by composeScene",
    throwsError(() : Map<string, number[]> => composeScene(nodes), ["duplicated"]),
  );

  const defaults: IAutoMovieNode[] = lowerSkeletonNodes({ skeleton: model.skeleton! });
  TestValidator.equals(
    "lowerSkeletonNodes defaults to bare names and a graph root",
    namedFacts([
      [
        "defaultsSomeNode",
        () : boolean =>
          defaults.some((node: IAutoMovieNode) : boolean => node.id === "root" && node.parent === null),
      ],
      ["defaultsSomeNode2", () : boolean => defaults.some((node: IAutoMovieNode) : boolean => node.id === "hips")],
    ]),
    { defaultsSomeNode: true, defaultsSomeNode2: true },
  );
  const independent: ReturnType<typeof lowerSkeletonNodes> = lowerSkeletonNodes({ skeleton: model.skeleton! });
  defaults[0]!.transform.translation.x = 9;
  defaults[0]!.transform.rotation.w = 0;
  defaults[0]!.transform.scale.y = 7;
  for (const loweredRoots of [independent, lowerSkeletonNodes({ skeleton: model.skeleton! })]) {
    TestValidator.predicate("root vectors belong to one lowering result", vclose(loweredRoots[0]!.transform.translation, { x: 0, y: 0, z: 0 }, 0) &&
      qclose(loweredRoots[0]!.transform.rotation, { x: 0, y: 0, z: 0, w: 1 }, 0) && vclose(loweredRoots[0]!.transform.scale, { x: 1, y: 1, z: 1 }, 0));
  }
}
