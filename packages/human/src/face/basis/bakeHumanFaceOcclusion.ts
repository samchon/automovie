import {
  type IAutoMovieMeshRayCaster as IAutoMovieMeshRayCasterImported,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type {
  IAutoMovieMesh as IAutoMovieMeshImported,
  IAutoMovieModel,
  IAutoMovieModelPart as IAutoMovieModelPartImported,
} from "@automovie/interface";

import { encodePng } from "../../common/mesh/encodePng";
import { readHumanLocalMeshWorld } from "../../common/mesh/readHumanLocalMeshWorld";
import type { IHumanFaceOcclusionBakeOptions } from "./IHumanFaceOcclusionBakeOptions";
import { humanFaceOcclusionOpaqueMaterials } from "./humanFaceOcclusionOpaqueMaterials";

/** How far a ray starts off its surface along the normal, metres. */
const LIFT: number = 0.00005;

/**
 * Bake an evaluated model's ambient occlusion into one texture per material.
 *
 * Opaque-material mesh triangles occlude; a material receives a texture only when all its opaque meshes have UVs. Each vertex casts cosine-weighted directions with radius sqrt((i+1/2)/rays) and azimuth 2.39996i from 0.05mm along its normal to the model's bounding diagonal. Unblocked fraction estimates distant uniform ambient visibility; missing or zero normals receive one. The native ray owner's stated grazing cutoff still applies.
 *
 * UV triangles interpolate vertex visibility at texel centres; overlapping triangles overwrite earlier values in mesh/triangle order. Four rings extend filled neighbours' mean into empty texels without island labels, so nearby islands can mix. Remaining texels stay at one. PNG channels are equal 8-bit grayscale and the model remains unchanged.
 *
 * Every participating mesh is read through readHumanLocalMeshWorld: local positions/normals round to their Float32 publication and ordinary part TRS restores the owning model's metre frame. The engine maps normals by inverse transpose, normalizes them and reverses reflected triangle winding while UVs retain vertex correspondence. Caster triangles, receiver points, normal lifts and the bounding diagonal use this same view; the model is unchanged.
 *
 * Alpha-mode-only classification treats a transmission-one cornea as an opaque occluder. Lift, spiral sampling and padding are authored numerical conventions; ray count and texture edge must be positive integers. Coordinate agreement supplies no GPU, matched before/after image or physical transparent-visibility verification.
 *
 * @evidence contracts/common.md#principled-implementation Local-Float32 publication plus ordinary TRS puts caster triangles and receiver positions/inverse-transpose normals in one model-metre frame before cosine-weighted hemisphere visibility and UV interpolation. Current static builder parts satisfy the shared transform's skin/placement/physical-correspondence admission; finite ray/texel sampling remains an approximation.
 * @evidence contracts/common.md#clear-and-simple-design One native ray caster and spiral serve all receivers; material eligibility matches the cache classification, while PNG packing owns encoding and final material binding stays with the builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 0.05mm lift, spiral, missing-normal visibility and four-ring padding remain conventions; islands can mix and finite sampling is approximate. Shared TRS admission refuses invalid placement rather than discarding it, alpha-mode classification still ignores corneal transmission, and no GPU or physical optical accuracy is certified.
 * @evidence contracts/common.md#meaningful-documentation Prose gives alpha-mode eligibility, local Float32/TRS and normal/winding restoration, model-metre ray range/lift, unchanged UV correspondence, padding leakage, no-normal behavior, resolution admission and outstanding visual verification.
 * @evidence contracts/performance.md#efficient-algorithms Publication/TRS reconstruction copies actual mesh attributes and reads physical correspondence; for T triangles/V receivers, R rays and M size-S textures, hierarchy construction costs O(T log squared T) and VR queries cost O(VRT) worst case. Raster work follows summed triangle pixel boxes, with M mesh filters and O(S squared) field/padding/byte work per texture plus PNG compression.
 * @evidence contracts/performance.md#reuse-equivalent-work Each part's publication/TRS view is computed once and shared by caster assembly and receiver sampling. One caster, spiral and local ray buffers serve all vertices; per-mesh visibility is computed once, and the outer cache reuses images for equivalent geometry/alpha-mode population/resolution, not physical transmission or opacity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Invocation-local mesh copies/hierarchy and per-texture arrays scale with T,V,R,S squared; returned M encoded strings belong to the caller. Options impose no separate byte budget, allocation can fail, and no external task/handle or model mutation exists.
 */
export function bakeHumanFaceOcclusion(
  model: IAutoMovieModel,
  options: IHumanFaceOcclusionBakeOptions,
): Map<string, string> {
  const { rays, size }: IHumanFaceOcclusionBakeOptions = options;
  if (
    !Number.isInteger(rays) ||
    rays <= 0 ||
    !Number.isInteger(size) ||
    size <= 0
  )
    throw new Error("Occlusion needs positive integer ray counts and sizes.");
  const opaque: Set<string> = humanFaceOcclusionOpaqueMaterials(model);
  const meshes: { material: string; mesh: IAutoMovieMeshImported }[] =
    model.parts.flatMap(
      (
        part: IAutoMovieModelPartImported,
      ): { material: string; mesh: IAutoMovieMeshImported }[] =>
        part.geometry.type === "mesh" &&
        part.material !== null &&
        opaque.has(part.material)
          ? [
              {
                material: part.material,
                mesh: readHumanLocalMeshWorld(
                  part.geometry.mesh,
                  part.transform,
                ),
              },
            ]
          : [],
    );
  const positions: number[] = [];
  const indices: number[] = [];
  for (const { mesh } of meshes) {
    const offset: number = positions.length / 3;
    // Pushed one by one: spreading a large mesh exceeds a browser's
    // argument limit.
    for (const value of mesh.positions) positions.push(value);
    const own: number[] =
      mesh.indices ??
      Array.from(
        { length: mesh.positions.length / 3 },
        (_v: unknown, i: number): number => i,
      );
    for (const index of own) indices.push(offset + index);
  }
  const caster: IAutoMovieMeshRayCasterImported = createAutoMovieMeshRayCaster({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (let i: number = 0; i < positions.length; i += 3)
    for (let axis: number = 0; axis < 3; ++axis) {
      low[axis] = Math.min(low[axis], positions[i + axis]);
      high[axis] = Math.max(high[axis], positions[i + axis]);
    }
  const reach: number = Math.hypot(
    ...[0, 1, 2].map((axis: number): number => high[axis] - low[axis]),
  );
  const spiral: number[][] = Array.from(
    { length: rays },
    (_v: unknown, i: number): number[] => {
      const radius: number = Math.sqrt((i + 0.5) / rays);
      const azimuth: number = 2.39996 * i;
      return [
        radius * Math.cos(azimuth),
        radius * Math.sin(azimuth),
        Math.sqrt(1 - radius * radius),
      ];
    },
  );
  const origin: number[] = [0, 0, 0];
  const direction: number[] = [0, 0, 0];
  const visibility: (
    positions: readonly number[],
    normals: readonly number[] | null,
    vertex: number,
  ) => number = (
    positions: readonly number[],
    normals: readonly number[] | null,
    vertex: number,
  ): number => {
    if (normals === null) return 1;
    let nx: number = normals[3 * vertex];
    let ny: number = normals[3 * vertex + 1];
    let nz: number = normals[3 * vertex + 2];
    const length: number = Math.hypot(nx, ny, nz);
    if (!(length > 0)) return 1;
    nx /= length;
    ny /= length;
    nz /= length;
    // A tangent frame: u across the normal from the less aligned axis.
    const [sx, sy, sz]: [number, number, number] =
      Math.abs(nx) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    let ux: number = sy * nz - sz * ny;
    let uy: number = sz * nx - sx * nz;
    let uz: number = sx * ny - sy * nx;
    const ul: number = Math.hypot(ux, uy, uz);
    ux /= ul;
    uy /= ul;
    uz /= ul;
    const vx: number = ny * uz - nz * uy;
    const vy: number = nz * ux - nx * uz;
    const vz: number = nx * uy - ny * ux;
    origin[0] = positions[3 * vertex] + nx * LIFT;
    origin[1] = positions[3 * vertex + 1] + ny * LIFT;
    origin[2] = positions[3 * vertex + 2] + nz * LIFT;
    let open: number = 0;
    for (const [a, b, c] of spiral) {
      direction[0] = a * ux + b * vx + c * nx;
      direction[1] = a * uy + b * vy + c * ny;
      direction[2] = a * uz + b * vz + c * nz;
      if (!caster.blocked(origin, direction, reach)) ++open;
    }
    return open / rays;
  };
  const baked: Map<string, string> = new Map<string, string>();
  const receivers: string[] = [
    ...new Set(
      meshes.map(
        (one: { material: string; mesh: IAutoMovieMeshImported }): string =>
          one.material,
      ),
    ),
  ];
  for (const material of receivers) {
    // A texture binds every mesh of its material, so a material any of whose
    // meshes lacks UVs receives none.
    const own: { material: string; mesh: IAutoMovieMeshImported }[] =
      meshes.filter(
        (one: { material: string; mesh: IAutoMovieMeshImported }): boolean =>
          one.material === material,
      );
    if (
      own.some(
        (one: { material: string; mesh: IAutoMovieMeshImported }): boolean =>
          one.mesh.uvs === null,
      )
    )
      continue;
    const field: Float64Array<ArrayBuffer> = new Float64Array(size * size).fill(
      -1,
    );
    for (const { mesh } of own) {
      const count: number = mesh.positions.length / 3;
      const seen: number[] = Array.from(
        { length: count },
        (_v: unknown, vertex: number): number =>
          visibility(mesh.positions, mesh.normals, vertex),
      );
      const triangles: number[] =
        mesh.indices ??
        Array.from({ length: count }, (_v: unknown, i: number): number => i);
      const uvs: number[] = mesh.uvs!;
      for (let i: number = 0; i < triangles.length; i += 3) {
        const ids: number[] = [
          triangles[i],
          triangles[i + 1],
          triangles[i + 2],
        ];
        const corner: number[][] = ids.map((vertex: number): number[] => [
          uvs[2 * vertex] * size,
          (1 - uvs[2 * vertex + 1]) * size,
        ]);
        const area: number =
          (corner[1][0] - corner[0][0]) * (corner[2][1] - corner[0][1]) -
          (corner[1][1] - corner[0][1]) * (corner[2][0] - corner[0][0]);
        if (area === 0) continue;
        const x0: number = Math.max(
          0,
          Math.floor(Math.min(...corner.map((p: number[]): number => p[0]))),
        );
        const x1: number = Math.min(
          size - 1,
          Math.ceil(Math.max(...corner.map((p: number[]): number => p[0]))),
        );
        const y0: number = Math.max(
          0,
          Math.floor(Math.min(...corner.map((p: number[]): number => p[1]))),
        );
        const y1: number = Math.min(
          size - 1,
          Math.ceil(Math.max(...corner.map((p: number[]): number => p[1]))),
        );
        for (let y: number = y0; y <= y1; ++y)
          for (let x: number = x0; x <= x1; ++x) {
            const px: number = x + 0.5;
            const py: number = y + 0.5;
            const w0: number =
              ((corner[1][0] - px) * (corner[2][1] - py) -
                (corner[1][1] - py) * (corner[2][0] - px)) /
              area;
            const w1: number =
              ((corner[2][0] - px) * (corner[0][1] - py) -
                (corner[2][1] - py) * (corner[0][0] - px)) /
              area;
            const w2: number = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            field[y * size + x] =
              w0 * seen[ids[0]] + w1 * seen[ids[1]] + w2 * seen[ids[2]];
          }
      }
    }
    // Four rings of seam filling: each ring fills the empty texels beside a
    // filled one with their filled neighbours' mean.
    let frontier: number[] = [];
    const empty: (texel: number) => boolean = (texel: number): boolean =>
      field[texel] < 0;
    const neighbours: (texel: number) => number[] = (
      texel: number,
    ): number[] => {
      const x: number = texel % size;
      const out: number[] = [];
      if (x > 0) out.push(texel - 1);
      if (x < size - 1) out.push(texel + 1);
      if (texel >= size) out.push(texel - size);
      if (texel < size * (size - 1)) out.push(texel + size);
      return out;
    };
    for (let texel: number = 0; texel < size * size; ++texel) {
      if (!empty(texel)) continue;
      const x: number = texel % size;
      if (
        (x > 0 && !empty(texel - 1)) ||
        (x < size - 1 && !empty(texel + 1)) ||
        (texel >= size && !empty(texel - size)) ||
        (texel < size * (size - 1) && !empty(texel + size))
      )
        frontier.push(texel);
    }
    for (let ring: number = 0; ring < 4 && frontier.length > 0; ++ring) {
      const values: number[] = frontier.map((texel: number): number => {
        let sum: number = 0;
        let filled: number = 0;
        for (const one of neighbours(texel))
          if (!empty(one)) {
            sum += field[one];
            ++filled;
          }
        return sum / filled;
      });
      frontier.forEach(
        (texel: number, k: number): number => (field[texel] = values[k]),
      );
      const next: Set<number> = new Set<number>();
      for (const texel of frontier)
        for (const one of neighbours(texel)) if (empty(one)) next.add(one);
      frontier = [...next];
    }
    const rgba: Uint8Array<ArrayBuffer> = new Uint8Array(4 * size * size);
    for (let texel: number = 0; texel < size * size; ++texel) {
      const value: number = Math.round(
        255 * (field[texel] < 0 ? 1 : Math.min(1, Math.max(0, field[texel]))),
      );
      rgba.set([value, value, value, 255], 4 * texel);
    }
    baked.set(material, encodePng({ width: size, height: size, rgba }));
  }
  return baked;
}
