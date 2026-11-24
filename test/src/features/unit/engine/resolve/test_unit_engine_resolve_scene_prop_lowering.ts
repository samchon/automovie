import { sceneToNodes } from "@automovie/engine";
import {
  type IAutoMovieModel,
  type IAutoMovieNode,
  type IAutoMovieProfile,
  type IAutoMovieProfileBinding,
  type IAutoMoviePropPlacement,
  type IAutoMoviePropSpec,
  IAutoMovieScene,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createDoorPropSpec } from "../../../internal/createDoorPropSpec";
import { vclose } from "../../../internal/vclose";

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
 * Lower articulated prop nodes beneath their placement with prefixed ids and parents, checking parent references, hinge translation and node kind. A rigid prop contributes only its placement; articulated cardinality and every copied field are not checked here.
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
 */
export function test_unit_engine_resolve_scene_prop_lowering(): void {
  const base: IAutoMoviePropSpec = createDoorPropSpec();
  // Give the hinge a distinctive local translation so "verbatim" is provable
  // (the fixture's joints are all identity, which any zeroing bug would mimic).
  const spec: {
    articulation: {
      nodes: IAutoMovieNode[];
      profile: IAutoMovieProfile;
      binding: IAutoMovieProfileBinding;
    };
    node: string;
    model: IAutoMovieModel;
    placement?: IAutoMoviePropPlacement;
    modelRef?: string | null;
  } = {
    ...base,
    articulation: {
      ...base.articulation!,
      nodes: base.articulation!.nodes.map(
        (node: IAutoMovieNode): IAutoMovieNode =>
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

  const byId: Map<string, IAutoMovieNode> = new Map(
    nodes.map((node: IAutoMovieNode): [string, IAutoMovieNode] => [
      node.id,
      node,
    ]),
  );
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
