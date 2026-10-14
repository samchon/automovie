import * as THREE from "three";

import type { IAutoMoviePlantingObject } from "./IAutoMoviePlantingObject.js";
import type { IBuildPlantingObjectProps } from "./IBuildPlantingObjectProps.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Project one derived plant and its arrangement into GPU-instanced batches.
 *
 * A nonempty bed with branches and leaves uses two instanced batches: one for every branch of every member and one for every leaf. A leafless bed has only the branch batch, and an empty bed's branch batch is hidden. Deriving one prototype structure and placements avoids duplicating a scene subtree per plant; actual draw submission remains the renderer's decision.
 *
 * Every instance matrix is the placement's full transform composed with the branch or leaf's own translation, unit quaternion and per-axis scale on both sides, composed as `Matrix4`. Nothing is reduced to a yaw or to one uniform number: a member scaled `(1.2, 0.9, 1.2)` is drawn with that same per-axis scale.
 *
 * A structure that has not emerged, or a bed whose every slot was refused, is a hidden batch bounded at a point rather than an empty one bounded by nothing: a bounding sphere computed over zero instances has a radius of `-Infinity`, and a camera would cull against it.
 *
 * A branch is a unit cylinder scaled to `(r, length, r)` with `r` the mean of its two radii and rotated from `+y` onto its own axis. The taper a segment carries in the derived structure is therefore averaged, which is the stated cost of drawing every branch in one instanced batch; the derived record keeps both radii for anything that needs them. A leaf is a unit plane scaled by its per-axis size, which is exactly the prototype the derivation emitted.
 *
 * @evidence contracts/common.md#principled-implementation Composes each full member transform with local branch/leaf transforms into two prototype batches, preserving radius averaging, zero axial scale for zero-length branches and empty-batch point bounds. Positive-radius cylinder caps can remain planar at zero length; this adapter does not establish that such a slot is invisible.
 * @evidence contracts/common.md#clear-and-simple-design The engine owns derivation/placement admission while this projection owns generated geometry/default materials and two finite acquisition lists for independent retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mean branch radii are an explicitly lossy taper approximation, leaf transforms remain unchanged and no new segmentation/shape value is tuned to a fixture or unobserved visual target.
 * @evidence contracts/common.md#meaningful-documentation Documentation states transform units/ordering, averaged taper cost, degenerate/empty behavior, borrowed materials and caller-owned scene withdrawal.
 * @evidence contracts/performance.md#efficient-algorithms For P placements, B branches and L leaves, matrix/bounds work is O(P*(B+L)) with instance matrices of that size; scratch vectors/matrices and at most two geometries are reused within construction.
 * @evidence contracts/performance.md#reuse-equivalent-work Members reuse one branch cylinder and one leaf plane with per-instance matrices instead of cloned scene trees; separate cluster construction is an owned effect and not cached by plant name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Created geometries/defaults/instance owners are registered immediately and independently retired after partial failure or explicit sticky disposal; supplied materials are borrowed and population/instance bytes have no independent cap in this adapter.
 */
