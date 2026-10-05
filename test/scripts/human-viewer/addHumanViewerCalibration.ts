import * as THREE from "three";

import { humanViewerCalibrationRig } from "./humanViewerCalibrationRig";

/** The name that identifies the rig inside a displayed model group. */
const HUMAN_VIEWER_CALIBRATION_NAME = "calibration-rig";

/**
 * Put the hand-typed calibration spheres into a displayed model group, or
 * take them out. Any earlier rig is removed first, so the cached group never
 * carries two and a frame without `calibrate` never carries one. The spheres
 * use unlit basic materials that opt out of tone mapping and global material
 * overrides. The auxiliary group is excluded from subject parts, bounds,
 * isolation and manual outline replacements by the product observation owner.
 * The rig is added after camera framing and never changes that measured basis.
 *
 * @evidence contracts/common.md#principled-implementation Basic materials preserve the independent colour keys under global overrides and the auxiliary group stays outside subject operations.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the rig's presence in a group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds fixed independent geometry and never alters the subject or its numerical cache.
 * @evidence contracts/common.md#meaningful-documentation States ordering with framing, lighting independence and removal.
 * @evidence contracts/modeling.md#emitted-geometry Five spheres of fixed 16 by 12 segment count, independent of any subject.
 */
export function addHumanViewerCalibration(
  root: THREE.Object3D,
  present: boolean,
): THREE.Group | null {
  for (const old of root.children.filter(
    (child) => child.name === HUMAN_VIEWER_CALIBRATION_NAME,
  )) {
    root.remove(old);
    old.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
  }
  if (!present) return null;
  const rig = new THREE.Group();
  rig.name = HUMAN_VIEWER_CALIBRATION_NAME;
  rig.userData.humanObservationAuxiliary = true;
  for (const marker of humanViewerCalibrationRig) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(marker.radius, 16, 12),
      new THREE.MeshBasicMaterial({
        // The studio tone-maps every lit surface; the rig opts out so its colours stay pure.
        toneMapped: false,
        allowOverride: false,
        color: new THREE.Color(
          marker.color[0] / 255,
          marker.color[1] / 255,
          marker.color[2] / 255,
        ),
      }),
    );
    mesh.name = marker.name;
    mesh.position.set(marker.position[0], marker.position[1], marker.position[2]);
    rig.add(mesh);
  }
  root.add(rig);
  return rig;
}
