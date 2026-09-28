/** Whole roof owner of the v-073 canopy, waterproof fall and drainage.
 * World XZ projections stay exact. Touching members remain separate solids;
 * measured loops replace the old repeated, full-bottom cassette boxes. */
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import { Assembly, rectangle, v } from "../assembly";
import { fitCellTexture } from "../canopy-finish";
import {
  type Height,
  type Point,
  circle,
  heightRegion,
  putMesh,
} from "../metric-solid";
import { datum, exteriorWallZone } from "../plan";
import { type Flat, type Solid, drainage } from "./roof-drainage";

const canopyMinX = datum.minX - 0.3,
  canopyMaxX = datum.maxX + 0.3;
const canopyMinZ = datum.minZ - 0.7,
  canopyMaxZ = datum.maxZ + 0.3;
export const canopy = {
  minX: canopyMinX,
  maxX: canopyMaxX,
  minZ: canopyMinZ,
  maxZ: canopyMaxZ,
  girders: [-5.4, 0, 5.4],
  supports: [-4.8, 0, 4.8],
  nx: Math.ceil((canopyMaxX - canopyMinX) / 1.2),
  nz: Math.ceil((canopyMaxZ - canopyMinZ) / 1.9),
};
export const B = (z: number) => datum.roof + 0.3 + 0.01 * (canopy.maxZ - z);
export const J = (z: number) => B(z) + 0.12;
export const T = (z: number) => J(z) + 0.03;
export const P = (z: number) => B(z) + 0.161;
export const R = (x: number) => datum.roof + 0.03 + 0.01 * (x - datum.minX);
export const G = (z: number) => datum.roof - 0.11 + 0.005 * Math.abs(z);
export const gutterX = datum.minX - 0.18;

