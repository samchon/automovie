import assert from "node:assert/strict";
import * as THREE from "three";

import { fitPerformanceCamera } from "../../../src/fitPerformanceCamera";
import { meshSurfacePoint } from "../../../src/meshSurfacePoint";
import { placePropAnchor } from "../../../src/placePropAnchor";

/**
 * Exercise actual mesh intersections and rigid witness placement independently.
 * @evidence contracts/testing.md#observable-behavior Intersects real indexed and nonindexed box triangles, refuses misses/nonfinite rays and aligns a rotated off-origin prop witness with a known world point. It catches box-proxy substitution, wrong local/world order and silently accepted misses; no Human-hand or pixel-readability claim follows.
 * @evidence contracts/testing.md#independent-cases A sloped triangle Y=X independently differs from its AABB at X=0.25. A two-metre cube independently has its anterior face at X=1; a ray from X=3 hits it with +X normal. A half-turn about Y maps local +X to -X, so a known anchor must still equal its explicit world contact. Misses and zero/nonfinite directions exercise intended refusals.
 */
export function test_surface_contacts(): void {
  for (const indexed of [true, false]) {
    const source: THREE.BoxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const geometry: THREE.BufferGeometry = indexed ? source : source.toNonIndexed();
    const mesh: THREE.Mesh = new THREE.Mesh(geometry);
    try {
      const hit: ReturnType<typeof meshSurfacePoint> = meshSurfacePoint(mesh, new THREE.Vector3(3, 0.2, 0.1), new THREE.Vector3(-1, 0, 0));
      assert.ok(hit.point.distanceTo(new THREE.Vector3(1, 0.2, 0.1)) < 1e-10);
      assert.ok(hit.normal.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-10);
      assert.throws((): void => { meshSurfacePoint(mesh, new THREE.Vector3(3, 3, 0), new THREE.Vector3(-1, 0, 0)); }, /missed/);
      assert.throws((): void => { meshSurfacePoint(mesh, new THREE.Vector3(), new THREE.Vector3()); }, /nonzero/);
      assert.throws((): void => { meshSurfacePoint(mesh, new THREE.Vector3(NaN, 0, 0), new THREE.Vector3(1, 0, 0)); }, /finite/);
    } finally { geometry.dispose(); if (!indexed) source.dispose(); }
  }
  const sloped: THREE.BufferGeometry = new THREE.BufferGeometry();
  sloped.setAttribute("position", new THREE.Float32BufferAttribute([0,0,0, 1,1,0, 0,0,1], 3));
  try {
    const hit: ReturnType<typeof meshSurfacePoint> = meshSurfacePoint(new THREE.Mesh(sloped), new THREE.Vector3(0.25, 2, 0.25), new THREE.Vector3(0, -1, 0));
    assert.ok(hit.point.distanceTo(new THREE.Vector3(0.25, 0.25, 0.25)) < 1e-10);
    assert.notEqual(hit.point.y, 1); // The triangle AABB's top is Y=1, not the actual hit.
  } finally { sloped.dispose(); }
  const prop: THREE.Object3D = new THREE.Object3D();
  const local: THREE.Vector3 = new THREE.Vector3(0.1, -0.03, 0.02);
  const world: THREE.Vector3 = new THREE.Vector3(3, 1.2, 0.8);
  const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  assert.ok(placePropAnchor(prop, local, world, rotation) < 1e-12);
  assert.ok(prop.localToWorld(local.clone()).distanceTo(world) < 1e-12);
  assert.deepEqual(local.toArray(), [0.1, -0.03, 0.02]);
  assert.throws((): void => { placePropAnchor(prop, local, world, new THREE.Quaternion(0, 0, 0, 2)); }, /unit/);
}

/**
 * Check adopted portrait perspective containment of actual object bounds.
 * @evidence contracts/testing.md#observable-behavior Fits a translated real box through the production camera helper, projects its eight independent corners and verifies the authored screen margin. It catches landscape assumptions and unclipped centre-only fitting, but not visual occlusion.
 * @evidence contracts/testing.md#independent-cases A 1-by-2-by-1 metre cuboid and 9:16 raster define the eight geometric corners; the contract's 0.86 screen fraction independently bounds projected X/Y. Empty populations and invalid margin must refuse.
 */
export function test_performance_camera(): void {
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 2, 1);
  const subject: THREE.Mesh = new THREE.Mesh(geometry);
  subject.position.set(3, 1, 2);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, 9 / 16, 0.1, 100);
  try {
    fitPerformanceCamera(camera, [subject], new THREE.Vector3(5.65, 2.45, 6));
    for (const x of [2.5, 3.5]) for (const y of [0, 2]) for (const z of [1.5, 2.5]) {
      const point: THREE.Vector3 = new THREE.Vector3(x, y, z).project(camera);
      assert.ok(Math.abs(point.x) <= 0.860001 && Math.abs(point.y) <= 0.860001);
      assert.ok(point.z >= -1 && point.z <= 1);
    }
    assert.throws((): void => { fitPerformanceCamera(camera, [], new THREE.Vector3(1, 0, 0)); }, /subjects/);
    assert.throws((): void => { fitPerformanceCamera(camera, [subject], new THREE.Vector3(1, 0, 0), 1); }, /margin/);
  } finally { geometry.dispose(); }
}
