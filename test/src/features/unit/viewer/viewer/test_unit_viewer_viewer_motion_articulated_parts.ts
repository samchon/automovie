import { compareCodeUnits, sceneToNodes } from "@automovie/engine";
import type {
  IAutoMovieNode,
  IAutoMoviePropSpec,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  applyObjectMotions,
  buildModel,
  buildPropArticulation,
} from "@automovie/render";
import { strict as assert } from "node:assert";
import * as THREE from "three";

import { createDoorPropSpec } from "../../../internal/createDoorPropSpec";
import { IDENTITY_TRANSFORM } from "../../../internal/fixtures";
import { swingClip } from "../../../internal/swingClip";

/**
 * 1. Mount a door panel at an offset hinge, turn it through a right angle and restore its declared local transform.
 * 2. Examine missing host objects, invalid joint graphs, rigid and repeated registrations.
 */
export function test_unit_viewer_viewer_motion_articulated_parts(): void {
  const spec: IAutoMoviePropSpec = createDoorPropSpec();
  assert.ok(spec.articulation);
  const hinge: IAutoMovieNode = spec.articulation.nodes.find(
    (n: IAutoMovieNode): boolean => n.id === "hinge",
  )!;
  hinge.mesh = "panel";
  hinge.transform = {
    ...IDENTITY_TRANSFORM,
    translation: { x: -1, y: 0, z: 0 },
  };
  spec.model.parts.push({ ...spec.model.parts[0]!, id: "post" });
  const scene: IAutoMovieScene = {
    id: "hall",
    name: null,
    nodes: [
      {
        id: "frame",
        model: "door",
        motion: null,
        pose: null,
        transform: { ...IDENTITY_TRANSFORM, translation: { x: 2, y: 0, z: 0 } },
      },
    ],
    cameras: [],
    lights: [],
  };
  const model: IAutoMovieModelObject = buildModel(spec.model);
  const group: THREE.Group = new THREE.Group();
  group.position.x = 2;
  group.add(model.object);
  const nodes: Map<string, THREE.Object3D> = new Map([["frame", group]]);
  const models: Map<string, IAutoMovieModelObject> = new Map([
    ["frame", model],
  ]);
  const args: Parameters<typeof buildPropArticulation>[0] = {
    scene,
    props: [spec],
    nodeObjects: nodes,
    modelObjects: models,
  };
  const native: ReturnType<typeof buildPropArticulation> =
    buildPropArticulation(args);
  assert.deepEqual(
    [...native.joints.keys()].sort(compareCodeUnits),
    sceneToNodes({ scene, props: { door: spec } })
      .map((n: IAutoMovieNode): string => n.id)
      .filter((n: string): boolean => n !== "frame")
      .sort(compareCodeUnits),
  );
  const pivot: THREE.Object3D = native.joints.get("frame/hinge")!;
  const leaf: THREE.Object3D = model.parts.get("panel")!;
  const post: THREE.Object3D = model.parts.get("post")!;
  assert.equal(leaf.parent, pivot);
  assert.notEqual(post.parent, pivot);
  function position(o: THREE.Object3D): THREE.Vector3 {
    return o.getWorldPosition(new THREE.Vector3());
  }
  const rest: THREE.Vector3 = position(leaf);
  assert.deepEqual(rest.toArray(), [2, 0, 0]);
  applyObjectMotions(
    [swingClip("open", "frame/hinge", 90)],
    0,
    (id: string): THREE.Object3D | undefined => native.joints.get(id),
  );
  assert.ok(position(leaf).distanceTo(new THREE.Vector3(1, 0, -1)) < 1e-9);
  assert.deepEqual(position(pivot).toArray(), [1, 0, 0]);
  assert.deepEqual(position(post).toArray(), [2, 0, 0]);
  native.restore();
  assert.ok(position(leaf).distanceTo(rest) < 1e-9);
  assert.throws(
    () => buildPropArticulation({ ...args, nodeObjects: new Map() }),
    /built no object/,
  );
  assert.throws(
    () => buildPropArticulation({ ...args, modelObjects: new Map() }),
    /built no object/,
  );
  const rigid: IAutoMoviePropSpec = { ...spec, articulation: null };
  for (const props of [[], [rigid], [rigid, spec]])
    assert.equal(buildPropArticulation({ ...args, props }).joints.size, 0);
  hinge.mesh = "missing";
  assert.throws(() => buildPropArticulation(args), /missing/);
  hinge.mesh = "panel";
  hinge.parent = "missing";
  assert.throws(() => buildPropArticulation(args), /declares parent "missing"/);
}
