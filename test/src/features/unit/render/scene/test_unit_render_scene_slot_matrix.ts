import { slotMatrix } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Tolerance of the composed transform. */
const MATRIX_TOLERANCE: number = 1e-9;

/**
 * `slotMatrix` places a formation slot relative to the formation anchor.
 *
 * Scenarios:
 *
 * 1. A slot at (3, 1, 5) facing 90 degrees about +Y, over an anchor at
 *    (1, 1, 1), translates by (2, 0, 4) and turns a quarter about +Y.
 */
export function test_unit_render_scene_slot_matrix(): void {
  const matrix: THREE.Matrix4 = slotMatrix(
    {
      slot: 0,
      node: "n",
      actor: null,
      model: "m",
      position: { x: 3, y: 1, z: 5 },
      facingDeg: 90,
      motionPhase: 0,
    },
    { x: 1, y: 1, z: 1 },
  );
  const position: THREE.Vector3 = new THREE.Vector3();
  const rotation: THREE.Quaternion = new THREE.Quaternion();
  matrix.decompose(position, rotation, new THREE.Vector3());
  TestValidator.predicate(
    "translation",
    position.distanceTo(new THREE.Vector3(2, 0, 4)) < MATRIX_TOLERANCE,
  );
  const quarter: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    Math.PI / 2,
  );
  TestValidator.predicate(
    "quarter turn",
    Math.abs(rotation.dot(quarter)) > 1 - MATRIX_TOLERANCE,
  );
}