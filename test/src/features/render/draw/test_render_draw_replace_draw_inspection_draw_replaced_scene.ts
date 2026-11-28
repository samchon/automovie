import { AutoMovieEngineCompositionContact } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieMark,
} from "@automovie/interface";
import {
  type IAutoMovieRenderDrawScene,
  type IAutoMovieRenderInspectionHandle,
  AutoMovieRenderDrawPlacement,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";
import { nclose } from "../../internal/nclose";

/**
 * Inspection binds the actual replacement graph before bounds or drawing.
 *
 * Scenarios:
 *
 * 1. Selecting one of two real meshes hides the other. A seek then replaces both
 *    meshes under the same names: the old masks are restored before placement
 *    and the new unselected mesh is hidden, not left on layer0.
 * 2. A new position changes the selected bounds to the independently authored box
 *    corners. Changing the request selects the other current mesh.
 * 3. Failed asynchronous placement leaves the previous scene state restored and no
 *    inspection overlay attached; no stale handle remains active.
 * 4. The declared contact kind is admitted on each replacement graph. Its solver
 *    receipt draws one arrow per collider at the completed step, expires, then
 *    reappears at the same second when the capture seeks backwards.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Binds the actual replacement graph, restores retired masks and redraws native contact marks on reverse seek.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises draw inspection with prepared successive meshes, a failed async placement and seekable physics receipt marks.
 * @evidence contracts/development/testing.md#independent-expectations Authored box corners give independent replacement bounds. The old and new mesh masks, absent failed overlay and known solver receipt times distinguish correct rebind from stale state.
 */
export async function test_render_draw_replace_draw_inspection_draw_replaced_scene(): Promise<void> {
  const findings: string[] = [];
  const scene: THREE.Scene = new THREE.Scene();
  const actors: THREE.Group = new THREE.Group();
  actors.name = "actors";
  scene.add(actors);
  let left: THREE.Mesh | undefined;
  let right: THREE.Mesh | undefined;
  let leftX: number = -1;
  let rightX: number = 1;
  let active: IAutoMovieRenderInspectionHandle | null = null;
  try {
    active = await AutoMovieRenderDrawPlacement.replaceInspection({
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
    active = await AutoMovieRenderDrawPlacement.replaceInspection({
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
    const bounds: ReturnType<IAutoMovieRenderInspectionHandle["bounds"]> =
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
    active = await AutoMovieRenderDrawPlacement.replaceInspection({
      previous: active,
      scene,
      request: InspectionScene.ask({ parts: ["actors/right"], marks: [] }),
      place,
    });
    const switched: ReturnType<IAutoMovieRenderInspectionHandle["bounds"]> =
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
    const previous: IAutoMovieRenderInspectionHandle = active;
    active = null;
    let refused: boolean = false;
    try {
      await AutoMovieRenderDrawPlacement.replaceInspection({
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

    const sample: NonNullable<IAutoMovieContactReceipt["samples"]>[number] = {
      seconds: 1,
      duration: 0.25,
      impulse: 0.5,
      point: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
      separation: 0,
      compression: 0,
    };
    const receipt: IAutoMovieContactReceipt = {
      id: "floor-contact",
      source: "solver",
      a: { body: "floor", bone: "root", shape: "slab", material: "wood" },
      b: { body: "left", bone: "root", shape: "box", material: "wood" },
      seconds: sample.seconds,
      endSeconds: sample.seconds,
      impulse: sample.impulse,
      point: sample.point,
      normal: sample.normal,
      separation: sample.separation,
      compression: sample.compression,
      samples: [sample],
    };
    const subject: Pick<IAutoMovieRenderDrawScene, "scene" | "markKinds"> = {
      scene,
      markKinds: ["contact"],
    };
    // One contact draws the force on each of its two colliders.
    for (const [seconds, count] of [
      [0.75, 0],
      [1, 2],
      [1.25, 0],
      [1, 2],
    ] as const) {
      active = await AutoMovieRenderDrawPlacement.replaceInspection({
        ...subject,
        previous: active,
        request: InspectionScene.ask({ marks: ["contact"] }),
        place: async (): Promise<IAutoMovieMark[]> => {
          await place();
          return AutoMovieEngineCompositionContact.markContacts({
            receipts: [receipt],
            seconds,
            metresPerNewton: 0.125,
          });
        },
      });
      TestValidator.equals(
        `contact marks at ${seconds}s`,
        active.legend.find(
          (entry: IAutoMovieInspectionLegendEntry): boolean =>
            entry.label === "contact force",
        )?.count ?? 0,
        count,
      );
    }
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
  const materials: THREE.Material[] = [mesh.material].flat();
  for (const material of materials) material.dispose();
}
