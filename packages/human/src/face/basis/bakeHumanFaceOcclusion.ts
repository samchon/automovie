import { createAutoMovieMeshRayCaster } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { encodePortraitPng } from "../../common/mesh/encodePortraitPng";

/** How far a ray starts off its surface along the normal, metres. */
const LIFT = 0.00005;

/**
 * Bake an evaluated model's ambient occlusion into one texture per material.
 *
 * The occluders are every mesh triangle of an opaque material (alpha mode
 * neither mask nor blend); the receivers are those of the opaque materials
 * all of whose meshes carry UVs (a texture binds every mesh of its material). From each receiving vertex, `rays` cosine-weighted
 * directions about its normal (a golden-angle spiral: the i-th at radius
 * sqrt((i + 1/2) / rays) and azimuth 2.39996 i) are cast from 0.05 mm off
 * the surface to the model's bounding diagonal; the share that meets no
 * occluder is the vertex's visibility, the share of a distant uniform
 * ambient light reaching it. Each material's triangles are rasterized over
 * its UVs into a `size` square texture, a texel's centre taking the
 * barycentric mix of its triangle's vertex visibilities; texels no triangle
 * covers take the mean of their filled neighbours for four rings, so the
 * values do not bleed at UV seams, and the rest stay at one. Values are
 * written as equal 8-bit R, G and B. A vertex without a normal is taken as
 * fully visible. The model is not changed. It refuses a ray count or size
 * that is not a positive integer.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-surface-maps Computes how much ambient light reaches each surface point from the document's own geometry, deterministically and without images.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-occlusion Casts the specified cosine-weighted rays against opaque triangles and rasterizes the visibility over each material's UVs with the stated seam filling.
 */
