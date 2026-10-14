import { sceneToNodes } from "../../../../packages/engine/src/resolve/sceneToNodes";
import { IAutoMovieScene, type IAutoMoviePropSpec, type IAutoMovieNode, type IAutoMovieProfile, type IAutoMovieProfileBinding, type IAutoMovieModel, type IAutoMoviePropPlacement } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
import { vclose } from "../internal/vclose";

const placedScene: () => IAutoMovieScene = (): IAutoMovieScene => ({
  id: "scene-p",
  name: null,
  nodes: [
    {
      id: "frontDoor",
      model: "door",
      transform: {
        translation: { x: 5, y: 0, z: 2 },
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
 * A placed prop's articulation lowers under its placement group exactly the way
 * a skeleton does: prefixed ids and parents, a `null` parent seating directly
 * under the placement (props declare their own root joint; no synthetic root is
 * added). This case checks parent references, hinge translation and node kind;
 * it does not compare every copied node field or count the articulated subtree.
 * A rigid prop lowers nothing extra.
 *
 * Scenarios:
 *
 * 1. The forged door's three joints lower as `frontDoor/root` (parent
 *    `frontDoor`), `frontDoor/hinge` and `frontDoor/handleMirror` (parents
 *    `frontDoor/root`).
 * 2. Transforms carry verbatim (the hinge keeps its authored `(0, 1, 0)` local
 *    translation), and the node kind carries too.
 * 3. A rigid prop (`articulation: null`) lowers only its placement group: the
 *    negative twin of the subtree.
 *
 * @evidence contracts/testing.md#behavioral-verification Lowers an existing articulated door prop and rigid neighbor through sceneToNodes, observing prefixed ids, parent references, hinge rest translation/kind and the rigid singleton count; articulated subtree cardinality is not asserted.
 * @evidence contracts/testing.md#independent-expectations Literal articulation nodes are rooted beneath their placement and other parent ids take the same prefix; a rigid prop contributes only its placement. Expected ids/counts and offsets are authored fixture facts.
 * @evidence contracts/testing.md#distinguishing-cases Articulated and rigid props contrast subtree production with no subtree, and root/child nodes distinguish direct placement parenting from prefixed internal parenting; profile animation and registry refusals have separate owners.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_scene_prop_lowering entry directly executes portable synchronous lowering of the canonical existing door fixture, without creating a new Human asset or rendering its geometry.
 */
export function test_resolve_scene_prop_lowering(): void {
  const base: IAutoMoviePropSpec = createDoorPropSpec();
  // Give the hinge a distinctive local translation so "verbatim" is provable
  // (the fixture's joints are all identity, which any zeroing bug would mimic).
  const spec: { articulation: { nodes: IAutoMovieNode[]; profile: IAutoMovieProfile; binding: IAutoMovieProfileBinding; }; node: string; model: IAutoMovieModel; placement?: IAutoMoviePropPlacement; modelRef?: string | null; } = {
    ...base,
    articulation: {
      ...base.articulation!,
      nodes: base.articulation!.nodes.map((node: IAutoMovieNode): IAutoMovieNode  =>
        node.id === "hinge"
          ? {
              ...node,
              transform: {
                ...node.transform,
                translation: { x: 0, y: 1, z: 0 },
              },
            }
          : node,
      ),
    },
  };
  const nodes: IAutoMovieNode[] = sceneToNodes({
    scene: placedScene(),
    props: { door: spec },
  });

  const byId: Map<string, IAutoMovieNode> = new Map(nodes.map((node: IAutoMovieNode): [string, IAutoMovieNode]  => [node.id, node]));
  TestValidator.equals(
    "prop root seats under the placement group",
    byId.get("frontDoor/root")?.parent,
    "frontDoor",
  );
  TestValidator.equals(
    "hinge parent takes the prefix",
    byId.get("frontDoor/hinge")?.parent,
    "frontDoor/root",
  );
  TestValidator.equals(
    "mirror parent takes the prefix",
    byId.get("frontDoor/handleMirror")?.parent,
    "frontDoor/root",
  );

  TestValidator.predicate(
    "the hinge transform carries verbatim",
    vclose(byId.get("frontDoor/hinge")!.transform.translation, {
      x: 0,
      y: 1,
      z: 0,
    }),
  );
  TestValidator.equals(
    "the node kind carries verbatim",
    byId.get("frontDoor/hinge")?.kind,
    "group",
  );

  const rigid: IAutoMovieNode[] = sceneToNodes({
    scene: placedScene(),
    props: { door: { ...spec, articulation: null } },
  });
  TestValidator.equals(
    "a rigid prop lowers only its placement group",
    rigid.length,
    1,
  );
}
