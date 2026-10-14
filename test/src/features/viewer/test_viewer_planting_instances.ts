import type { IAutoMoviePlantingArrangement, IAutoMoviePlantingBranch, IAutoMoviePlantingDomain, IAutoMoviePlantingLeaf, IAutoMoviePlantingPlacement, IAutoMoviePlantingState } from "@automovie/interface";
import { arrangePlantingCluster, growPlanting } from "@automovie/engine";
import { buildPlantingObject } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose, qclose, vclose } from "../internal/predicates";
import { plantingCluster, plantingRecipe } from "../internal/softFixtures";

const FOLIAGE: { density: number; minLevel: number; size: { x: number; y: number; z: number; }; scaleJitter: number; rollJitter: number; } = {
  density: 4,
  minLevel: 1,
  size: { x: 0.05, y: 0.125, z: 0.05 },
  scaleJitter: 0,
  rollJitter: 0,
};

/**
 * A planting cluster projects into native instanced batches whose stored matrices compose each member transform with its branch or leaf transform.
 *
 * A nonempty bed with foliage has one branch batch and one leaf batch, with instance counts of members times the respective part population. This checks the compact representation rather than observing camera-dependent native draw submissions.
 *
 * Independent matrix composition checks full translation, rotation and per-axis scale; a nonuniform parent can shear a rotated leaf, so the composed matrix is checked before relying on a decomposition. Float32 instance-buffer rounding determines the tolerance, while Engine inputs remain double precision; no GPU has been acquired here.
 *
 * Scenarios:
 *
 * 1. The group holds exactly two instanced meshes, with instance counts equal to `members × branches` and `members × leaves`.
 * 2. The first branch instance decomposes to the first member's transform composed with the branch's own: the midpoint of the trunk, the rotation carrying `+y` onto the trunk axis, and the mean radius by the length.
 * 3. The first leaf matrix equals member times leaf, while the leaf's own matrix round-trips its derived transform. The composed matrix is checked directly because a rotated child beneath nonuniform parent scale can produce shear.
 * 4. Every instance matrix is finite and every batch reports a bounding sphere, so nothing is culled against an unset volume.
 * 5. A branch cut to nothing retains its instance slot with zero height and a defined axis.
 * 6. A bare structure with no foliage rule produces no leaf batch at all rather than an empty one, and disposing releases what the object created while leaving a borrowed material alone.
 * 7. A structure that never emerged draws nothing: the batch is hidden and its bounding sphere is a point, rather than the empty sphere of radius `-Infinity` that computing bounds over zero instances would leave for a camera to cull against.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual branch/leaf batches, reads matrices/bounds/counts and retires returned owners; catches lost per-axis transforms, skipped pruned slots, invalid empty bounds and retirement of supplied materials.
 * @evidence contracts/testing.md#independent-expectations Independent matrix composition and hand-derived branch midpoint/radius/length define values within Float32 tolerance. Engine plant derivation supplies input rather than an independent botanical oracle, and dispose events count public attempts without certifying GPU release.
 * @evidence contracts/testing.md#distinguishing-cases Covers branches/leaves, nonuniform/sheared composition, pruned zero-length slots, bare foliage, dormant populations and borrowed lifetime; placement derivation and observed pixels are separate obligations.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit reuses existing generic planting fixtures and maintained source with CPU-side Three objects, disposes local owners and starts no renderer, browser, native process or new asset.
 */
