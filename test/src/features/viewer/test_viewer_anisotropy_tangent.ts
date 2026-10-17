import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { buildModel } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { nclose } from "../internal/nclose";

/**
 * Eligible rigid anisotropic meshes receive unit tangents without replacing mapped/deforming frames.
 *
 * Scenarios:
 * 1. A very short wide strip has unit orthogonal tangent/bitangent and the authored root-tip direction.
 * 2. Mirrored UVs change handedness, not tangent length; an isotropic twin keeps its existing attribute set.
 * 3. A 90 degree position morph, skeletal binding and transformed normal/detail/overlay maps retain their derivative-frame route.
 * 4. Collapsed UVs cannot publish a zero explicit tangent as a supported unit frame.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual model builder and observes tangent publication, morph/skin route preservation, material-map registrations and unchanged source arrays; no shader or renderer method is replaced.
 * @evidence contracts/testing.md#independent-expectations A planar XY strip has normal +Z, across-card +X and root-tip +Y. Unit length and orthogonality follow from this authored frame rather than an expected image.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts extreme aspect, mirrored UVs, isotropic omission, morph/skin deformation, transformed normal/detail/overlay maps and collapsed UVs. Mapped/deforming anisotropy and rendered highlight improvement remain unproven rather than covered by the rigid fix.
 * @evidence contracts/testing.md#execution-ownership Portable native Three metadata construction without a browser, texture decode or GPU. This entry owns and disposes the built geometry and material objects.
 */
export function test_viewer_anisotropy_tangent(): void {
  const base: IAutoMovieModel = createModel();
  for (const mirrored of [false, true])
    for (const mode of [
      "rigid",
      "mapped",
      "morph",
      "skin",
      "zero-uv",
    ] as const) {
      const mapped: boolean = mode === "mapped";
      const definition: IAutoMovieMaterial = {
        ...base.materials[0]!,
        anisotropy: { strength: 0.3, rotationDeg: 90, texture: null },
        ...(mapped
          ? {
              normalTexture: {
                asset: "coarse",
                texCoord: 0 as const,
                colorSpace: "linear" as const,
                transform: {
                  offset: { x: 0, y: 0 },
                  scale: { x: 1, y: 1 },
                  rotationDeg: 90,
                },
              },
              detailNormalTexture: "detail",
              overlays: [
                {
                  baseColorTexture: "overlay",
                  blend: "multiply" as const,
                  strength: 0.5,
                },
              ],
            }
          : {}),
      };
      const part: IAutoMovieModelPart = {
        id: "strip",
        name: "strip",
        material: definition.id,
        attachedBone: null,
        transform: null,
        geometry: {
          type: "mesh",
          mesh: {
            positions: [0, 0, 0, 0.1, 0, 0, 0, 0.00001, 0, 0.1, 0.00001, 0],
            normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            uvs:
              mode === "zero-uv"
                ? new Array(8).fill(0)
                : mirrored
                  ? [0.1875, 0, 0, 0, 0.1875, 1, 0, 1]
                  : [0, 0, 0.1875, 0, 0, 1, 0.1875, 1],
            indices: [0, 1, 3, 0, 3, 2],
            skin:
              mode === "skin"
                ? {
                    joints: [base.skeleton!.bones[0]!.bone],
                    boneIndices: new Array(16).fill(0),
                    weights: Array.from(
                      { length: 16 },
                      (_: unknown, k: number): number => (k % 4 === 0 ? 1 : 0),
                    ),
                  }
                : null,
            targets:
              mode === "morph"
                ? [
                    {
                      name: "turn",
                      positions: [
                        0, 0, 0, -0.1, 0.1, 0, -0.00001, -0.00001, 0, -0.10001,
                        0.09999, 0,
                      ],
                      normals: null,
                    },
                  ]
                : undefined,
          },
        },
      };
      const original: string = JSON.stringify(part);
      for (const anisotropic of [true, false]) {
        const textures: THREE.Texture[] = [];
        const output: ReturnType<typeof buildModel> = buildModel(
          {
            ...base,
            parts: [part],
            materials: [
              {
                ...definition,
                anisotropy: anisotropic ? definition.anisotropy : undefined,
              },
            ],
          },
          (): THREE.Texture => {
            const texture: THREE.Texture = new THREE.Texture();
            textures.push(texture);
            return texture;
          },
        );
        const mesh: THREE.Mesh = output.parts.get("strip") as THREE.Mesh;
        const expected: boolean = anisotropic && mode === "rigid";
        TestValidator.predicate(
          "only eligible rigid geometry acquires tangents",
          (): boolean => mesh.geometry.hasAttribute("tangent") === expected,
        );
        if (expected) {
          const tangent:
            | THREE.BufferAttribute
            | THREE.InterleavedBufferAttribute =
            mesh.geometry.getAttribute("tangent");
          for (let k: number = 0; k < tangent.count; ++k) {
            const x: number = tangent.getX(k);
            const y: number = tangent.getY(k);
            const z: number = tangent.getZ(k);
            const sign: number = tangent.getW(k);
            TestValidator.predicate(
              "unit across-card and root-tip axes",
              (): boolean =>
                nclose(Math.hypot(x, y, z), 1, 1e-6) &&
                nclose(y, 0, 1e-6) &&
                nclose(z, 0, 1e-6) &&
                nclose(x, mirrored ? -1 : 1, 1e-6) &&
                nclose(x * sign, 1, 1e-6),
            );
          }
        }
        const material: THREE.MeshPhysicalMaterial =
          mesh.material as THREE.MeshPhysicalMaterial;
        if (mapped)
          TestValidator.predicate(
            "normal map and detail/overlay registrations retained",
            (): boolean =>
              material.normalMap !== null &&
              material
                .customProgramCacheKey()
                .includes("automovie-detail-normal") &&
              material.customProgramCacheKey().includes("automovie-overlays-"),
          );
        if (mode === "morph") {
          const position:
            | THREE.BufferAttribute
            | THREE.InterleavedBufferAttribute =
            mesh.geometry.getAttribute("position");
          const delta:
            | THREE.BufferAttribute
            | THREE.InterleavedBufferAttribute =
            mesh.geometry.morphAttributes.position![0]!;
          TestValidator.predicate(
            "actual morph turns the UV u axis",
            (): boolean =>
              nclose(position.getX(1) + delta.getX(1), 0, 1e-6) &&
              nclose(position.getY(1) + delta.getY(1), 0.1, 1e-6),
          );
        }
        TestValidator.predicate(
          "source mesh remains unchanged",
          (): boolean => JSON.stringify(part) === original,
        );
        mesh.geometry.dispose();
        material.dispose();
        if (mesh instanceof THREE.SkinnedMesh) mesh.skeleton.dispose();
        for (const texture of textures) texture.dispose();
      }
    }
}