export const buildPlantingObject: (props: IBuildPlantingObjectProps) => IAutoMoviePlantingObject = (props: IBuildPlantingObjectProps): IAutoMoviePlantingObject => {
  const geometryDisposals: (() => void)[] = [];
  const instanceDisposals: (() => void)[] = [];
  const dispose: () => void = restoreAutoMovieRenderModeOnce((): void => {
    restoreAutoMovieRenderModeState([...geometryDisposals, ...instanceDisposals]);
  });
  try {
  const group: THREE.Group = new THREE.Group();
  group.name = `planting:${props.arrangement.cluster}`;

  const branchGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(
    1,
    1,
    1,
    props.branchSegments ?? 6,
    1,
    false,
  );
  geometryDisposals.push((): void => { branchGeometry.dispose(); });
  const ownedBranchMaterial: boolean = props.branchMaterial === undefined;
  const branchMaterial: THREE.Material =
    props.branchMaterial ??
    new THREE.MeshStandardMaterial({
      color: 0x6b5136,
      roughness: 0.9,
      metalness: 0,
    });
  if (ownedBranchMaterial) geometryDisposals.push((): void => { branchMaterial.dispose(); });
  const branchCount: number =
    props.arrangement.placements.length * props.plant.branches.length;
  const branches: THREE.InstancedMesh = new THREE.InstancedMesh(
    branchGeometry,
    branchMaterial,
    branchCount,
  );
  instanceDisposals.push((): void => { branches.dispose(); });
  branches.name = `planting-branches:${props.arrangement.cluster}`;

  const leafCount: number =
    props.arrangement.placements.length * props.plant.leaves.length;
  const ownedLeafMaterial: boolean = leafCount > 0 && props.leafMaterial === undefined;
  const foliage: { geometry: THREE.PlaneGeometry; material: THREE.Material } | null =
    leafCount === 0
      ? null
      : ((): { geometry: THREE.PlaneGeometry; material: THREE.Material } => {
          const geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
          geometryDisposals.push((): void => { geometry.dispose(); });
          const material: THREE.Material =
            props.leafMaterial ??
            new THREE.MeshStandardMaterial({
              color: 0x4c7a3a,
              roughness: 0.7,
              metalness: 0,
              side: THREE.DoubleSide,
            });
          if (ownedLeafMaterial) geometryDisposals.push((): void => { material.dispose(); });
          return { geometry, material };
        })();
  const leaves: THREE.InstancedMesh | null =
    foliage === null
      ? null
      : new THREE.InstancedMesh(foliage.geometry, foliage.material, leafCount);
  if (leaves !== null) instanceDisposals.push((): void => { leaves.dispose(); });
  if (leaves !== null)
    leaves.name = `planting-leaves:${props.arrangement.cluster}`;

  const placement: THREE.Matrix4 = new THREE.Matrix4();
  const local: THREE.Matrix4 = new THREE.Matrix4();
  const world: THREE.Matrix4 = new THREE.Matrix4();
  const translation: THREE.Vector3 = new THREE.Vector3();
  const rotation: THREE.Quaternion = new THREE.Quaternion();
  const scale: THREE.Vector3 = new THREE.Vector3();
  const axis: THREE.Vector3 = new THREE.Vector3();
  const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  let branchSlot: number = 0;
  let leafSlot: number = 0;
  for (const member of props.arrangement.placements) {
    placement.compose(
      translation.set(
        member.translation.x,
        member.translation.y,
        member.translation.z,
      ),
      rotation.set(
        member.rotation.x,
        member.rotation.y,
        member.rotation.z,
        member.rotation.w,
      ),
      scale.set(member.scale.x, member.scale.y, member.scale.z),
    );
    for (const branch of props.plant.branches) {
      axis.set(
        branch.end.x - branch.start.x,
        branch.end.y - branch.start.y,
        branch.end.z - branch.start.z,
      );
      const length: number = axis.length();
      const radius: number = (branch.radiusStart + branch.radiusEnd) / 2;
      // Keep a zero-length branch's slot identity with zero axial scale. A
      // positive radial scale can leave coincident planar caps; this is not a
      // guaranteed invisible instance or a nonsingular normal transform.
      local.compose(
        translation.set(
          (branch.start.x + branch.end.x) / 2,
          (branch.start.y + branch.end.y) / 2,
          (branch.start.z + branch.end.z) / 2,
        ),
        length === 0
          ? rotation.identity()
          : rotation.setFromUnitVectors(up, axis.divideScalar(length)),
        scale.set(radius, length, radius),
      );
      branches.setMatrixAt(
        branchSlot,
        world.multiplyMatrices(placement, local),
      );
      ++branchSlot;
    }
    if (leaves === null) continue;
    for (const leaf of props.plant.leaves) {
      local.compose(
        translation.set(
          leaf.translation.x,
          leaf.translation.y,
          leaf.translation.z,
        ),
        rotation.set(
          leaf.rotation.x,
          leaf.rotation.y,
          leaf.rotation.z,
          leaf.rotation.w,
        ),
        scale.set(leaf.scale.x, leaf.scale.y, leaf.scale.z),
      );
      leaves.setMatrixAt(leafSlot, world.multiplyMatrices(placement, local));
      ++leafSlot;
    }
  }
  branches.instanceMatrix.needsUpdate = true;
  // A plant that has not emerged, or a bed whose every slot was refused, draws
  // no instance at all. `computeBoundingSphere` over zero instances leaves an
  // empty box behind and a sphere of radius `-Infinity`, which a camera culls
  // against as though it were a volume; the batch is hidden and bounded at a
  // point instead.
  if (branchCount === 0) {
    branches.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0);
    branches.visible = false;
  } else branches.computeBoundingSphere();
  group.add(branches);
  if (leaves !== null) {
    leaves.instanceMatrix.needsUpdate = true;
    leaves.computeBoundingSphere();
    group.add(leaves);
  }
  group.userData.cluster = props.arrangement.cluster;
  group.userData.domain = props.plant.domain;
  group.userData.stage = props.plant.stage;
  group.userData.rejected = props.arrangement.rejected;

  return {
    object: group,
    branches,
    leaves,
    branchCount,
    leafCount,
    dispose,
  };
  } catch (error) {
    restoreAutoMovieRenderModeState([dispose], { error });
  }
};
