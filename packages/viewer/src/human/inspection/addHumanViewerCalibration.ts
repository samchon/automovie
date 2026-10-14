import * as THREE from "three";
import { collectAutoMovieOwnedResources } from "../../collectAutoMovieOwnedResources.js";
import { constructAutoMovieOwnedResources } from "../../constructAutoMovieOwnedResources.js";
import { reportAutoMovieResourceRetirement } from "../../reportAutoMovieResourceRetirement.js";

import { humanViewerCalibrationRig } from "./humanViewerCalibrationRig.js";

/** The name that identifies the rig inside a displayed model group. */
const HUMAN_VIEWER_CALIBRATION_NAME: string = "calibration-rig";

/** Failed or active ownership stays with the same displayed root. */
const retiring: WeakMap<THREE.Object3D, { resources: { dispose(): void }[]; groups: THREE.Object3D[]; error: unknown }> = new WeakMap();

/**
 * Put the hand-typed calibration spheres into a displayed model group, or take them out. Any earlier owned auxiliary rig is removed, so the cached group never carries two and a frame without `calibrate` never carries one. The spheres use unlit basic materials that opt out of tone mapping and global material overrides. The auxiliary group is excluded from subject parts, bounds, isolation and manual outline replacements by the product observation owner. The rig is added after camera framing and never changes that measured basis. User parts sharing the rig's name are untouched. Each old geometry/material retirement is attempted independently; allocation failure retires every new resource before propagating its cause. Disposal success is not a physical GPU-memory measurement.
 *
 * @evidence contracts/common.md#principled-implementation The auxiliary tag and reserved rig name identify owned calibration groups; authored metre-space markers use unlit, non-tone-mapped spheres without changing numerical model geometry.
 * @evidence contracts/common.md#clear-and-simple-design Shared owned-resource construction and collection delimit allocation/retirement; a weak displayed-root record retains active or failed groups/resources/cause while the observation owner owns auxiliary exclusion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Calibration coordinates remain independent camera-observation inputs; same-named user parts are not deleted, cleanup errors cannot skip neighboring owners and failed retirement refuses same-root reacquisition without retry.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains auxiliary exclusion, framing order, ownership identity, independent retirement attempts and the limit of disposal evidence.
 * @evidence contracts/performance.md#efficient-algorithms The function scans C immediate children and traverses R retired rig nodes once, then builds K fixed-table markers with fixed sphere resolution; bookkeeping is O(C + R + K).
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Calibration toggles replace an owned display auxiliary; disposed geometry/material objects cannot be reused as a new rig.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Old resources are collected before callbacks mutate their graph and attempted once by identity; new acquisitions register immediately. Failed cleanup keeps groups/resources/cause under the weak root key, healthy rollback withdraws that record, and success transfers resources to the displayed group.
 */
export function addHumanViewerCalibration(
  root: THREE.Object3D,
  present: boolean,
): THREE.Group | null {
  const previous: { resources: { dispose(): void }[]; groups: THREE.Object3D[]; error: unknown } | undefined = retiring.get(root);
  if (previous !== undefined) throw previous.error;
  const old: THREE.Object3D[] = root.children.filter(
    (child: THREE.Object3D): boolean => child.name === HUMAN_VIEWER_CALIBRATION_NAME && child.userData.humanObservationAuxiliary === true,
  );
  const retired: Set<{ dispose(): void }> = new Set<{ dispose(): void }>(
    old.flatMap((group: THREE.Object3D): readonly { dispose(): void }[] => collectAutoMovieOwnedResources(group)),
  );
  const retirement: { resources: { dispose(): void }[]; groups: THREE.Object3D[]; error: unknown } = {
    resources: [...retired], groups: old, error: new Error("Calibration resources are still being retired."),
  };
  retiring.set(root, retirement);
  try { reportAutoMovieResourceRetirement([
    ...old.map((group: THREE.Object3D): (() => void) => (): void => { root.remove(group); }),
    ...[...retired].map((resource: { dispose(): void }): (() => void) => (): void => resource.dispose()),
  ]); retiring.delete(root); }
  catch (error) { retirement.error = error; throw error; }
  if (!present) return null;
  const acquisition: { resources: { dispose(): void }[]; groups: THREE.Object3D[]; error: unknown } = {
    resources: [], groups: [], error: new Error("Calibration resources are still being acquired."),
  };
  retiring.set(root, acquisition);
  let constructionFailure: { error: unknown } | undefined;
  try {
  const result: THREE.Group = constructAutoMovieOwnedResources((register: <Resource extends { dispose(): void }>(resource: Resource) => Resource): THREE.Group => {
    const own: <Resource extends { dispose(): void }>(resource: Resource) => Resource = <Resource extends { dispose(): void }>(resource: Resource): Resource => {
      acquisition.resources.push(resource);
      return register(resource);
    };
    try {
    const rig: THREE.Group = new THREE.Group();
    acquisition.groups.push(rig);
    own({ dispose: (): void => { rig.removeFromParent(); } });
    rig.name = HUMAN_VIEWER_CALIBRATION_NAME;
    rig.userData.humanObservationAuxiliary = true;
    for (const marker of humanViewerCalibrationRig) {
      const geometry: THREE.SphereGeometry = own(new THREE.SphereGeometry(marker.radius, 16, 12));
      const material: THREE.MeshBasicMaterial = own(new THREE.MeshBasicMaterial({
        // The studio tone-maps every lit surface; the rig opts out so its colours stay pure.
        toneMapped: false,
        allowOverride: false,
        color: new THREE.Color(
          marker.color[0] / 255,
          marker.color[1] / 255,
          marker.color[2] / 255,
        ),
      }));
      const mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> = new THREE.Mesh(geometry, material);
      mesh.name = marker.name;
      mesh.position.set(marker.position[0], marker.position[1], marker.position[2]);
      rig.add(mesh);
    }
    root.add(rig);
    return rig;
    } catch (error) { constructionFailure = { error }; throw error; }
  });
  retiring.delete(root);
  return result;
  } catch (error) {
    // The shared constructor preserves the exact primary after healthy rollback;
    // an added cleanup cause produces a different aggregate and remains owned.
    if (constructionFailure !== undefined && error !== constructionFailure.error)
      acquisition.error = error;
    else retiring.delete(root);
    throw error;
  }
}
