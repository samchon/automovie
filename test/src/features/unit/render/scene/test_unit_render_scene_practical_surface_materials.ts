import type {
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  applyPracticalSurfaceMaterials,
  buildMaterial,
  buildModel,
  buildScene,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { renderFixtureIdentity } from "../../../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../../../internal/renderFixtureNode";
import { boxModel, material } from "../../../internal/renderFixtures";
import { throwsError } from "../../../internal/throwsError";

/**
 * A practical surface cue replaces the native material on just the tracked
 * prop instance, including when a host seeks back to the opening.
 *
 * Scenarios:
 *
 * 1. Two mounted meshes derive from one authored model. A later cue gives one
 *    mesh a different prepared material and leaves its peer on its opening.
 * 2. A backward seek restores the first mesh's original material reference.
 * 3. If a later target has no prepared variant, no earlier target is changed.
 */
export function test_unit_render_scene_practical_surface_materials(): void {
  const model: IAutoMovieModel = boxModel({
    id: "notice",
    materials: [
      material("idle"),
      { ...material("ready"), emissive: { r: 0, g: 1, b: 0, a: 1, hex: null } },
    ],
  });
  const part: string = model.parts[0]!.id;
  const scene: IAutoMovieScene = {
    id: "concourse",
    name: null,
    nodes: [
      renderFixtureNode("near-board", model.id),
      {
        ...renderFixtureNode("far-board", model.id),
        transform: {
          ...renderFixtureIdentity,
          translation: { x: 3, y: 0, z: 0 },
        },
      },
    ],
    cameras: [
      {
        id: "camera",
        transform: renderFixtureIdentity,
        fovY: 40,
        near: 0.1,
        far: 100,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 },
      },
    ],
    lights: [],
  };
  const near: ReturnType<typeof buildModel> = buildModel(model);
  const far: ReturnType<typeof buildModel> = buildModel(model);
  const nearMesh: THREE.Object3D | undefined = near.parts.get(part);
  const farMesh: THREE.Object3D | undefined = far.parts.get(part);
  if (
    !(nearMesh instanceof THREE.Mesh) ||
    !(farMesh instanceof THREE.Mesh) ||
    Array.isArray(nearMesh.material) ||
    Array.isArray(farMesh.material)
  )
    throw new Error("Expected one material slot per board mesh");

  const nearIdle: THREE.Material = nearMesh.material;
  const farIdle: THREE.Material = farMesh.material;
  const ready: THREE.Material = buildMaterial(model.materials[1]!);
  try {
    const pending: ReturnType<typeof buildModel>[] = [near, far];
    const mounted: ReturnType<typeof buildScene> = buildScene(
      scene,
      (modelId: string): ReturnType<typeof buildModel> | undefined =>
        modelId === model.id ? pending.shift() : undefined,
    );
    TestValidator.predicate(
      "separate model objects are mounted under their distinct placements",
      near.object.parent === mounted.scene.getObjectByName("near-board") &&
        far.object.parent === mounted.scene.getObjectByName("far-board") &&
        near.object.parent?.position.x === 0 &&
        far.object.parent?.position.x === 3,
    );

    const shot: IAutoMovieShot = {
      id: "reveal",
      name: null,
      scene: scene.id,
      camera: "camera",
      cameraMotion: null,
      performances: [],
      objectMotions: [],
      duration: 1,
      practicalSurfaces: [
        {
          node: "near-board",
          part,
          keys: [
            { time: 0, material: "idle" },
            { time: 0.5, material: "ready" },
          ],
        },
      ],
    };
    const instances: ReadonlyMap<
      string,
      ReturnType<typeof buildModel>
    > = new Map([
      ["near-board", near],
      ["far-board", far],
    ]);
    const resolveNode: Parameters<typeof applyPracticalSurfaceMaterials>[2] = (
      id: string,
    ): ReturnType<typeof buildModel> | undefined => instances.get(id);
    const prepared: Readonly<Record<string, THREE.Material>> = {
      idle: nearIdle,
      ready,
    };
    const resolveMaterial: Parameters<
      typeof applyPracticalSurfaceMaterials
    >[3] = (
      node: string,
      partId: string,
      id: string,
    ): THREE.Material | undefined =>
      node === "near-board" && partId === part ? prepared[id] : undefined;

    applyPracticalSurfaceMaterials(shot, 0.5, resolveNode, resolveMaterial);
    TestValidator.predicate(
      "exact cue updates only the selected instance and keeps authored material",
      nearMesh.material === ready &&
        farMesh.material === farIdle &&
        model.parts[0]!.material === "idle",
    );
    applyPracticalSurfaceMaterials(shot, 0.1, resolveNode, resolveMaterial);
    TestValidator.predicate(
      "reverse seek restores the exact staged material reference",
      nearMesh.material === nearIdle && farMesh.material === farIdle,
    );

    const both: IAutoMovieShot = {
      ...shot,
      practicalSurfaces: [
        ...shot.practicalSurfaces!,
        { node: "far-board", part, keys: [{ time: 0, material: "ready" }] },
      ],
    };
    TestValidator.predicate(
      "missing second prepared material refuses without updating the first mesh",
      throwsError(
        (): void =>
          applyPracticalSurfaceMaterials(
            both,
            0.5,
            resolveNode,
            resolveMaterial,
          ),
        ['"far-board"', 'has no prepared material "ready"'],
      ) &&
        nearMesh.material === nearIdle &&
        farMesh.material === farIdle,
    );
  } finally {
    nearMesh.geometry.dispose();
    farMesh.geometry.dispose();
    nearIdle.dispose();
    farIdle.dispose();
    ready.dispose();
  }
}
