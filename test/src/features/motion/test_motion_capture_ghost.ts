import { applyMotionCaptureGhost } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { throwsError } from "../internal/throwsError";

/**
 * A motion case draws a ghost of a figure by giving every mesh under it one translucent flat material that never writes depth, so the ghost overlays the solid figure without hiding it, and the case releases only the material it made.
 *
 * Scenarios:
 *
 * 1. A figure of two meshes under a group, with a line beside them, ghosted in `0x3a6ea5` at opacity 0.35: both meshes share one transparent `MeshBasicMaterial` of that colour and opacity with depth writing off and draw at render order 5, and the line keeps its own material.
 * 2. Disposing the ghost disposes its material and leaves the replaced materials undisposed, because their owner still holds them.
 * 3. Opacity 1 is accepted; opacity 0, a negative opacity, one above 1 and NaN are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the ghost to a real three.js tree and reads each object's material, its settings and the dispose events; a ghost that missed a nested mesh, hid the figure by writing depth, touched a line, or disposed the owner's materials fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected colour, opacity, depth flag and order are the documented ghost settings for the values this test passes; three.js's `dispose` event is the oracle for release.
 * @evidence contracts/development/testing.md#distinguishing-cases Nested against direct meshes, a mesh against a line, the ghost's material against the replaced ones, and the opacity bounds on both sides. How a case places its ghosts over time is owned by the motion capture tests.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_motion_capture_ghost`; it builds three.js objects in memory and draws nothing.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_motion_capture_ghost(): void {
  // 1. Every mesh, nested or not, shares the ghost material; the line keeps its own.
  const solid: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const lineMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial();
  const root: THREE.Group = new THREE.Group();
  const torso: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(), solid);
  const arm: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(), solid);
  const line: THREE.Line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
  const limb: THREE.Group = new THREE.Group();
  limb.add(arm);
  root.add(torso, limb, line);
  const release: () => void = applyMotionCaptureGhost(root, 0x3a6ea5, 0.35);
  const ghost: THREE.Material = torso.material as THREE.Material;
  TestValidator.equals(
    "both meshes share one translucent flat material that writes no depth",
    [
      ghost instanceof THREE.MeshBasicMaterial,
      arm.material === ghost,
      (ghost as THREE.MeshBasicMaterial).color.getHex(),
      ghost.transparent,
      ghost.opacity,
      ghost.depthWrite,
      torso.renderOrder,
      arm.renderOrder,
    ],
    [true, true, 0x3a6ea5, true, 0.35, false, 5, 5],
  );
  TestValidator.predicate("the line keeps its own material", line.material === lineMaterial);

  // 2. Release disposes only the ghost material.
  const disposed: string[] = [];
  ghost.addEventListener("dispose", (): void => {
    disposed.push("ghost");
  });
  solid.addEventListener("dispose", (): void => {
    disposed.push("solid");
  });
  release();
  TestValidator.equals("only the ghost material is disposed", disposed, ["ghost"]);

  // 3. Opacity bounds.
  applyMotionCaptureGhost(new THREE.Group(), 0xffffff, 1)();
  for (const opacity of [0, -0.5, 1.5, Number.NaN])
    TestValidator.predicate(
      `opacity ${opacity} is refused`,
      throwsError((): unknown => applyMotionCaptureGhost(new THREE.Group(), 0xffffff, opacity), "opacity"),
    );
}
