import type {
  IAutoMovieModel,
  IAutoMovieNode,
  IAutoMoviePropSpec,
  IAutoMovieTransform,
} from "@automovie/interface";
import { type IAutoMovieRenderBuiltPropArticulation, type IAutoMovieRenderModelObject, type IAutoMovieRenderBuildPropArticulationProps, AutoMovieRenderSceneLayout } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Group, Object3D, Vector3 } from "three";

import { boxModel } from "../../internal/boxModel";
import { throwsError, vclose } from "../../internal/predicates";

/** The test's half-turn matrix is diagonal and its offsets are exact integers. */
const PLACEMENT_TOLERANCE: number = 0;

/**
 * A trailing parent declaration still carries its child, and the prop's
 * authored part keeps its staged placement when attached to that joint.
 *
 * Scenarios:
 *
 * 1. Lower the child before its parent in the input and resolve both on the
 *    placement's public clip paths. Preserve the part's model-local offset.
 * 2. A turn of the mounted joint moves its part from the preserved position.
 *    Restoring after a frame restores the parent and child transforms.
 * 3. A built model missing the claimed native part refuses by part id.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reversed parent declaration order, preserved bind frame, joint rotation, reset and missing part result.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the articulation through the public SceneLayout method, inspects its actual attached graph, changes the parent quaternion and calls restore. A model with an empty parts map exercises the owner's refusal.
 * @evidence contracts/development/testing.md#independent-expectations The authored model offset and staged translation give world origin (12, 3, 2). Replacing the initial half turn with identity rotates the part around the staged joint to (10, 3, -6). The independently specified local hinge translation and unit scale must return on restore.
 */
export function test_render_scene_build_prop_articulation(): void {
  const identity: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const mount: IAutoMovieNode = {
    id: "mount",
    name: null,
    parent: null,
    kind: "group",
    transform: {
      ...identity,
      translation: { x: 1, y: 0, z: 0 },
      rotation: { x: 0, y: 1, z: 0, w: 0 },
    },
    mesh: null,
    camera: null,
    light: null,
    skin: null,
  };
  const model: IAutoMovieModel = boxModel({ id: "panel" });
  const partId: string = model.parts[0]!.id;
  model.parts[0]!.transform = {
    ...identity,
    translation: { x: 2, y: 3, z: 4 },
  };
  const hinge: IAutoMovieNode = {
    ...mount,
    id: "hinge",
    parent: mount.id,
    transform: { ...identity, translation: { x: 0, y: 1, z: 0 } },
    mesh: partId,
  };
  const spec: IAutoMoviePropSpec = {
    node: model.id,
    model,
    articulation: {
      nodes: [hinge, mount],
      profile: { id: "pivot", name: "Pivot", drivers: [], limits: [] },
      binding: { profile: "pivot", boneMap: {} },
    },
  };
  const staged: Group = new Group();
  staged.position.set(10, 0, -2);
  const modelRoot: Group = new Group();
  const part: Object3D = new Object3D();
  part.position.set(2, 3, 4);
  modelRoot.add(part);
  staged.add(modelRoot);
  const built: IAutoMovieRenderModelObject = {
    object: modelRoot,
    bones: new Map(),
    parts: new Map([[partId, part]]),
  };
  const input: IAutoMovieRenderBuildPropArticulationProps = {
    scene: {
      id: "set",
      name: null,
      lights: [],
      cameras: [],
      nodes: [
        {
          id: "door",
          model: model.id,
          transform: {
            ...identity,
            translation: { x: 10, y: 0, z: -2 },
          },
          motion: null,
          pose: null,
        },
      ],
    },
    props: [spec],
    nodeObjects: new Map([["door", staged]]),
    modelObjects: new Map([["door", built]]),
  };
  const articulation: IAutoMovieRenderBuiltPropArticulation =
    AutoMovieRenderSceneLayout.buildPropArticulation(input);
  const attached: Object3D = articulation.joints.get("door/hinge")!;
  const parent: Object3D = articulation.joints.get("door/mount")!;
  TestValidator.predicate(
    "child and part follow declared parentage",
    () =>
      parent.parent === staged &&
      attached.parent === parent &&
      part.parent === attached,
  );
  TestValidator.predicate(
    "binding keeps the part at its model-authored position",
    () =>
      vclose(
        part.getWorldPosition(new Vector3()),
        { x: 12, y: 3, z: 2 },
        PLACEMENT_TOLERANCE,
      ),
  );

  parent.quaternion.identity();
  TestValidator.predicate("part turns about the joint", () =>
    vclose(
      part.getWorldPosition(new Vector3()),
      { x: 10, y: 3, z: -6 },
      PLACEMENT_TOLERANCE,
    ),
  );
  attached.position.x = 7;
  attached.scale.set(2, 3, 4);
  articulation.restore();
  TestValidator.predicate(
    "restoration replays the authored frame before another sample",
    () =>
      vclose(attached.position, { x: 0, y: 1, z: 0 }, PLACEMENT_TOLERANCE) &&
      vclose(attached.scale, { x: 1, y: 1, z: 1 }, PLACEMENT_TOLERANCE) &&
      vclose(
        part.getWorldPosition(new Vector3()),
        { x: 12, y: 3, z: 2 },
        PLACEMENT_TOLERANCE,
      ),
  );

  TestValidator.predicate(
    "missing addressed part refuses",
    throwsError(
      (): IAutoMovieRenderBuiltPropArticulation =>
        AutoMovieRenderSceneLayout.buildPropArticulation({
          ...input,
          nodeObjects: new Map([["door", new Group()]]),
          modelObjects: new Map([["door", { ...built, parts: new Map() }]]),
        }),
      [`drives part "${partId}"`, "does not carry"],
    ),
  );
}
