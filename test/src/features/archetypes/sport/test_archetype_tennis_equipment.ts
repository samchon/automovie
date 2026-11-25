import { createGoal, createRacket } from "@automovie/archetypes";
import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";
import { applyRenderMode, buildModel } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, vclose } from "../../internal/predicates";

/**
 * The tennis equipment's optical holes and original physical contact are independently observable.
 *
 * Scenarios:
 * 1. The racket has an oval rim, strands and a split throat. Rays cross an empty string cell and the throat opening, hit a string on the contact plane and hit the frame at its equator and shoulder. The old head and throat shapes, grip, face and sweet spot retain their prior dimensions, frames and mass centre.
 * 2. The net has a clear cell at the bottom, a strand next to it and a tape band higher at the posts than at the centre. The panel and cord colliders and conserved mass remain in place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the racket and net scenarios and the independent optical and physical observations.
 * @evidence contracts/development/testing.md#behavioral-verification Rays hit visible geometry after the normal guide replaces materials, then physical shapes, materials, grips and mass are read from the same assets.
 * @evidence contracts/development/testing.md#independent-expectations Optical probes use literal metre locations and the physical fixtures expect their pre-mesh box dimensions, frame points and analytic uniform-solid mass centres.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares a hole, a nearby material hit and an exterior miss, so neither a flat panel nor removing local geometry passes.
 * @evidence contracts/development/testing.md#execution-ownership CPU raycasts use local Three models, restore the guide materials and retire the models' geometry and materials without starting a host.
 */
export function test_archetype_tennis_equipment(): void {
  const racket: ReturnType<typeof createRacket> = createRacket({
    kind: "tennis",
    length: 0.7,
    headWidth: 0.264,
    headLength: 0.36,
    handleLength: 0.18,
    gripDiameter: 0.033,
    mass: 0.3,
  });
  const net: ReturnType<typeof createGoal> = createGoal({
    kind: "tennisNet",
    mass: 40,
  });
  checkRays(racket, [
    [0, 0.528, false],
    [0, 0.52, 0.012],
    [0.126, 0.52, true],
    [0.125, 0.68, false],
    [0, 0.28, false],
    [-0.05, 0.3, true],
    [0.05, 0.3, true],
  ]);
  checkRays(net, [
    [0.067, 0.025, false],
    [0.0895, 0.025, true],
    [0.15, 0.905, true],
    [0.15, 1.038, false],
    [6, 1.038, true],
  ]);

  const racketShapes: IAutoMoviePhysicalShape[] = racket.shapes();
  const netShapes: IAutoMoviePhysicalShape[] = net.shapes();
  const head: IAutoMoviePhysicalShape | undefined = racketShapes.find(
    ({ id }) => id === "head",
  );
  const panel: IAutoMoviePhysicalShape | undefined = netShapes.find(
    ({ id }) => id === "net-left",
  );
  TestValidator.equals(
    "racket collision part ids",
    racketShapes.map(({ id }) => id),
    ["handle", "throat", "head"],
  );
  TestValidator.equals(
    "net collision part ids",
    netShapes.map(({ id }) => id),
    [
      "post-left",
      "cord-left",
      "net-left",
      "post-right",
      "cord-right",
      "net-right",
    ],
  );
  TestValidator.predicate(
    "contact poses, collision proxies and mass centres match the original solids",
    head?.kind === "box" &&
      vclose(head.halfExtents, { x: 0.132, y: 0.18, z: 0.012 }) &&
      panel?.kind === "box" &&
      vclose(panel.halfExtents, { x: 3.1995, y: 0.457, z: 0.0025 }) &&
      transparent(racket, "head") &&
      transparent(racket, "throat") &&
      transparent(net, "net-left") &&
      transparent(net, "net-right") &&
      vclose(racket.affordance("grip").frame.translation, {
        x: 0,
        y: 0.09,
        z: 0,
      }) &&
      vclose(racket.affordance("face").frame.translation, {
        x: 0,
        y: 0.52,
        z: 0.012,
      }) &&
      vclose(racket.affordance("sweetSpot").frame.translation, {
        x: 0,
        y: 0.52,
        z: 0,
      }) &&
      nclose(racket.properties.mass, 0.3) &&
      nclose(racket.properties.centerOfMass.y, 0.426636) &&
      nclose(net.properties.mass, 40) &&
      nclose(net.properties.centerOfMass.y, 0.547905),
  );
}

/** Whether the part's material explicitly declares zero-alpha blending. */
function transparent(model: IAutoMovieModel, id: string): boolean {
  const part: IAutoMovieModelPart | undefined = model.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === id,
  );
  return model.materials.some(
    (material): boolean =>
      material.id === part?.material &&
      material.alphaMode === "blend" &&
      material.opacity === 0,
  );
}

/** Shoot front and back Z rays after a guide material swap to check that the rendered openings stay clear. */
function checkRays(
  model: IAutoMovieModel,
  examples: readonly (readonly [x: number, y: number, hit: boolean | number])[],
): void {
  const built: ReturnType<typeof buildModel> = buildModel(model);
  const meshes: THREE.Mesh[] = [...built.parts.values()].filter(
    (part: THREE.Object3D): part is THREE.Mesh => part instanceof THREE.Mesh,
  );
  const materials: Set<THREE.Material> = new Set(
    meshes.flatMap(({ material }) => material),
  );
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(built.object);
  scene.updateMatrixWorld(true);
  try {
    const guide: ReturnType<typeof applyRenderMode> = applyRenderMode(
      scene,
      "normal",
    );
    try {
      const visible: THREE.Mesh[] = meshes.filter(({ visible }) => visible);
      for (const [x, y, expected] of examples)
        for (const z of [-1, 1]) {
          const ray: THREE.Raycaster = new THREE.Raycaster(
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(0, 0, -z),
          );
          const hit: THREE.Intersection | undefined =
            ray.intersectObjects(visible)[0];
          const label: string = `${model.name} optical ray at (${x}, ${y}) from ${z}`;
          TestValidator.equals(label, hit !== undefined, expected !== false);
          if (z > 0 && typeof expected === "number")
            TestValidator.predicate(
              `${label} meets the front string plane`,
              nclose(hit!.point.z, expected),
            );
        }
    } finally {
      guide.restore();
    }
  } finally {
    for (const mesh of meshes) mesh.geometry.dispose();
    for (const material of materials) material.dispose();
  }
}
