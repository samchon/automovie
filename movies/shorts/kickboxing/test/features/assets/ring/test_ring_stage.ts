import assert from "node:assert/strict";
import * as THREE from "three";

import { createInspectionRing } from "../../../src/createInspectionRing";

/**
 * Check the source-owned ring dimensions and corner meaning without a scene host.
 *
 * Scenarios:
 * 1. The physical slab, rope envelope and authored route area retain distinct sizes.
 * 2. Four straight ropes on each side use the four primary-rule elevations.
 * 3. Assigned corners differ visibly from the two diagonal neutral corners.
 * 4. Nested frozen data rejects mutation and later requests remain independent.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the public pure layout and observes its dimensions, generated boundary envelopes, corner assignments and immutability. This catches a descriptor that mislabels a 6.4-metre mat as a six-metre rope interior or gives the winner an assigned corner. No browser, GPU or server runs.
 * @evidence contracts/testing.md#independent-cases Expected 6.4-metre slab, 6.2-metre rope-centre span and zero canvas height preserve the existing stage contract. GLORY 2026 v2.2 section 4.06 supplies four elevations and the permitted rope diameter; neutral-white/red/cyan colours and 2.65-metre route coordinates are explicit fictional choices. Surface construction is checked separately; no root point proves whole-body clearance.
 */
export function test_ring_stage_layout(): void {
  const layout: createInspectionRing.Layout = createInspectionRing.layout();
  assert.equal(layout.floorY, 0);
  close(layout.matBounds.max[0] - layout.matBounds.min[0], 6.4);
  close(layout.matBounds.max[2] - layout.matBounds.min[2], 6.4);
  close(layout.matBounds.min[1], -0.15);
  close(layout.matBounds.max[1], 0);
  close(layout.apronBounds.max[1], layout.matBounds.min[1]);
  close(layout.usableBounds.max[0] - layout.usableBounds.min[0], 6);
  close(layout.usableBounds.max[2] - layout.usableBounds.min[2], 6);
  close(layout.ropeSpan, 6.2);
  close(layout.ropeRadius * 2, 0.036);
  assert.ok(layout.ropeRadius * 2 >= 0.03 && layout.ropeRadius * 2 <= 0.05);
  assert.equal(layout.ropes.length, 16);
  assert.equal(
    new Set(
      layout.ropes.map((rope: createInspectionRing.Rope): string => rope.id),
    ).size,
    16,
  );
  for (const [index, expected] of [0.4, 0.8, 1.2, 1.5].entries()) {
    close(layout.ropeHeights[index]!, expected);
    assert.equal(
      layout.ropes.filter(
        (rope: createInspectionRing.Rope): boolean =>
          Math.abs(rope.centre[1] - expected) < 1e-12,
      ).length,
      4,
    );
  }
  for (const rope of layout.ropes) {
    const along: number = rope.axis === "x" ? 0 : 2;
    const across: number = rope.axis === "x" ? 2 : 0;
    close(rope.centre[along]!, 0);
    close(Math.abs(rope.centre[across]!), 3.1);
    close(rope.bounds.min[along]!, -3.1);
    close(rope.bounds.max[along]!, 3.1);
    close(rope.bounds.max[across]! - rope.bounds.min[across]!, 0.036);
    close(rope.bounds.max[1] - rope.bounds.min[1], 0.036);
    assert.ok(rope.bounds.min[1] > layout.floorY);
  }

  const neutral: readonly createInspectionRing.Corner[] = layout.corners.filter(
    (corner: createInspectionRing.Corner): boolean => corner.role === "neutral",
  );
  assert.equal(layout.corners.length, 4);
  assert.equal(neutral.length, 2);
  const northwest: createInspectionRing.Corner = neutral.find(
    (corner: createInspectionRing.Corner): boolean =>
      corner.id === "neutral-nw",
  )!;
  const southeast: createInspectionRing.Corner = neutral.find(
    (corner: createInspectionRing.Corner): boolean =>
      corner.id === "neutral-se",
  )!;
  close(northwest.postCentre[0], -3.1);
  close(northwest.postCentre[2], -3.1);
  close(southeast.postCentre[0], 3.1);
  close(southeast.postCentre[2], 3.1);
  close(northwest.holdingPoint[0], -2.65);
  close(northwest.holdingPoint[2], -2.65);
  close(southeast.holdingPoint[0], 2.65);
  close(southeast.holdingPoint[2], 2.65);
  for (const corner of neutral) {
    assert.equal(corner.actorId, null);
    assert.equal(corner.color, 0xf1f0e8);
  }
  const red: createInspectionRing.Corner = layout.corners.find(
    (corner: createInspectionRing.Corner): boolean => corner.role === "red",
  )!;
  const blue: createInspectionRing.Corner = layout.corners.find(
    (corner: createInspectionRing.Corner): boolean => corner.role === "blue",
  )!;
  assert.equal(red.actorId, "a");
  assert.equal(blue.actorId, "b");
  assert.equal(red.color, 0xc72c3b);
  assert.equal(blue.color, 0x159fc4);
  for (const corner of layout.corners) {
    close(corner.postCentre[1] - layout.postHeight / 2, 0);
    close(corner.padBounds.min[1], 0.35);
    close(corner.padBounds.max[1], 1.55);
    close(corner.padBounds.max[0] - corner.padBounds.min[0], 0.24);
    close(corner.padBounds.max[2] - corner.padBounds.min[2], 0.24);
    assert.ok(corner.padBounds.min[0] > -3.2 && corner.padBounds.max[0] < 3.2);
    assert.ok(corner.padBounds.min[2] > -3.2 && corner.padBounds.max[2] < 3.2);
    assert.ok(
      Math.abs(corner.holdingPoint[0]) < 3 &&
        Math.abs(corner.holdingPoint[2]) < 3,
    );
  }

  assert.equal(Reflect.set(layout, "floorY", 20), false);
  assert.equal(Reflect.set(layout.matBounds.min, "0", -99), false);
  assert.equal(Reflect.set(layout.ropes[0]!.bounds.max, "1", 99), false);
  assert.equal(Reflect.set(northwest.holdingPoint, "0", 99), false);
  assert.equal(Reflect.set(layout.corners, "0", blue), false);
  const later: createInspectionRing.Layout = createInspectionRing.layout();
  assert.notEqual(layout, later);
  assert.notEqual(layout.ropes[0], later.ropes[0]);
  close(later.floorY, 0);
  close(
    later.corners.find(
      (corner: createInspectionRing.Corner): boolean =>
        corner.id === "neutral-nw",
    )!.holdingPoint[0],
    -2.65,
  );
}

