import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeMarks,
  createDog,
} from "@automovie/archetypes";
import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieModelObject,
  applyAutoMovieInspection,
  buildModel,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";

/**
 * The actual primitive buffers agree with an authored outward lead before drawing.
 *
 * Scenarios:
 * 1. A real dog's0.6m straight lead is along model+X, with0.008m diameter
 *    in Y/Z after actual buildModel tessellation and world transforms.
 * 2. Applying the real capture inspection with actual affordance marks must
 *    retain those same physical bounds and not turn the lead into a vertical bar.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual authored lengths, the data-to-render boundary, inspected versus original mesh state and the visual phenomenon being tested.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual public dog into real Three meshes, measures actual tessellated geometry in world space, applies real inspection with its actual contact marks and measures again without GPU replacement or method patching.
 * @evidence contracts/development/testing.md#independent-expectations An authored0.6m lead extending in+X has world x extent0.6 and y/z extents equal its0.008m diameter;1e-6m admits Float32 geometry conversion while distinguishing a90degree orientation error or detached vertical bar.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts model-to-buffer realization and inspection side effects using physical vertices rather than only quaternion metadata or contact centres.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous scenario owns its scene, built buffers/materials and inspection, restores and disposes them in finally, and starts no browser, process or compiler.
 */
export function test_archetype_animal_render_alignment(): void {
  const animal: ReturnType<typeof createDog> = createDog(
    {
      mass: 22,
      cohort: "pet",
      tempo: 0,
      collar: {
        width: 0.02,
        thickness: 0.003,
        leadLength: 0.6,
        leadRadius: 0.004,
      },
    },
    43,
  );
  const built: IAutoMovieModelObject = buildModel(animal);
  built.object.name = "dog";
  const group: THREE.Group = new THREE.Group();
  group.name = "set";
  group.add(built.object);
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(group);
  let inspection: IAutoMovieInspectionHandle | null = null;
  const findings: string[] = [];
  try {
    check("built");
    inspection = applyAutoMovieInspection({
      scene,
      request: InspectionScene.ask({
        parts: ["set/dog"],
        marks: ["affordance/*"],
      }),
      marks: AutoMovieArchetypeMarks.of(
        "set/dog",
        animal.affordances,
        AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
        0.1,
      ),
    });
    check("inspected");
    TestValidator.equals("actual lead render alignment", findings, []);
  } finally {
    inspection?.restore();
    const geometries: Set<THREE.BufferGeometry> = new Set();
    const materials: Set<THREE.Material> = new Set();
    built.object.traverse((object: THREE.Object3D): void => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  }

  /** Read actual world buffers after each production boundary. */
  function check(stage: string): void {
    scene.updateMatrixWorld(true);
    const rope: THREE.Object3D = built.parts.get("lead")!;
    const box: THREE.Box3 = new THREE.Box3().setFromObject(rope, true);
    const size: THREE.Vector3 = box.getSize(new THREE.Vector3());
    if (
      Math.abs(size.x - 0.6) > 1e-6 ||
      Math.abs(size.y - 0.008) > 1e-6 ||
      Math.abs(size.z - 0.008) > 1e-6
    )
      findings.push(
        `${stage}: actual lead bounds ${JSON.stringify(size)}, quaternion ${JSON.stringify(rope.quaternion)}`,
      );
  }
}
