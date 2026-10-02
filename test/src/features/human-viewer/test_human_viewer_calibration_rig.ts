import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import {
  HUMAN_VIEWER_CALIBRATION_NAME,
  addHumanViewerCalibration,
} from "../../../scripts/human-viewer/addHumanViewerCalibration";
import { humanViewerCalibrationRig } from "../../../scripts/human-viewer/humanViewerCalibrationRig";

/**
 * The rig enters a model group once, at its typed coordinates, and leaves it.
 *
 * Scenarios:
 * 1. Adding puts one rig group with five meshes at the typed positions and
 *    unlit pure colours into a group that already holds a subject mesh.
 * 2. Adding again replaces it rather than doubling it.
 * 3. Removing leaves only the subject, and removing from a group without a rig
 *    is a no-op that returns null.
 */
export const test_human_viewer_calibration_rig = (): void => {
  const root = new THREE.Group();
  const subject = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  subject.name = "Human/skin";
  root.add(subject);
  const rig = addHumanViewerCalibration(root, true)!;
  TestValidator.equals(
    "one rig",
    root.children.filter((child) => child.name === HUMAN_VIEWER_CALIBRATION_NAME).length,
    1,
  );
  TestValidator.equals("five spheres", rig.children.length, 5);
  const first = rig.children[0] as THREE.Mesh;
  TestValidator.equals("typed position", first.position.toArray(), [...humanViewerCalibrationRig[0].position]);
  const material = first.material as THREE.MeshBasicMaterial;
  TestValidator.equals("opts out of tone mapping", material.toneMapped, false);
  TestValidator.equals("pure colour", [material.color.r, material.color.g, material.color.b], [1, 0, 0]);
  addHumanViewerCalibration(root, true);
  TestValidator.equals("replaced not doubled", root.children.length, 2);
  TestValidator.equals("removed", addHumanViewerCalibration(root, false), null);
  TestValidator.equals(
    "only the subject remains",
    root.children.map((child) => child.name),
    ["Human/skin"],
  );
  TestValidator.equals("no-op removal", addHumanViewerCalibration(root, false), null);
};
