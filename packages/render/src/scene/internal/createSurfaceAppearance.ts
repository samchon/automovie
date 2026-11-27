import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { AutoMovieRenderSurfaceAppearance } from "../AutoMovieRenderSurfaceAppearance";
import { AutoMovieRenderSkinnedMesh } from "../AutoMovieRenderSkinnedMesh";
import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind";
import { createSurfaceVertexAdapter } from "./createSurfaceVertexAdapter";
import { readBufferAttribute } from "./readBufferAttribute";

/*
 * Apply provider-local color and compression to actual vertices, with owned
 * resources.
 */
export function createSurfaceAppearance(
  input: AutoMovieRenderSurfaceAppearance.ICreateSurfaceAppearanceProps,
): AutoMovieRenderSurfaceAppearance.ISurfaceAppearanceResult {
  const meshes: Set<THREE.Mesh> = new Set();
  for (const surface of input.surfaces) {
    if (meshes.has(surface.mesh))
      throw new Error("Surface appearance requires unique mesh ownership");
    meshes.add(surface.mesh);
  }
  const records: {
    bone: string;
    mesh: THREE.Mesh;
    originalGeometry: THREE.BufferGeometry;
    originalMaterial: THREE.Material | THREE.Material[];
    geometry: THREE.BufferGeometry;
    materials: THREE.Material[];
    positions: Float32Array;
    colors: Float32Array;
    moved: boolean;
    adapter: ReturnType<typeof createSurfaceVertexAdapter>;
  }[] = [];
  let disposed: boolean = false;
  const dispose: () => void = (): void => {
    if (disposed) return;
    disposed = true;
    for (const record of records) {
      if (record.mesh.geometry === record.geometry)
        record.mesh.geometry = record.originalGeometry;
      if (
        record.mesh.material === record.materials ||
        record.mesh.material === record.materials[0]
      )
        record.mesh.material = record.originalMaterial;
      record.geometry.dispose();
      for (const material of record.materials) material.dispose();
    }
  };
  try {
    for (const surface of input.surfaces) {
      const originalGeometry: THREE.BufferGeometry = surface.mesh.geometry;
      const originalMaterial: THREE.Material | THREE.Material[] =
        surface.mesh.material;
      const source: THREE.Material[] = [originalMaterial].flat();
      const position:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute
        | undefined = originalGeometry.getAttribute("position");
      if (!position)
        throw new Error("Surface appearance requires actual vertex positions");
      const adapter: ReturnType<typeof createSurfaceVertexAdapter> =
        createSurfaceVertexAdapter(surface.mesh);
      const sourcePositions: number[] = Array.from(
        { length: position.count * 3 },
        (_: unknown, index: number): number =>
          index % 3 === 0
            ? position.getX(Math.floor(index / 3))
            : index % 3 === 1
              ? position.getY(Math.floor(index / 3))
              : position.getZ(Math.floor(index / 3)),
      );
      const previousColor:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute
        | undefined = originalGeometry.getAttribute("color");
      const sourceColors: number[] = Array.from(
        { length: position.count * 3 },
        (_: unknown, index: number): number =>
          !previousColor
            ? 1
            : index % 3 === 0
              ? previousColor.getX(Math.floor(index / 3))
              : index % 3 === 1
                ? previousColor.getY(Math.floor(index / 3))
                : previousColor.getZ(Math.floor(index / 3)),
      );
      if (sourcePositions.some(exceedsF32) || sourceColors.some(exceedsF32))
        throw new Error("Surface source exceeds GPU f32 range");
      const positions: Float32Array = Float32Array.from(sourcePositions);
      const colors: Float32Array = Float32Array.from(sourceColors);
      const geometry: THREE.BufferGeometry = originalGeometry.clone();
      const materials: THREE.Material[] = source.map(
        (material: (typeof source)[number]): THREE.Material => {
          const copy: THREE.Material & { vertexColors?: boolean } =
            material.clone();
          // Three's clone omits compile hooks and JSON-copies userData. Preserve
          // the existing skin/detail patch operations and their texture ownership.
          copy.onBeforeCompile = material.onBeforeCompile;
          copy.customProgramCacheKey = material.customProgramCacheKey;
          if (material.userData.shaderPatches !== undefined)
            copy.userData.shaderPatches = [...material.userData.shaderPatches];
          copy.vertexColors = true;
          copy.needsUpdate = true;
          return copy;
        },
      );
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions.slice(), 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors.slice(), 3),
      );
      records.push({
        ...surface,
        originalGeometry,
        originalMaterial,
        geometry,
        materials,
        positions,
        colors,
        moved: false,
        adapter,
      });
      surface.mesh.geometry = geometry;
      surface.mesh.material = AutoMovieRenderThreeKind.isMaterial(originalMaterial)
        ? materials[0]!
        : materials;
    }
  } catch (error: unknown) {
    dispose();
    throw error;
  }
  return {
    update: (seconds: number): void => {
      if (disposed || seconds < 0)
        throw new Error("Invalid surface-appearance update");
      for (const record of records) {
        const position: THREE.BufferAttribute = readBufferAttribute(
          record.geometry,
          "position",
        );
        const color: THREE.BufferAttribute = readBufferAttribute(
          record.geometry,
          "color",
        );
        position.copyArray(record.positions);
        if (record.moved) {
          position.needsUpdate = true;
          if (AutoMovieRenderThreeKind.isAutoMovieSkinnedMesh(record.mesh))
            record.mesh.invalidatePose();
        }
        let moved: boolean = false;
        for (let index: number = 0; index < position.count; index++) {
          const point: IAutoMovieVector3 = {
            x: record.positions[index * 3]!,
            y: record.positions[index * 3 + 1]!,
            z: record.positions[index * 3 + 2]!,
          };
          const sampledPoint: IAutoMovieVector3 =
            input.space === "posed-mesh" ? record.adapter.point(index) : point;
          const sample: ReturnType<typeof input.sample> = input.sample(
            record.bone,
            sampledPoint,
            seconds,
            record.mesh,
          );

          const delta: IAutoMovieVector3 =
            input.space === "posed-mesh" &&
            (sample.displacement.x !== 0 ||
              sample.displacement.y !== 0 ||
              sample.displacement.z !== 0)
              ? record.adapter.displacement(index, sample.displacement)
              : sample.displacement;
          const values: number[] = [
            point.x + delta.x,
            point.y + delta.y,
            point.z + delta.z,
            record.colors[index * 3]! * sample.color[0],
            record.colors[index * 3 + 1]! * sample.color[1],
            record.colors[index * 3 + 2]! * sample.color[2],
          ];
          if (values.some(exceedsF32))
            throw new Error(
              `The surface vertex result for ${record.bone} exceeds GPU f32 range`,
            );
          position.setXYZ(index, values[0]!, values[1]!, values[2]!);
          color.setXYZ(index, values[3]!, values[4]!, values[5]!);
          moved ||=
            position.getX(index) !== point.x ||
            position.getY(index) !== point.y ||
            position.getZ(index) !== point.z;
        }
        if (moved) position.needsUpdate = true;
        color.needsUpdate = true;
        if (moved || record.moved) {
          record.geometry.computeVertexNormals();
          record.geometry.computeBoundingSphere();
          record.geometry.computeBoundingBox();
          if (AutoMovieRenderThreeKind.isAutoMovieSkinnedMesh(record.mesh))
            record.mesh.invalidatePose();
          else if (AutoMovieRenderThreeKind.isSkinnedMesh(record.mesh))
            AutoMovieRenderSkinnedMesh.clearBounds(record.mesh);
        }
        record.moved = moved;
      }
    },
    dispose,
  };
}

/*
 * The largest finite binary32 magnitude a GPU vertex attribute can hold.
 */
const F32_MAX: number = 3.4028234663852886e38;

/*
 * Whether a binary64 value rounds past the binary32 range of a GPU buffer.
 */
const exceedsF32 = (value: number): boolean => Math.abs(value) > F32_MAX;
