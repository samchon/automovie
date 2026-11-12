import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieSkinnedMesh,
  applyDualQuaternionSkinning,
  createAutoMovieSurfaceAppearance,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

/**
 * Local appearance follows the actual posed DQ skin, inverts compression, preserves shaders and restores on seek. Empty/sparse RGB, Float32 overflow and duplicate resource ownership refuse; representable HDR multipliers remain legal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMovieSkinnedMesh`, `createAutoMovieSurfaceAppearance`, `applyDualQuaternionSkinning` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership References process, browser or GPU host terms in its source, which this answer does not clear entered through the discoverable function `test_physical_skinned_appearance`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host as far as the scan can tell, apart from the terms noted.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Local appearance follows the actual posed DQ skin, inverts compression, preserves shaders and restores on seek) as stated in this comment.
 */
export function test_physical_skinned_appearance(): void {
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([1, 1, 0, -1, 1, 0, 1, 0, 0], 3),
  );
  geometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4),
  );
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4),
  );
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  applyDualQuaternionSkinning(material);
  const mesh: AutoMovieSkinnedMesh = new AutoMovieSkinnedMesh(
    geometry,
    material,
    "dual-quaternion",
  );
  const root: THREE.Bone = new THREE.Bone();
  const head: THREE.Bone = new THREE.Bone();
  head.position.y = 1;
  root.add(head);
  mesh.add(root);
  mesh.bind(new THREE.Skeleton([root, head]));
  head.rotation.z = Math.PI / 2;
  mesh.updateMatrixWorld(true);
  mesh.skeleton.update();
  const appearance: ReturnType<typeof createAutoMovieSurfaceAppearance> =
    createAutoMovieSurfaceAppearance({
      surfaces: [{ bone: "head", mesh }],
      space: "posed-mesh",
      sample: (
        _bone: string,
        point: IAutoMovieVector3,
        seconds: number,
      ): {
        color: [number, number, number];
        displacement: { x: number; y: number; z: number };
      } => {
        const struck: boolean =
          seconds >= 1 && Math.hypot(point.x, point.y - 2, point.z) < 0.05;
        return {
          color: struck ? [0.4, 0.2, 0.2] : [1, 1, 1],
          displacement: { x: 0, y: struck ? -0.02 : 0, z: 0 },
        };
      },
    });
  const findings: string[] = [];
  try {
    appearance.update(1);
    const posed: THREE.Vector3 = mesh.getVertexPosition(0, new THREE.Vector3());
    if (posed.distanceTo(new THREE.Vector3(0, 1.98, 0)) > 1e-6)
      findings.push(
        `compression in the displayed skin frame: ${posed.toArray()}`,
      );
    const colors: THREE.BufferAttribute = mesh.geometry.getAttribute(
      "color",
    ) as THREE.BufferAttribute;
    if (Math.abs(colors.getX(0) - 0.4) > 1e-6 || colors.getX(1) !== 1)
      findings.push("localized posed-surface color");
    const ownedMaterial: THREE.Material = mesh.material as THREE.Material;
    if (
      ownedMaterial.onBeforeCompile !== material.onBeforeCompile ||
      ownedMaterial.customProgramCacheKey() !==
        material.customProgramCacheKey() ||
      typeof ownedMaterial.userData.shaderPatches[0].apply !== "function"
    )
      findings.push("dual-quaternion shader patch ownership");
    appearance.update(0);
    if (
      mesh
        .getVertexPosition(0, new THREE.Vector3())
        .distanceTo(new THREE.Vector3(0, 2, 0)) > 1e-6 ||
      colors.getX(0) !== 1
    )
      findings.push("backward seek restores the original skin");
  } finally {
    appearance.dispose();
  }
  if (mesh.geometry !== geometry || mesh.material !== material)
    findings.push("original resource restoration");
  assert.throws(
    (): ReturnType<typeof createAutoMovieSurfaceAppearance> =>
      createAutoMovieSurfaceAppearance({
        surfaces: [
          { bone: "head", mesh },
          { bone: "second", mesh },
        ],
        sample: (): {
          color: [number, number, number];
          displacement: IAutoMovieVector3;
        } => ({ color: [1, 1, 1], displacement: { x: 0, y: 0, z: 0 } }),
      }),
    /unique mesh ownership/,
  );
  assert.equal(mesh.geometry, geometry);
  assert.equal(mesh.material, material);
  for (const attribute of ["position", "color"]) {
    const source: THREE.BufferGeometry = new THREE.BufferGeometry();
    source.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float64Array([0, 0, 0]), 3),
    );
    source.setAttribute(
      attribute,
      new THREE.BufferAttribute(new Float64Array([1e308, 0, 0]), 3),
    );
    const original: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
    const isolated: THREE.Mesh = new THREE.Mesh(source, original);
    try {
      assert.throws(
        (): ReturnType<typeof createAutoMovieSurfaceAppearance> =>
          createAutoMovieSurfaceAppearance({
            surfaces: [{ bone: "surface", mesh: isolated }],
            sample: (): {
              color: [number, number, number];
              displacement: IAutoMovieVector3;
            } => ({ color: [1, 1, 1], displacement: { x: 0, y: 0, z: 0 } }),
          }),
        /GPU f32/,
      );
      assert.equal(isolated.geometry, source);
      assert.equal(isolated.material, original);
    } finally {
      source.dispose();
      original.dispose();
    }
  }
  const invalid: { color: number[]; displacement: IAutoMovieVector3 }[] = [
    ...[[], [1, 1], [1, 1, 1, 1], new Array<number>(3), [1e308, 1, 1]].map(
      (
        color: number[],
      ): { color: number[]; displacement: IAutoMovieVector3 } => ({
        color,
        displacement: { x: 0, y: 0, z: 0 },
      }),
    ),
    { color: [1, 1, 1], displacement: { x: 1e308, y: 0, z: 0 } },
  ];
  for (const response of invalid) {
    const rejected: ReturnType<typeof createAutoMovieSurfaceAppearance> =
      createAutoMovieSurfaceAppearance({
        surfaces: [{ bone: "head", mesh }],
        sample: (): {
          color: [number, number, number];
          displacement: IAutoMovieVector3;
        } => ({
          ...response,
          color: response.color as [number, number, number],
        }),
      });
    try {
      assert.throws((): void => rejected.update(0), /surface/);
    } finally {
      rejected.dispose();
    }
    assert.equal(mesh.geometry, geometry);
    assert.equal(mesh.material, material);
  }
  const hdr: ReturnType<typeof createAutoMovieSurfaceAppearance> =
    createAutoMovieSurfaceAppearance({
      surfaces: [{ bone: "head", mesh }],
      sample: (): {
        color: [number, number, number];
        displacement: IAutoMovieVector3;
      } => ({ color: [2, 1, 1], displacement: { x: 0, y: 0, z: 0 } }),
    });
  try {
    hdr.update(0);
    assert.equal(
      (mesh.geometry.getAttribute("color") as THREE.BufferAttribute).getX(0),
      2,
    );
  } finally {
    hdr.dispose();
  }
  geometry.dispose();
  material.dispose();
  mesh.skeleton.dispose();
  TestValidator.equals(
    "all posed Human-compatible surface observations",
    findings,
    [],
  );
}