/**
 * Read actual constructed primitive vertices and material assignments on the CPU.
 *
 * Scenarios:
 * 1. Canvas and apron actual vertices meet at their declared surfaces.
 * 2. All sixteen actual rope meshes match their closed cylindrical envelopes.
 * 3. Every real corner pad matches its world bounds and assigned material.
 * 4. Exactly two visible bands connect each side's lowest and highest rope.
 *
 * @evidence contracts/testing.md#observable-behavior Constructs the real factory subtree and measures Three.js BufferGeometry vertices after its actual world matrices. This catches disconnected staging descriptors, absent neutral pads and rope transforms on the wrong axis. It is a portable CPU geometry test with no rendering host; pixel readability remains actual Viewer review.
 * @evidence contracts/testing.md#independent-cases Expected canvas dimensions, four elevations, centimetre rope diameter and commissioned corner palette are independent values in the layout test. Here actual emitted vertices must reach the declared primitive bounds within one micrometre for Float32 storage; an analytic bound alone cannot pass. Support, collision admission and whole-film motion belong to actual consumer checks.
 */
export function test_ring_stage_geometry(): void {
  const ring: createInspectionRing.Result = createInspectionRing();
  try {
    const layout: createInspectionRing.Layout = ring.layout;
    ring.object.updateMatrixWorld(true);
    bounds(ring.object.getObjectByName("canvas")!, layout.matBounds);
    bounds(ring.object.getObjectByName("apron")!, layout.apronBounds);
    for (const rope of layout.ropes)
      bounds(ring.object.getObjectByName(rope.id)!, rope.bounds);
    for (const corner of layout.corners) {
      const pad: THREE.Mesh = ring.object.getObjectByName(
        `pad:${corner.id}`,
      ) as THREE.Mesh;
      const post: THREE.Mesh = ring.object.getObjectByName(
        `post:${corner.id}`,
      ) as THREE.Mesh;
      assert.ok(pad instanceof THREE.Mesh && post instanceof THREE.Mesh);
      bounds(pad, corner.padBounds);
      assert.equal(
        (pad.material as THREE.MeshStandardMaterial).color.getHex(),
        corner.color,
      );
      assert.equal(
        (post.material as THREE.MeshStandardMaterial).color.getHex(),
        corner.color,
      );
      close(post.position.y, 0.775);
      close(post.position.x, corner.postCentre[0]);
      close(post.position.z, corner.postCentre[2]);
    }
    const bands: THREE.Object3D[] = ring.object.children.filter(
      (child: THREE.Object3D): boolean => child.name.startsWith("rope-band:"),
    );
    assert.equal(bands.length, 8);
    for (const band of bands) {
      const box: THREE.Box3 = new THREE.Box3().setFromObject(band);
      close(box.min.y, 0.4);
      close(box.max.y, 1.5);
      assert.ok(
        Math.abs(Math.abs(band.position.x) - 3.1) < 1e-12 ||
          Math.abs(Math.abs(band.position.z) - 3.1) < 1e-12,
      );
    }
  } finally {
    ring.dispose();
  }
}