export function bakeHumanFaceOcclusion(
  model: IAutoMovieModel,
  options: { rays: number; size: number },
): Map<string, string> {
  const { rays, size } = options;
  if (
    !Number.isInteger(rays) ||
    rays <= 0 ||
    !Number.isInteger(size) ||
    size <= 0
  )
    throw new Error("Occlusion needs positive integer ray counts and sizes.");
  const opaque = new Set(
    model.materials
      .filter(
        (material) =>
          material.alphaMode !== "mask" && material.alphaMode !== "blend",
      )
      .map((material) => material.id),
  );
  const meshes = model.parts.flatMap((part) =>
    part.geometry.type === "mesh" &&
    part.material !== null &&
    opaque.has(part.material)
      ? [{ material: part.material, mesh: part.geometry.mesh }]
      : [],
  );
  const positions: number[] = [];
  const indices: number[] = [];
  for (const { mesh } of meshes) {
    const offset = positions.length / 3;
    // Pushed one by one: spreading a large mesh exceeds a browser's
    // argument limit.
    for (const value of mesh.positions) positions.push(value);
    const own =
      mesh.indices ??
      Array.from({ length: mesh.positions.length / 3 }, (_v, i) => i);
    for (const index of own) indices.push(offset + index);
  }
  const caster = createAutoMovieMeshRayCaster({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3)
    for (let axis = 0; axis < 3; ++axis) {
      low[axis] = Math.min(low[axis], positions[i + axis]);
      high[axis] = Math.max(high[axis], positions[i + axis]);
    }
  const reach = Math.hypot(...[0, 1, 2].map((axis) => high[axis] - low[axis]));
  const spiral = Array.from({ length: rays }, (_v, i) => {
    const radius = Math.sqrt((i + 0.5) / rays);
    const azimuth = 2.39996 * i;
    return [
      radius * Math.cos(azimuth),
      radius * Math.sin(azimuth),
      Math.sqrt(1 - radius * radius),
    ];
  });
  const origin = [0, 0, 0];
  const direction = [0, 0, 0];
  const visibility = (
    positions: readonly number[],
    normals: readonly number[] | null,
    vertex: number,
  ): number => {
    if (normals === null) return 1;
    let nx = normals[3 * vertex];
    let ny = normals[3 * vertex + 1];
    let nz = normals[3 * vertex + 2];
    const length = Math.hypot(nx, ny, nz);
    if (!(length > 0)) return 1;
    nx /= length;
    ny /= length;
    nz /= length;
    // A tangent frame: u across the normal from the less aligned axis.
    const [sx, sy, sz] = Math.abs(nx) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    let ux = sy * nz - sz * ny;
    let uy = sz * nx - sx * nz;
    let uz = sx * ny - sy * nx;
    const ul = Math.hypot(ux, uy, uz);
    ux /= ul;
    uy /= ul;
    uz /= ul;
    const vx = ny * uz - nz * uy;
    const vy = nz * ux - nx * uz;
    const vz = nx * uy - ny * ux;
    origin[0] = positions[3 * vertex] + nx * LIFT;
    origin[1] = positions[3 * vertex + 1] + ny * LIFT;
    origin[2] = positions[3 * vertex + 2] + nz * LIFT;
    let open = 0;
    for (const [a, b, c] of spiral) {
      direction[0] = a * ux + b * vx + c * nx;
      direction[1] = a * uy + b * vy + c * ny;
      direction[2] = a * uz + b * vz + c * nz;
      if (!caster.blocked(origin, direction, reach)) ++open;
    }
    return open / rays;
  };
  const baked = new Map<string, string>();
  const receivers = [...new Set(meshes.map((one) => one.material))];
  for (const material of receivers) {
    // A texture binds every mesh of its material, so a material any of whose
    // meshes lacks UVs receives none.
    const own = meshes.filter((one) => one.material === material);
    if (own.some((one) => one.mesh.uvs === null)) continue;
    const field = new Float64Array(size * size).fill(-1);
    for (const { mesh } of own) {
      const count = mesh.positions.length / 3;
      const seen = Array.from({ length: count }, (_v, vertex) =>
        visibility(mesh.positions, mesh.normals, vertex),
      );
      const triangles =
        mesh.indices ?? Array.from({ length: count }, (_v, i) => i);
      const uvs = mesh.uvs!;
      for (let i = 0; i < triangles.length; i += 3) {
        const ids = [triangles[i], triangles[i + 1], triangles[i + 2]];
        const corner = ids.map((vertex) => [
          uvs[2 * vertex] * size,
          (1 - uvs[2 * vertex + 1]) * size,
        ]);
        const area =
          (corner[1][0] - corner[0][0]) * (corner[2][1] - corner[0][1]) -
          (corner[1][1] - corner[0][1]) * (corner[2][0] - corner[0][0]);
        if (area === 0) continue;
        const x0 = Math.max(
          0,
          Math.floor(Math.min(...corner.map((p) => p[0]))),
        );
        const x1 = Math.min(
          size - 1,
          Math.ceil(Math.max(...corner.map((p) => p[0]))),
        );
        const y0 = Math.max(
          0,
          Math.floor(Math.min(...corner.map((p) => p[1]))),
        );
        const y1 = Math.min(
          size - 1,
          Math.ceil(Math.max(...corner.map((p) => p[1]))),
        );
        for (let y = y0; y <= y1; ++y)
          for (let x = x0; x <= x1; ++x) {
            const px = x + 0.5;
            const py = y + 0.5;
            const w0 =
              ((corner[1][0] - px) * (corner[2][1] - py) -
                (corner[1][1] - py) * (corner[2][0] - px)) /
              area;
            const w1 =
              ((corner[2][0] - px) * (corner[0][1] - py) -
                (corner[2][1] - py) * (corner[0][0] - px)) /
              area;
            const w2 = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            field[y * size + x] =
              w0 * seen[ids[0]] + w1 * seen[ids[1]] + w2 * seen[ids[2]];
          }
      }
    }
    // Four rings of seam filling: each ring fills the empty texels beside a
    // filled one with their filled neighbours' mean.
    let frontier: number[] = [];
    const empty = (texel: number) => field[texel] < 0;
    const neighbours = (texel: number): number[] => {
      const x = texel % size;
      const out: number[] = [];
      if (x > 0) out.push(texel - 1);
      if (x < size - 1) out.push(texel + 1);
      if (texel >= size) out.push(texel - size);
      if (texel < size * (size - 1)) out.push(texel + size);
      return out;
    };
    for (let texel = 0; texel < size * size; ++texel) {
      if (!empty(texel)) continue;
      const x = texel % size;
      if (
        (x > 0 && !empty(texel - 1)) ||
        (x < size - 1 && !empty(texel + 1)) ||
        (texel >= size && !empty(texel - size)) ||
        (texel < size * (size - 1) && !empty(texel + size))
      )
        frontier.push(texel);
    }
    for (let ring = 0; ring < 4 && frontier.length > 0; ++ring) {
      const values = frontier.map((texel) => {
        let sum = 0;
        let filled = 0;
        for (const one of neighbours(texel))
          if (!empty(one)) {
            sum += field[one];
            ++filled;
          }
        return sum / filled;
      });
      frontier.forEach((texel, k) => (field[texel] = values[k]));
      const next = new Set<number>();
      for (const texel of frontier)
        for (const one of neighbours(texel)) if (empty(one)) next.add(one);
      frontier = [...next];
    }
    const rgba = new Uint8Array(4 * size * size);
    for (let texel = 0; texel < size * size; ++texel) {
      const value = Math.round(
        255 * (field[texel] < 0 ? 1 : Math.min(1, Math.max(0, field[texel]))),
      );
      rgba.set([value, value, value, 255], 4 * texel);
    }
    baked.set(material, encodePortraitPng({ width: size, height: size, rgba }));
  }
  return baked;
}