export function test_viewer_planting_instances(): void {
  const domain: IAutoMoviePlantingDomain = plantingRecipe({ foliage: FOLIAGE });
  const plant: IAutoMoviePlantingState = growPlanting(domain);
  const arrangement: IAutoMoviePlantingArrangement = arrangePlantingCluster(plantingCluster());
  const object: ReturnType<typeof buildPlantingObject> = buildPlantingObject({ plant, arrangement });

  TestValidator.equals(
    "the cluster stores one branch batch and one leaf batch with the declared instance counts",
    {
      children: object.object.children.length,
      branches: object.branchCount,
      leaves: object.leafCount,
      branchInstances: object.branches.count,
      leafInstances: object.leaves?.count ?? -1,
      instancedMeshes: object.object.children.filter(
        (child: THREE.Object3D<THREE.Object3DEventMap>): boolean => child instanceof THREE.InstancedMesh,
      ).length,
    },
    {
      children: 2,
      branches: arrangement.placements.length * plant.branches.length,
      leaves: arrangement.placements.length * plant.leaves.length,
      branchInstances: arrangement.placements.length * plant.branches.length,
      leafInstances: arrangement.placements.length * plant.leaves.length,
      instancedMeshes: 2,
    },
  );

  const member: IAutoMoviePlantingPlacement = arrangement.placements[0];
  const trunk: IAutoMoviePlantingBranch = plant.branches[0];
  const matrix: THREE.Matrix4 = new THREE.Matrix4();
  object.branches.getMatrixAt(0, matrix);
  const translation: THREE.Vector3 = new THREE.Vector3();
  const rotation: THREE.Quaternion = new THREE.Quaternion();
  const scale: THREE.Vector3 = new THREE.Vector3();
  matrix.decompose(translation, rotation, scale);
  const expected: THREE.Matrix4 = new THREE.Matrix4()
    .compose(
      new THREE.Vector3(
        member.translation.x,
        member.translation.y,
        member.translation.z,
      ),
      new THREE.Quaternion(
        member.rotation.x,
        member.rotation.y,
        member.rotation.z,
        member.rotation.w,
      ),
      new THREE.Vector3(member.scale.x, member.scale.y, member.scale.z),
    )
    .multiply(
      new THREE.Matrix4().compose(
        new THREE.Vector3(
          (trunk.start.x + trunk.end.x) / 2,
          (trunk.start.y + trunk.end.y) / 2,
          (trunk.start.z + trunk.end.z) / 2,
        ),
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(
            trunk.end.x - trunk.start.x,
            trunk.end.y - trunk.start.y,
            trunk.end.z - trunk.start.z,
          ).normalize(),
        ),
        new THREE.Vector3(
          (trunk.radiusStart + trunk.radiusEnd) / 2,
          1,
          (trunk.radiusStart + trunk.radiusEnd) / 2,
        ),
      ),
    );
  const wantTranslation: THREE.Vector3 = new THREE.Vector3();
  const wantRotation: THREE.Quaternion = new THREE.Quaternion();
  const wantScale: THREE.Vector3 = new THREE.Vector3();
  expected.decompose(wantTranslation, wantRotation, wantScale);
  TestValidator.equals(
    "a branch instance is the member's transform composed with the branch's",
    namedFacts([
      ["translation", (): boolean => vclose(translation, wantTranslation, 1e-5)],
      ["rotation", (): boolean => qclose(rotation, wantRotation, 1e-5)],
      [
        "scaleY",
        (): boolean =>
          nclose(
            scale.y,
            member.scale.y *
              Math.sqrt(
                (trunk.end.x - trunk.start.x) ** 2 +
                  (trunk.end.y - trunk.start.y) ** 2 +
                  (trunk.end.z - trunk.start.z) ** 2,
              ),
            1e-5,
          ),
      ],
      [
        "scaleX",
        (): boolean =>
          nclose(
            scale.x,
            member.scale.x * ((trunk.radiusStart + trunk.radiusEnd) / 2),
            1e-5,
          ),
      ],
      ["nonUniform", (): boolean => !nclose(scale.x, scale.y, 0) && !nclose(scale.y, scale.z, 0)],
    ]),
    {
      translation: true,
      rotation: true,
      scaleY: true,
      scaleX: true,
      nonUniform: true,
    },
  );

  const leaf: IAutoMoviePlantingLeaf = plant.leaves[0];
  const leafMatrix: THREE.Matrix4 = new THREE.Matrix4();
  object.leaves?.getMatrixAt(0, leafMatrix);
  const leafLocal: THREE.Matrix4 = new THREE.Matrix4().compose(
    new THREE.Vector3(
      leaf.translation.x,
      leaf.translation.y,
      leaf.translation.z,
    ),
    new THREE.Quaternion(
      leaf.rotation.x,
      leaf.rotation.y,
      leaf.rotation.z,
      leaf.rotation.w,
    ),
    new THREE.Vector3(leaf.scale.x, leaf.scale.y, leaf.scale.z),
  );
  const leafExpected: THREE.Matrix4 = new THREE.Matrix4()
    .compose(
      new THREE.Vector3(
        member.translation.x,
        member.translation.y,
        member.translation.z,
      ),
      new THREE.Quaternion(
        member.rotation.x,
        member.rotation.y,
        member.rotation.z,
        member.rotation.w,
      ),
      new THREE.Vector3(member.scale.x, member.scale.y, member.scale.z),
    )
    .multiply(leafLocal);
  const backTranslation: THREE.Vector3 = new THREE.Vector3();
  const backRotation: THREE.Quaternion = new THREE.Quaternion();
  const backScale: THREE.Vector3 = new THREE.Vector3();
  leafLocal.decompose(backTranslation, backRotation, backScale);
  TestValidator.equals(
    "a leaf instance is the exact composition of two full transforms",
    namedFacts([
      [
        "elements",
        (): boolean =>
          leafMatrix.elements.every((value: number, index: number): boolean =>
            nclose(value, leafExpected.elements[index], 1e-5),
          ),
      ],
      [
        "localRoundTrip",
        (): boolean =>
          vclose(backTranslation, leaf.translation, 1e-12) &&
          qclose(backRotation, leaf.rotation, 1e-12) &&
          vclose(backScale, leaf.scale, 1e-12),
      ],
      ["perAxis", (): boolean => !nclose(leaf.scale.x, leaf.scale.y, 0)],
      [
        "shearedByDesign",
        (): boolean => {
          const scale: THREE.Vector3 = new THREE.Vector3();
          leafMatrix.decompose(
            new THREE.Vector3(),
            new THREE.Quaternion(),
            scale,
          );
          return nclose(scale.x, member.scale.x * leaf.scale.x, 1e-5) === false;
        },
      ],
    ]),
    {
      elements: true,
      localRoundTrip: true,
      perAxis: true,
      shearedByDesign: true,
    },
  );

  TestValidator.equals(
    "every instance is finite and every batch is bounded",
    namedFacts([
      [
        "branches",
        (): boolean =>
          Array.from(object.branches.instanceMatrix.array).every((value: number): boolean =>
            Number.isFinite(value),
          ),
      ],
      [
        "leaves",
        (): boolean =>
          Array.from(object.leaves?.instanceMatrix.array ?? []).every((value: number): boolean =>
            Number.isFinite(value),
          ),
      ],
      ["branchBounds", (): boolean => object.branches.boundingSphere !== null],
      ["leafBounds", (): boolean => (object.leaves?.boundingSphere ?? null) !== null],
      ["cluster", (): boolean => object.object.userData.cluster === "atrium-bed"],
      ["stage", (): boolean => object.object.userData.stage === 1],
      ["rejected", (): boolean => object.object.userData.rejected === 0],
    ]),
    {
      branches: true,
      leaves: true,
      branchBounds: true,
      leafBounds: true,
      cluster: true,
      stage: true,
      rejected: true,
    },
  );

  const borrowed: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  let borrowedDisposals: number = 0;
  borrowed.addEventListener("dispose", (): void => { ++borrowedDisposals; });
  const bare: ReturnType<typeof buildPlantingObject> = buildPlantingObject({
    plant: growPlanting(plantingRecipe()),
    arrangement,
    branchMaterial: borrowed,
  });
  const cut: IAutoMoviePlantingState = growPlanting(
    plantingRecipe({
      structure: { ...plantingRecipe().structure, length: 2 },
      pruning: {
        kind: "box",
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      },
    }),
  );
  const pruned: ReturnType<typeof buildPlantingObject> = buildPlantingObject({ plant: cut, arrangement });
  const stub: THREE.Matrix4 = new THREE.Matrix4();
  pruned.branches.getMatrixAt(cut.branches.length - 1, stub);
  TestValidator.equals(
    "a branch pruned to nothing keeps its slot and collapses instead of skewing",
    namedFacts([
      [
        "zeroLength",
        (): boolean => {
          const tip: IAutoMoviePlantingBranch = cut.branches[cut.branches.length - 1];
          return vclose(tip.start, tip.end, 0);
        },
      ],
      ["finite", (): boolean => stub.elements.every((value: number): boolean => Number.isFinite(value))],
      [
        "collapsed",
        (): boolean => {
          // A singular matrix has no unique rotation/scale decomposition; its Y column measures the stored branch-axis extent.
          return nclose(Math.hypot(stub.elements[4], stub.elements[5], stub.elements[6]), 0, 0);
        },
      ],
      [
        "slots",
        (): boolean =>
          pruned.branchCount ===
          arrangement.placements.length * cut.branches.length,
      ],
    ]),
    { zeroLength: true, finite: true, collapsed: true, slots: true },
  );
  pruned.dispose();

  TestValidator.equals(
    "a bare structure has no leaf batch, and a borrowed material is left alone",
    namedFacts([
      ["noLeaves", (): boolean => bare.leaves === null && bare.leafCount === 0],
      ["oneChild", (): boolean => bare.object.children.length === 1],
      ["borrowed", (): boolean => bare.branches.material === borrowed],
    ]),
    { noLeaves: true, oneChild: true, borrowed: true },
  );
  const dormant: ReturnType<typeof buildPlantingObject> = buildPlantingObject({
    plant: growPlanting(
      plantingRecipe({ growth: { stage: 0, onset: 0.25 }, foliage: FOLIAGE }),
    ),
    arrangement,
  });
  TestValidator.equals(
    "a structure that never emerged is hidden and bounded at a point",
    namedFacts([
      ["branchCount", (): boolean => dormant.branchCount === 0],
      ["leafCount", (): boolean => dormant.leafCount === 0],
      ["hidden", (): boolean => dormant.branches.visible === false],
      ["bounded", (): boolean => dormant.branches.boundingSphere !== null && nclose(dormant.branches.boundingSphere.radius, 0, 0)],
      ["noLeafBatch", (): boolean => dormant.leaves === null],
      ["oneChild", (): boolean => dormant.object.children.length === 1],
    ]),
    {
      branchCount: true,
      leafCount: true,
      hidden: true,
      bounded: true,
      noLeafBatch: true,
      oneChild: true,
    },
  );
  dormant.dispose();

  bare.dispose();
  TestValidator.equals("planting retirement leaves its supplied material borrowed", borrowedDisposals, 0);
  object.dispose();
  borrowed.dispose();
  TestValidator.equals("the supplied material's own caller retires it once", borrowedDisposals, 1);
}
