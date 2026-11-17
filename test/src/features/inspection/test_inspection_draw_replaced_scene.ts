import type { IAutoMovieMark } from "@automovie/interface";
import {
  type IAutoMovieInspectionHandle,
  replaceAutoMovieDrawInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";
import { nclose } from "../internal/nclose";

/**
 * Inspection binds the actual replacement graph before bounds or drawing.
 *
 * Scenarios:
 * 1. Selecting one of two real meshes hides the other. A seek then replaces
 *    both meshes under the same names: the old masks are restored before
 *    placement and the new unselected mesh is hidden, not left on layer0.
 * 2. A new position changes the selected bounds to the independently authored
 *    box corners. Changing the request selects the other current mesh.
 * 3. Failed asynchronous placement leaves the previous scene state restored
 *    and no inspection overlay attached; no stale handle remains active.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States replacement identities, unchanged semantic names, current bounds and failure cleanup.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public draw-inspection lifecycle with actual Three meshes and the real inspection engine, observing current layer masks, selected paths, bounds and restoration without a fake renderer.
 * @evidence contracts/development/testing.md#independent-expectations Two authored unit boxes have literal x corners -4.5/-3.5 and4.5/5.5 at the selected positions. Default layer mask1 becomes0 only on the current unselected mesh; removed objects return to1 before the subject callback runs.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts initial and replacement identities, stable names with moved bounds, unchanged versus changed selection, successful versus failing placement and current versus detached object ownership.
 * @evidence contracts/development/testing.md#execution-ownership One portable async unit owns its scene, real geometries/materials and placement callbacks, disposes them in finally and starts no browser, process or compiler or foreign-method patch.
 */
export async function test_inspection_draw_replaced_scene(): Promise<void> {
  const findings: string[] = [];
  const scene: THREE.Scene = new THREE.Scene();
  const actors: THREE.Group = new THREE.Group();
  actors.name = "actors";
  scene.add(actors);
  let left: THREE.Mesh | undefined;
  let right: THREE.Mesh | undefined;
  let leftX: number = -1;
  let rightX: number = 1;
  let active: IAutoMovieInspectionHandle | null = null;
  try {
    active = await replaceAutoMovieDrawInspection({
      previous: null,
      scene,
      request: InspectionScene.ask({ parts: ["actors/left"], marks: [] }),
      place,
    });
    if (left!.layers.mask !== 1 || right!.layers.mask !== 0)
      findings.push("initial selection did not isolate its current mesh");
    const removed: THREE.Mesh = right!;
    leftX = -4;
    rightX = 4;
    active = await replaceAutoMovieDrawInspection({
      previous: active,
      scene,
      request: InspectionScene.ask({ parts: ["actors/left"], marks: [] }),
      place,
    });
    if (
      removed === right ||
      removed.layers.mask !== 1 ||
      left!.layers.mask !== 1 ||
      right!.layers.mask !== 0
    )
      findings.push("replacement reused an old mask population");
    const bounds: ReturnType<IAutoMovieInspectionHandle["bounds"]> =
      active.bounds(null);
    if (
      bounds === null ||
      !nclose(bounds.min.x, -4.5, 1e-12) ||
      !nclose(bounds.max.x, -3.5, 1e-12)
    )
      findings.push("bounds still measured an old selected object");
    if (
      !active.selected.includes("actors/left") ||
      active.selected.includes("actors/right")
    )
      findings.push(
        "the reported selection differs from current isolated geometry",
      );
    rightX = 5;
    active = await replaceAutoMovieDrawInspection({
      previous: active,
      scene,
      request: InspectionScene.ask({ parts: ["actors/right"], marks: [] }),
      place,
    });
    const switched: ReturnType<IAutoMovieInspectionHandle["bounds"]> =
      active.bounds(null);
    if (
      left!.layers.mask !== 0 ||
      right!.layers.mask !== 1 ||
      switched === null ||
      !nclose(switched.min.x, 4.5, 1e-12) ||
      !nclose(switched.max.x, 5.5, 1e-12)
    )
      findings.push(
        "a changed request did not select the actual current graph",
      );
    const previous: IAutoMovieInspectionHandle = active;
    active = null;
    let refused: boolean = false;
    try {
      await replaceAutoMovieDrawInspection({
        previous,
        scene,
        request: InspectionScene.ask({ parts: ["actors/left"], marks: [] }),
        place: async (): Promise<readonly IAutoMovieMark[]> => {
          if (left!.layers.mask !== 1 || right!.layers.mask !== 1)
            findings.push(
              "the old inspection remained active during failed placement",
            );
          throw new Error("authored placement failure");
        },
      });
    } catch {
      refused = true;
    }
    if (
      !refused ||
      left!.layers.mask !== 1 ||
      right!.layers.mask !== 1 ||
      scene.children.length !== 1
    )
      findings.push(
        "failed placement left inspection state or an overlay active",
      );
    TestValidator.equals(
      "current scene graph inspection lifecycle",
      findings,
      [],
    );
  } finally {
    active?.restore();
    for (const mesh of [left, right]) if (mesh !== undefined) release(mesh);
  }

  /** The real subject replaces its objects while preserving semantic paths. */
  async function place(): Promise<readonly IAutoMovieMark[]> {
    if (left !== undefined && right !== undefined) {
      if (left.layers.mask !== 1 || right.layers.mask !== 1)
        findings.push("detached meshes were not restored before seek");
      actors.remove(left, right);
      release(left);
      release(right);
    }
    left = box("left", leftX);
    right = box("right", rightX);
    actors.add(left, right);
    scene.updateMatrixWorld(true);
    return [];
  }
}

/** An independently authored unit box with ordinary layer0 membership. */
function box(name: string, x: number): THREE.Mesh {
  const mesh: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  mesh.name = name;
  mesh.position.x = x;
  return mesh;
}

/** Release only the fixture's owned buffers and appearance. */
function release(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  const materials: THREE.Material[] = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];
  for (const material of materials) material.dispose();
}
