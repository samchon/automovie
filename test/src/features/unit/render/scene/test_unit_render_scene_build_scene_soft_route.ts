import type { IAutoMovieRenderSoftPropFrame } from "@automovie/interface";
import {
  AutoMovieThreeKind,
  type IAutoMovieSceneSoftProps,
  buildSceneSoftProps,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/predicates";

/** All authored cloth coordinates are exact even after conversion to float32. */
const CLOTH_TOLERANCE: number = 0;

/**
 * Mount one cloth at its first frame, then update it in place beside a rigid
 * node.
 *
 * Scenarios:
 *
 * 1. At each of two film instants, the cloth's position attribute holds the
 *    supplied panel.
 * 2. The second frame uses the same mesh and retains the rigid node as the first
 *    child.
 * 3. After disposal only the rigid node remains and updates are refused.
 */
export function test_unit_render_scene_build_scene_soft_route(): void {
  const root: THREE.Scene = new THREE.Scene();
  const rigid: THREE.Group = new THREE.Group();
  root.add(rigid);
  const first: IAutoMovieRenderSoftPropFrame = cloth(0.5, "rest");
  const second: IAutoMovieRenderSoftPropFrame = cloth(0.75, "solved");
  const soft: IAutoMovieSceneSoftProps = buildSceneSoftProps(root);
  try {
    soft.update([first]);
    const mesh: THREE.Object3D | undefined = root.getObjectByName("soft:cloth");
    const initialSurface: boolean = matches(mesh, first);
    soft.update([second]);
    TestValidator.predicate(
      "both cloth frames use one mesh after the rigid node",
      () =>
        initialSurface &&
        mesh?.parent === root &&
        root.getObjectByName("soft:cloth") === mesh &&
        root.children[0] === rigid &&
        matches(mesh, second),
    );
  } finally {
    soft.dispose();
  }
  TestValidator.predicate(
    "closing detaches only the soft layer",
    () => root.children.length === 1 && root.children[0] === rigid,
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
  if (object === undefined || !AutoMovieThreeKind.isMesh(object)) return false;
  const positions: ArrayLike<number> =
    object.geometry.getAttribute("position").array;
  return (
    positions.length === frame.surface.mesh.positions.length &&
    frame.surface.mesh.positions.every(
      (expected: number, index: number): boolean =>
        nclose(positions[index]!, expected, CLOTH_TOLERANCE),
    ) &&
    object.visible &&
    object.userData.status === frame.status
  );
}