/**
 * Keep repeated geometry bounded and release actual native resources once.
 *
 * Scenarios:
 * 1. Four posts, four pads, sixteen ropes and eight bands reuse their own shapes.
 * 2. Two neutral corners reuse one white material while assigned colours differ.
 * 3. First disposal removes the subtree and emits each resource's native event once.
 * 4. Repeated disposal has no extra release effects; frozen layout remains readable.
 *
 * @evidence contracts/testing.md#observable-behavior Observes actual geometry/material identities and their public dispose events without replacing foreign methods. Scene removal and idempotent release expose both retained GPU-resource leaks and duplicate disposal; no GPU allocation or real host is needed.
 * @evidence contracts/testing.md#independent-cases Six geometry families and six materials follow the stage's fixed primitive and palette contract, independently of mesh identity. Expected one event per unique owned resource derives from the disposer lifetime. Actual GPU reclamation and render costs require the later Viewer inspection.
 */
export function test_ring_stage_lifetime(): void {
  const ring: createInspectionRing.Result = createInspectionRing();
  const scene: THREE.Scene = new THREE.Scene();
  const geometries: Set<THREE.BufferGeometry> = new Set();
  const materials: Set<THREE.Material> = new Set();
  scene.add(ring.object);
  ring.object.traverse((child: THREE.Object3D): void => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    for (const material of Array.isArray(child.material)
      ? child.material
      : [child.material])
      materials.add(material);
  });
  assert.equal(geometries.size, 6);
  assert.equal(materials.size, 6);
  let geometryReleases: number = 0;
  let materialReleases: number = 0;
  for (const geometry of geometries)
    geometry.addEventListener("dispose", (): void => {
      geometryReleases++;
    });
  for (const material of materials)
    material.addEventListener("dispose", (): void => {
      materialReleases++;
    });
  ring.dispose();
  assert.equal(ring.object.parent, null);
  assert.equal(scene.children.length, 0);
  assert.equal(geometryReleases, 6);
  assert.equal(materialReleases, 6);
  ring.dispose();
  assert.equal(geometryReleases, 6);
  assert.equal(materialReleases, 6);
  close(ring.layout.floorY, 0);
}

