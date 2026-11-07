import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "../../../../packages/viewer/src/IAutoMovieModelObject";
import { createAutoMoviePhysicalPoseAdapter } from "../../../../packages/viewer/src/createAutoMoviePhysicalPoseAdapter";

/** Absolute physical display conversion.
 *
 * Scenarios:
 * 1. Rigid rotated parents preserve solved world frames and authored detail.
 * 2. Compensating local scales cannot conceal a nonuniform ancestor.
 * 3. Invalid display admission leaves the bone's authored local pose intact.
 */
export function test_physical_viewer_pose(): void {
  const object: THREE.Group = new THREE.Group();
  const root: THREE.Bone = new THREE.Bone();
  const head: THREE.Bone = new THREE.Bone();
  const detail: THREE.Bone = new THREE.Bone();
  root.name = "display root";
  head.name = "display head";
  detail.name = "display jaw";
  detail.position.y = 0.1;
  object.add(root);
  root.add(head);
  head.add(detail);
  const model: IAutoMovieModelObject = {
    object,
    bones: new Map([
      ["hips", root],
      ["head", head],
      ["jaw", detail],
    ]),
    parts: new Map(),
  };
  const apply: ReturnType<typeof createAutoMoviePhysicalPoseAdapter> =
    createAutoMoviePhysicalPoseAdapter(model);
  apply({
    hips: {
      position: { x: 1, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    },
    head: {
      position: { x: 1, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  });
  const findings: string[] = [];
  if (
    head
      .getWorldPosition(new THREE.Vector3())
      .distanceTo(new THREE.Vector3(1, 1, 0)) > 1e-10 ||
    head
      .getWorldQuaternion(new THREE.Quaternion())
      .angleTo(new THREE.Quaternion()) > 1e-7
  )
    findings.push("absolute child pose was composed twice");
  if (
    detail
      .getWorldPosition(new THREE.Vector3())
      .distanceTo(new THREE.Vector3(1, 1.1, 0)) > 1e-10 ||
    detail.position.y !== 0.1
  )
    findings.push("unlisted detail pose changed");
  try {
    apply({
      absent: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    });
    findings.push("missing display bone was accepted");
  } catch {}
  const scaled: THREE.Group = new THREE.Group();
  const compensated: THREE.Bone = new THREE.Bone();
  scaled.scale.set(2, 1, 1);
  compensated.scale.set(0.5, 1, 1);
  scaled.add(compensated);
  const scaledModel: IAutoMovieModelObject = {
    object: scaled,
    bones: new Map([["head", compensated]]),
    parts: new Map(),
  };
  let refused: boolean = false;
  try {
    createAutoMoviePhysicalPoseAdapter(scaledModel)({
      head: {
        position: { x: 1, y: 0, z: 0 },
        rotation: {
          x: 0,
          y: 0,
          z: Math.sin(Math.PI / 8),
          w: Math.cos(Math.PI / 8),
        },
      },
    });
  } catch {
    refused = true;
  }
  if (
    !refused ||
    compensated.position.length() !== 0 ||
    compensated.quaternion.angleTo(new THREE.Quaternion()) > 1e-12
  )
    findings.push(
      "compensated scaled ancestry was admitted or partially applied",
    );
  TestValidator.equals("physical display frame conversion", findings, []);
}
