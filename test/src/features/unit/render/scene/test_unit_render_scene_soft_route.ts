import type {
  IAutoMovieRenderSoftPropFrame,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  type IAutoMovieSceneObject,
  buildScene,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/predicates";

/**
 * Mount one cloth at its first frame, then update it in place beside a rigid node.
 *
 * Scenarios:
 *
 * 1. At each of two film instants, the cloth's position attribute holds the supplied panel.
 * 2. The second frame uses the same mesh and retains the rigid node as the first child.
 * 3. After disposal only the rigid node remains and updates are refused.
 */
export function test_unit_render_scene_soft_route(): void {
  const design: IAutoMovieScene = {
    id: "stage",
    name: null,
    cameras: [],
    lights: [],
    nodes: [
      {
        id: "stand",
        model: "stand",
        motion: null,
        pose: null,
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    ],
  };
  const rigid: IAutoMovieModelObject = {
    object: new THREE.Group(),
    bones: new Map(),
    parts: new Map(),
  };
  const first: IAutoMovieRenderSoftPropFrame = cloth(0.5, "rest");
  const second: IAutoMovieRenderSoftPropFrame = cloth(0.75, "solved");
  const built: IAutoMovieSceneObject = buildScene(
    design,
    (): IAutoMovieModelObject => rigid,
    undefined,
    [first],
  );
  const soft: NonNullable<IAutoMovieSceneObject["softProps"]> =
    built.softProps!;
  try {
    const mesh: THREE.Object3D | undefined =
      built.scene.getObjectByName("soft:cloth");
    const initialSurface: boolean = matches(mesh, first);
    soft.update([second]);
    TestValidator.predicate(
      "both cloth frames use one mesh after the rigid node",
      () =>
        initialSurface &&
        mesh?.parent === built.scene &&
        built.scene.getObjectByName("soft:cloth") === mesh &&
        built.scene.children[0]?.children[0] === rigid.object &&
        matches(mesh, second),
    );
  } finally {
    soft.dispose();
  }
  TestValidator.predicate(
    "closing detaches only the soft layer",
    () =>
      built.scene.children.length === 1 &&
      built.scene.children[0]?.children[0] === rigid.object,
  );
  TestValidator.error("closed projection refuses frames", (): void =>
    soft.update([first]),
  );
}

/** Four vertices of an authored unit square at the given world height. */
function cloth(
  y: number,
  status: IAutoMovieRenderSoftPropFrame["status"],
): IAutoMovieRenderSoftPropFrame {
  return {
    subject: "cloth",
    status,
    surface: {
      domain: "cloth-lattice",
      step: status === "rest" ? 0 : 1,
      bounds: { min: { x: 0, y, z: 0 }, max: { x: 1, y, z: 1 } },
      mesh: {
        positions: [0, y, 0, 1, y, 0, 0, y, 1, 1, y, 1],
        normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        uvs: [0, 0, 1, 0, 0, 1, 1, 1],
        indices: [0, 2, 1, 1, 2, 3],
        skin: null,
      },
    },
  };
}

/** Compare the visible position attribute and source status to one frame. */
function matches(
  object: THREE.Object3D | undefined,
  frame: IAutoMovieRenderSoftPropFrame,
): boolean {
  if (!(object instanceof THREE.Mesh)) return false;
  const positions: ArrayLike<number> =
    object.geometry.getAttribute("position").array;
  return (
    positions.length === frame.surface.mesh.positions.length &&
    frame.surface.mesh.positions.every(
      (expected: number, index: number): boolean =>
        nclose(positions[index]!, expected, 1e-9),
    ) &&
    object.visible &&
    object.userData.status === frame.status
  );
}
