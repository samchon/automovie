import {
  type IAutoMovieModelObject,
  createAutoMoviePhysicalPoseAdapter,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Absolute physical display conversion.
 *
 * Scenarios:
 * 1. Rigid rotated parents preserve solved world frames and authored detail.
 * 2. Compensating local scales cannot conceal a nonuniform ancestor.
 * 3. Invalid display admission leaves the bone's authored local pose intact.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `IAutoMovieModelObject`, `createAutoMoviePhysicalPoseAdapter` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 3 numbered scenarios (first: Rigid rotated parents preserve solved world frames and authored detail.; last: Invalid display admission leaves the bone's authored local pose intact.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Rigid rotated parents preserve solved world frames and authored detail.; last: Invalid display admission leaves the bone's authored local pose intact.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_viewer_pose`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Rigid rotated parents preserve solved world frames and authored detail.).
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
