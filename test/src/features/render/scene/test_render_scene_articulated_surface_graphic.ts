import { AutoMovieArchetypePaper } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieNode,
  IAutoMoviePropSpec,
  IAutoMovieScene,
  IAutoMovieSurfaceGraphic,
} from "@automovie/interface";
import {
  AutoMovieRenderSceneLayout,
  AutoMovieRenderSurfaceGraphic,
  type IAutoMovieRenderBuiltPropArticulation,
  type IAutoMovieRenderModelObject,
  type IAutoMovieRenderSurfaceGraphicsObject,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Group, Object3D, Scene, Vector3 } from "three";

import { vclose } from "../../internal/vclose";

/** Roundoff after a rotation and a model-to-world translation, metres. */
const POSITION: number = 1e-9;

/**
 * Printed map keys remain on the folding panel through a seek and shot change.
 *
 * A model built in its rest frame moves with a native prop articulation. Two
 * shots read different keys at the same second on the same posed model. Hiding
 * graphic roots leaves their selected keys intact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names moving panel alignment, reverse seek, shot-local key choice and pass visibility.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a real stock model and native prop joint, then reads the graphic group's world frame and key visibility.
 * @evidence contracts/development/testing.md#independent-expectations Uses the archetype's independent affordance pose to check the renderer's graphic frame in rest and turned poses. The two shot clocks start their second key at 0.5 and 0.75 seconds.
 */
export async function test_render_scene_articulated_surface_graphic(): Promise<void> {
  const map = AutoMovieArchetypePaper.create({ format: "foldedMap" });
  const fold: IAutoMovieAffordance = map.affordance("fold");
  const nodeId: string = "staged-map";
  const group: Group = new Group();
  group.position.set(1, 0.4, -2);
  const stage: Scene = new Scene();
  stage.add(group);
  const built: IAutoMovieRenderModelObject =
    AutoMovieRenderSceneLayout.buildModel(map);
  group.add(built.object);
  const joint: IAutoMovieNode = {
    id: fold.id,
    name: null,
    parent: null,
    kind: "group",
    transform: fold.frame,
    mesh: fold.parts![0]!,
    camera: null,
    light: null,
    skin: null,
  };
  const spec: IAutoMoviePropSpec = {
    node: map.id,
    model: map,
    articulation: {
      nodes: [joint],
      profile: { id: "map-fold", name: "Map fold", drivers: [], limits: [] },
      binding: { profile: "map-fold", boneMap: {} },
    },
  };
  const scene: IAutoMovieScene = {
    id: "table",
    name: null,
    lights: [],
    cameras: [],
    nodes: [
      {
        id: nodeId,
        model: map.id,
        transform: {
          translation: { x: 1, y: 0.4, z: -2 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        motion: null,
        pose: null,
      },
    ],
  };
  const articulation: IAutoMovieRenderBuiltPropArticulation =
    AutoMovieRenderSceneLayout.buildPropArticulation({
      scene,
      props: [spec],
      nodeObjects: new Map([[nodeId, group]]),
      modelObjects: new Map([[nodeId, built]]),
    });
  const mover: Object3D = articulation.joints.get(`${nodeId}/fold`)!;
  const graphic: IAutoMovieSurfaceGraphic = {
    emission: { kind: "printed" },
    background: { r: 0.9, g: 0.9, b: 0.8, a: null, hex: null },
    layers: [],
  };
  const prepare = (
    change: number,
  ): Promise<IAutoMovieRenderSurfaceGraphicsObject> =>
    AutoMovieRenderSurfaceGraphic.prepare({
      shot: {
        duration: 1,
        surfaceGraphics: [
          {
            node: nodeId,
            surface: "face",
            keys: [
              { time: 0, graphic },
              { time: change, graphic },
            ],
          },
        ],
      },
      scene,
      models: [map],
      resolveNode: () => built,
    });
  const name: string = `surface-graphic:${nodeId}/face`;
  const root = (): Object3D => group.getObjectByName(name)!;
  const visible = (): boolean[] =>
    root().children[0]!.children.map(
      (child: Object3D): boolean => child.visible,
    );
  const expected = (degrees: number): Vector3 => {
    const face: IAutoMovieAffordance = map
      .articulate({ fold: degrees })
      .affordance("face");
    const { x, y, z } = face.frame.translation;
    return new Vector3(x, y, z).add(group.position);
  };
  const first: IAutoMovieRenderSurfaceGraphicsObject = await prepare(0.5);
  try {
    TestValidator.predicate(
      "rest reading frame",
      vclose(root().getWorldPosition(new Vector3()), expected(0), POSITION),
    );
    TestValidator.predicate(
      "the built articulated part owns the graphic",
      root().parent === built.parts.get(fold.parts![0]!),
    );
    mover.rotateY(Math.PI / 2);
    stage.updateMatrixWorld(true);
    first.apply(0.6);
    const posed: Vector3 = root().getWorldPosition(new Vector3());
    const target: Vector3 = expected(90);
    TestValidator.predicate(
      `graphic follows the posed native fold: ${posed.toArray()} versus ${target.toArray()}`,
      vclose(posed, target, POSITION),
    );
    TestValidator.equals("first shot second key", visible(), [false, true]);
    const restore = AutoMovieRenderSurfaceGraphic.hide(stage);
    TestValidator.equals(
      "non-graphic pass hides the root",
      root().visible,
      false,
    );
    restore();
    TestValidator.equals("key choice survives the pass", visible(), [
      false,
      true,
    ]);
    articulation.restore();
    stage.updateMatrixWorld(true);
    first.apply(0.4);
    TestValidator.equals("earlier key on reverse seek", visible(), [
      true,
      false,
    ]);
    TestValidator.predicate(
      "rest pose on reverse seek",
      vclose(root().getWorldPosition(new Vector3()), expected(0), POSITION),
    );
  } finally {
    first.dispose();
  }

  mover.rotateY(Math.PI / 2);
  const second: IAutoMovieRenderSurfaceGraphicsObject = await prepare(0.75);
  try {
    stage.updateMatrixWorld(true);
    second.apply(0.6);
    TestValidator.equals("second shot uses its own clock", visible(), [
      true,
      false,
    ]);
    TestValidator.predicate(
      "attaching after pose preserves the model-rest reading frame",
      vclose(root().getWorldPosition(new Vector3()), expected(90), POSITION),
    );
  } finally {
    second.dispose();
  }
  TestValidator.equals(
    "shot cleanup releases its graphic root",
    group.getObjectByName(name),
    undefined,
  );
}