/**
 * Drain every real resource owner after native retirement listeners throw.
 *
 * Scenarios:
 * 1. Native removal, first-geometry and first-material listeners throw distinct causes.
 * 2. Every unique geometry and material still receives exactly one dispose event.
 * 3. Reentrant and repeated retirement have no extra removal or resource effects.
 *
 * @evidence contracts/testing.md#observable-behavior Attaches public native listeners to the actual ring subtree, geometries and materials without replacing methods. It observes complete disposal fan-out, original AggregateError causes, scene removal and terminal repeat behavior on the CPU; no renderer or GPU is constructed.
 * @evidence contracts/testing.md#independent-cases Each unique emitted resource independently requires one retirement event. Three literal listener errors must survive in removal/geometry/material order, while later owners still run. Reentry during removal and resource events distinguishes retirement-before-callback from late flags; the existing lifetime case owns the successful path.
 */
export function test_ring_stage_disposal_failures(): void {
  const ring: createInspectionRing.Result = createInspectionRing();
  const scene: THREE.Scene = new THREE.Scene();
  const geometries: Set<THREE.BufferGeometry> = new Set();
  const materials: Set<THREE.Material> = new Set();
  scene.add(ring.object);
  ring.object.traverse((child: THREE.Object3D): void => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    for (const material of Array.isArray(child.material)
      ? child.material
      : [child.material])
      materials.add(material);
  });
  assert.equal(geometries.size, 6);
  assert.equal(materials.size, 6);
  const firstGeometry: THREE.BufferGeometry = [...geometries][0]!;
  const firstMaterial: THREE.Material = [...materials][0]!;
  const removalFailure: Error = new Error("Native ring removal failed");
  const geometryFailure: Error = new Error(
    "Native ring geometry retirement failed",
  );
  const materialFailure: Error = new Error(
    "Native ring material retirement failed",
  );
  const releases: Map<THREE.BufferGeometry | THREE.Material, number> =
    new Map();
  let removals: number = 0;
  ring.object.addEventListener("removed", (): void => {
    removals++;
    ring.dispose();
    throw removalFailure;
  });
  for (const geometry of geometries)
    geometry.addEventListener("dispose", (): void => {
      releases.set(geometry, (releases.get(geometry) ?? 0) + 1);
      ring.dispose();
      if (geometry === firstGeometry) throw geometryFailure;
    });
  for (const material of materials)
    material.addEventListener("dispose", (): void => {
      releases.set(material, (releases.get(material) ?? 0) + 1);
      ring.dispose();
      if (material === firstMaterial) throw materialFailure;
    });

  assert.throws(
    (): void => ring.dispose(),
    (error: unknown): boolean => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, 3);
      assert.equal(error.errors[0], removalFailure);
      assert.equal(error.errors[1], geometryFailure);
      assert.equal(error.errors[2], materialFailure);
      return true;
    },
  );
  assert.equal(ring.object.parent, null);
  assert.equal(scene.children.length, 0);
  assert.equal(removals, 1);
  for (const resource of [...geometries, ...materials])
    assert.equal(releases.get(resource), 1);
  assert.doesNotThrow((): void => ring.dispose());
  assert.equal(removals, 1);
  for (const resource of [...geometries, ...materials])
    assert.equal(releases.get(resource), 1);
  close(ring.layout.floorY, 0);
}

/** Assert Float32 primitive coordinates within one micrometre of metre-valued dimensions. */
function close(actual: number, expected: number): void {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-6,
    `${actual} must be within 0.000001 m of ${expected}`,
  );
}

/** Measure actual native primitive vertices after their world transform, without rendering. */
function bounds(
  object: THREE.Object3D,
  expected: createInspectionRing.Bounds,
): void {
  assert.ok(object instanceof THREE.Mesh);
  const actual: THREE.Box3 = new THREE.Box3().setFromObject(object);
  for (let axis: number = 0; axis < 3; axis++) {
    close(actual.min.getComponent(axis), expected.min[axis]!);
    close(actual.max.getComponent(axis), expected.max[axis]!);
  }
}
