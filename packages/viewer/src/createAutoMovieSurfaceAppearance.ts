import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "./AutoMovieSkinnedMesh.js";
import { createAutoMovieSurfaceVertexAdapter } from "./createAutoMovieSurfaceVertexAdapter.js";

/** Apply provider-local color and compression to actual vertices, with owned resources. */
export function createAutoMovieSurfaceAppearance(input: {
  /** Actual local surfaces and the physical bones carrying their vertices. */
  surfaces: { bone: string; mesh: THREE.Mesh }[];
  /** Default bone-local rigid vertices; posed-mesh samples the actual linear/DQ skin and inverts its displacement. */
  space?: "bone-local" | "posed-mesh";
  /** Sampler in the selected metre frame; mesh.matrixWorld maps posed-mesh points into scene world. */
  sample: (
    bone: string,
    point: IAutoMovieVector3,
    seconds: number,
    mesh: THREE.Mesh,
  ) => { color: [number, number, number]; displacement: IAutoMovieVector3 };
}): { update: (seconds: number) => void; dispose: () => void } {
  if (
    input.space !== undefined &&
    !["bone-local", "posed-mesh"].includes(input.space)
  )
    throw new Error("Invalid surface appearance coordinate space");
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
    adapter: ReturnType<typeof createAutoMovieSurfaceVertexAdapter>;
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
      const source: THREE.Material[] = Array.isArray(originalMaterial)
        ? originalMaterial
        : [originalMaterial];
      if (
        source.some(
          (material: (typeof source)[number]): boolean =>
            !("vertexColors" in material),
        )
      )
        throw new Error(
          "Surface appearance requires vertex-color material support",
        );
      const position:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute
        | undefined = originalGeometry.getAttribute("position");
      if (!position)
        throw new Error("Surface appearance requires actual vertex positions");
      const adapter: ReturnType<typeof createAutoMovieSurfaceVertexAdapter> =
        createAutoMovieSurfaceVertexAdapter(surface.mesh);
      const positions: Float32Array = Float32Array.from(
        Array.from(
          { length: position.count * 3 },
          (_: unknown, index: number): number =>
            index % 3 === 0
              ? position.getX(Math.floor(index / 3))
              : index % 3 === 1
                ? position.getY(Math.floor(index / 3))
                : position.getZ(Math.floor(index / 3)),
        ),
      );
      const previousColor:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute
        | undefined = originalGeometry.getAttribute("color");
      const colors: Float32Array = Float32Array.from(
        Array.from(
          { length: position.count * 3 },
          (_: unknown, index: number): number =>
            !previousColor
              ? 1
              : index % 3 === 0
                ? previousColor.getX(Math.floor(index / 3))
                : index % 3 === 1
                  ? previousColor.getY(Math.floor(index / 3))
                  : previousColor.getZ(Math.floor(index / 3)),
        ),
      );
      if (!positions.every(Number.isFinite) || !colors.every(Number.isFinite))
        throw new Error("Nonfinite surface source exceeds GPU f32 range");
      const geometry: THREE.BufferGeometry = originalGeometry.clone();
      const materials: THREE.Material[] = source.map(
        (material: (typeof source)[number]): THREE.Material => {
          const copy: THREE.Material & { vertexColors?: boolean } =
            material.clone();
          // Three's clone omits compile hooks and JSON-copies userData. Preserve
          // the existing skin/detail patch operations and their texture ownership.
          copy.onBeforeCompile = material.onBeforeCompile;
          copy.customProgramCacheKey = material.customProgramCacheKey;
          if (Array.isArray(material.userData.shaderPatches))
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
      surface.mesh.material = Array.isArray(originalMaterial)
        ? materials
        : materials[0]!;
    }
  } catch (error: unknown) {
    dispose();
    throw error;
  }
  return {
    update: (seconds: number): void => {
      if (disposed || !Number.isFinite(seconds) || seconds < 0)
        throw new Error("Invalid surface-appearance update");
      for (const record of records) {
        const position: THREE.BufferAttribute = record.geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        const color: THREE.BufferAttribute = record.geometry.getAttribute(
          "color",
        ) as THREE.BufferAttribute;
        position.copyArray(record.positions);
        if (record.moved) {
          position.needsUpdate = true;
          if (record.mesh instanceof AutoMovieSkinnedMesh)
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
          if (
            !sample ||
            !Array.isArray(sample.color) ||
            sample.color.length !== 3 ||
            !sample.displacement ||
            ![
              ...sample.color,
              sample.displacement.x,
              sample.displacement.y,
              sample.displacement.z,
            ].every(Number.isFinite)
          )
            throw new Error(`Nonfinite surface response for ${record.bone}`);
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
          if (
            !values.every((value: number): boolean =>
              Number.isFinite(Math.fround(value)),
            )
          )
            throw new Error(
              `Nonfinite surface vertex result for ${record.bone}`,
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
          if (record.mesh instanceof AutoMovieSkinnedMesh)
            record.mesh.invalidatePose();
          else if (record.mesh instanceof THREE.SkinnedMesh)
            AutoMovieSkinnedMesh.clearBounds(record.mesh);
        }
        record.moved = moved;
      }
    },
    dispose,
  };
}