export function roof(a: Assembly): void {
  const solid: Solid = (
    id,
    plan,
    low,
    high,
    material = "canopy-metal",
    holes = [],
    blind,
  ) =>
    putMesh(
      a,
      id,
      "house",
      material,
      heightRegion(plan, low, high, holes, blind),
      "roof-member",
    );
  const flat: Flat = (id, x0, x1, z0, z1, y0, y1) =>
    solid(
      id,
      rectangle(x0, x1, z0, z1),
      () => y0,
      () => y1,
    );
  const slabBottom = datum.ceilings[1] + 0.008;
  const slabThickness = datum.roof - slabBottom;
  const slab = a.box(
    "roof-slab",
    "house",
    "stone",
    (datum.minX + datum.maxX) / 2,
    (slabBottom + datum.roof) / 2,
    (datum.minZ + datum.maxZ) / 2,
    datum.maxX - datum.minX,
    slabThickness,
    datum.maxZ - datum.minZ,
  );
  // The roof owns everything above the 6.10m butt joint. Over the exterior
  // walls no ceiling finish sits under the slab, so a bearing ring closes it.
  for (const [id, r] of exteriorWallZone())
    a.box(
      "roof-bearing-" + id,
      "house",
      "stone",
      (r[0] + r[1]) / 2,
      datum.ceilings[1] + 0.004,
      (r[2] + r[3]) / 2,
      r[1] - r[0],
      0.008,
      r[3] - r[2],
    );
  const weather = solid(
    "roof-weather",
    rectangle(datum.minX, datum.maxX, datum.minZ, datum.maxZ),
    () => datum.roof,
    (x) => R(x),
    "stone",
  );
  for (const side of [-1, 1]) {
    const z = side < 0 ? datum.minZ : datum.maxZ;
    solid(
      "roof-fascia-z-" + side,
      rectangle(datum.minX, datum.maxX, z - 0.001, z + 0.001),
      (x) => R(x) - 0.08,
      (x) => R(x) + 0.04,
    );
    solid(
      "roof-drip-z-" + side,
      rectangle(
        datum.minX,
        datum.maxX,
        side < 0 ? z - 0.1 : z,
        side < 0 ? z : z + 0.1,
      ),
      (x) => R(x) - 0.002,
      (x) => R(x),
    );
  }
  flat(
    "roof-fascia-left",
    datum.maxX,
    datum.maxX + 0.002,
    datum.minZ - 0.001,
    datum.maxZ + 0.001,
    R(datum.maxX) - 0.08,
    R(datum.maxX) + 0.04,
  );
  flat(
    "roof-drip-left",
    datum.maxX,
    datum.maxX + 0.1,
    datum.minZ,
    datum.maxZ,
    R(datum.maxX) - 0.002,
    R(datum.maxX),
  );
  flat(
    "roof-drip-right",
    datum.minX - 0.1,
    datum.minX,
    datum.minZ,
    datum.maxZ,
    R(datum.minX) - 0.002,
    R(datum.minX),
  );
  const px = (canopy.maxX - canopy.minX) / canopy.nx,
    pz = (canopy.maxZ - canopy.minZ) / canopy.nz;
  const w = px - 0.04,
    l = pz - 0.04;
  const j: Height = (_, z) => 0.12 - 0.01 * z,
    t: Height = (_, z) => 0.15 - 0.01 * z;
  const parts: IAutoMovieModelPart[] = [];
  const part = (
    id: string,
    material: string,
    outer: Point[],
    low: Height,
    high: Height,
    holes: Point[][] = [],
  ) =>
    parts.push({
      id,
      name: id,
      material,
      attachedBone: null,
      transform: null,
      geometry: { type: "mesh", mesh: heightRegion(outer, low, high, holes) },
    });
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -w / 2 : w / 2 - 0.03,
      bx = side * (px / 2 - 0.03);
    const bz = [-l / 2 + 0.07, l / 2 - 0.07];
    part(
      "frame-x-" + side,
      "canopy-metal",
      rectangle(x0, x0 + 0.03, -l / 2, l / 2),
      j,
      t,
      bz.map((z) => circle(bx, z, 0.00325, 16)),
    );
    const z0 = side < 0 ? -l / 2 : l / 2 - 0.03;
    part(
      "frame-z-" + side,
      "canopy-metal",
      rectangle(-w / 2 + 0.03, w / 2 - 0.03, z0, z0 + 0.03),
      j,
      t,
    );
    for (const z of bz) {
      part(
        "bolt-" + side + "-" + z,
        "steel",
        circle(bx, z, 0.003, 16),
        (x, z) => j(x, z) - 0.01,
        t,
      );
      part(
        "head-" + side + "-" + z,
        "steel",
        circle(bx, z, 0.006, 12),
        t,
        (x, z) => t(x, z) + 0.008,
      );
    }
    const cx = side < 0 ? -px / 2 + 0.05 : px / 2 - 0.065;
    for (const z of [-l / 4, l / 4])
      part(
        "clip-" + side + "-" + z,
        "canopy-metal",
        rectangle(cx, cx + 0.015, z - 0.01, z + 0.01),
        (x, z) => j(x, z) + 0.005,
        (x, z) => j(x, z) + 0.015,
      );
    part(
      "panel-wire-" + side,
      "canopy-metal",
      rectangle(cx + 0.005, cx + 0.01, -l / 4, l / 4),
      (x, z) => j(x, z) + 0.007,
      (x, z) => j(x, z) + 0.012,
    );
  }
  part(
    "pv",
    "pv",
    rectangle(-(w - 0.04) / 2, (w - 0.04) / 2, -(l - 0.04) / 2, (l - 0.04) / 2),
    (_, z) => 0.149 - 0.01 * z,
    (_, z) => 0.161 - 0.01 * z,
  );
  const pv = a.material("pv");
  const surface = parts.at(-1)!.geometry;
  if (surface.type !== "mesh" || !surface.mesh.uvs || !surface.mesh.normals)
    throw new Error("PV metric face attributes required");
  const uv = surface.mesh.uvs,
    normals = surface.mesh.normals;
  const top = Array.from({ length: normals.length / 3 }, (_, i) => i).filter(
    (i) => normals[i * 3 + 1] > 0.9,
  );
  pv.baseColorTexture = fitCellTexture(
    Math.min(...top.map((i) => uv[i * 2])),
    Math.max(...top.map((i) => uv[i * 2])),
    Math.min(...top.map((i) => uv[i * 2 + 1])),
    Math.max(...top.map((i) => uv[i * 2 + 1])),
  );
  a.environment.models.push({
    id: "canopy-cassette",
    name: "Drilled open cassette",
    origin: "generated",
    skeleton: null,
    asset: null,
    body: null,
    materials: [a.material("canopy-metal"), a.material("steel"), pv],
    parts,
  });
  const cassetteIds: string[] = [],
    bolts: { x: number; z: number }[] = [];
  for (let i = 0; i < canopy.nx; i++)
    for (let k = 0; k < canopy.nz; k++) {
      const x = canopy.minX + (i + 0.5) * px,
        z = canopy.minZ + (k + 0.5) * pz;
      cassetteIds.push(
        a.place(
          "canopy-cassette-" + i + "-" + k,
          "pv-cassette",
          "house",
          "canopy-cassette",
          v(x, B(z), z),
        ),
      );
      for (const side of [-1, 1])
        for (const end of [-1, 1])
          bolts.push({
            x: x + side * (px / 2 - 0.03),
            z: z + end * (l / 2 - 0.07),
          });
    }
  const structure: string[] = [];
  for (const zg of canopy.girders) {
    structure.push(
      solid(
        "canopy-girder-" + zg,
        rectangle(canopy.minX, canopy.maxX, zg - 0.04, zg + 0.04),
        (_, z) => B(z),
        (_, z) => J(z),
      ),
    );
    for (const x of canopy.supports) {
      const id = "canopy-support-" + x + "-" + zg;
      structure.push(
        solid(
          id + "-pedestal",
          rectangle(x - 0.12, x + 0.12, zg - 0.12, zg + 0.12),
          (x) => R(x),
          () => R(x) + 0.03,
          "stone",
        ),
      );
      solid(
        id + "-flashing",
        rectangle(x - 0.15, x + 0.15, zg - 0.15, zg + 0.15),
        (x) => R(x),
        (x) => R(x) + 0.002,
        "canopy-metal",
        [rectangle(x - 0.12, x + 0.12, zg - 0.12, zg + 0.12)],
      );
      flat(
        id + "-base",
        x - 0.08,
        x + 0.08,
        zg - 0.08,
        zg + 0.08,
        R(x) + 0.03,
        R(x) + 0.042,
      );
      structure.push(
        flat(
          id + "-post",
          x - 0.04,
          x + 0.04,
          zg - 0.04,
          zg + 0.04,
          R(x) + 0.042,
          B(zg) - 0.014,
        ),
      );
      structure.push(
        solid(
          id + "-cap",
          rectangle(x - 0.06, x + 0.06, zg - 0.06, zg + 0.06),
          () => B(zg) - 0.014,
          (_, z) => B(z),
        ),
      );
      // Embedded anchors show the slab connection; no Boolean cut is claimed.
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          a.rod(
            id + "-anchor-" + sx + "-" + sz,
            "house",
            "steel",
            v(x + sx * 0.06, datum.roof - 0.02, zg + sz * 0.06),
            v(x + sx * 0.06, R(x) + 0.042, zg + sz * 0.06),
            0.003,
          );
    }
  }
  const ends = [
    canopy.minZ,
    ...canopy.girders.flatMap((z) => [z - 0.046, z + 0.046]),
    canopy.maxZ,
  ];
  for (let i = 0; i <= canopy.nx; i++) {
    const x =
      i === 0
        ? canopy.minX + 0.04
        : i === canopy.nx
          ? canopy.maxX - 0.04
          : canopy.minX + i * px;
    for (let k = 0; k < ends.length; k += 2) {
      const z0 = ends[k],
        z1 = ends[k + 1];
      const holes = bolts
        .filter((p) => Math.abs(p.x - x) < 0.04 && p.z > z0 && p.z < z1)
        .map((p) => circle(p.x, p.z, 0.00325, 16));
      structure.push(
        solid(
          "canopy-rail-" + i + "-" + k / 2,
          rectangle(x - 0.04, x + 0.04, z0, z1),
          (_, z) => B(z),
          (_, z) => J(z),
          "canopy-metal",
          holes,
          (_, z) => J(z) - 0.01,
        ),
      );
    }
    for (const zg of canopy.girders)
      for (const side of [-1, 1]) {
        const start = side < 0 ? zg - 0.046 : zg + 0.04;
        structure.push(
          solid(
            "canopy-endplate-" + i + "-" + zg + "-" + side,
            rectangle(x - 0.04, x + 0.04, start, start + 0.006),
            (_, z) => B(z),
            (_, z) => J(z),
          ),
        );
      }
  }
  drainage(a, solid, flat, gutterX, G);
  const up = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  const tiltDeg = (Math.atan(0.01) * 180) / Math.PI;
  const rotation = Quaternion.multiply(
    Quaternion.fromAxisAngle(v(0, 0, 1), tiltDeg),
    up,
  );
  a.environment.boundaries.push({
    id: "roof-face",
    kind: "roof",
    spaces: ["house"],
    elements: [slab, weather],
    face: {
      origin: v(0, R(0), 0),
      rotation,
      outline: rectangle(
        datum.minX * Math.hypot(1, 0.01),
        datum.maxX * Math.hypot(1, 0.01),
        datum.minZ,
        datum.maxZ,
      ),
      thickness: slabThickness,
    },
  });
  for (const [id, height, angle, elements] of [
    ["canopy-top", P(-0.2), -90 + tiltDeg, cassetteIds],
    ["canopy-soffit", B(-0.2), 90 + tiltDeg, structure],
  ] as const)
    a.environment.boundaries.push({
      id,
      kind: "roof",
      spaces: ["house"],
      elements: [...elements],
      face: {
        origin: v(0, height, -0.2),
        rotation: Quaternion.fromAxisAngle(v(1, 0, 0), angle),
        outline: rectangle(
          canopy.minX,
          canopy.maxX,
          (canopy.minZ + 0.2) * Math.hypot(1, 0.01),
          (canopy.maxZ + 0.2) * Math.hypot(1, 0.01),
        ),
        thickness: 0.161,
      },
    });
}
/** Both gutter halves fall to the central open outlet. */
