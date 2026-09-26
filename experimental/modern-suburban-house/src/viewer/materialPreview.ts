/**
 * Viewer-only surface preview for the existing house solids. The host keeps its
 * geometry; this table shades the current spaces handoff for visual inspection.
 * Every key is an emitted role plus palette colour, so unrelated faces cannot
 * silently inherit a finish from a similar name.
 *
 * The choices are derived from docs/materials/01-exterior.md and
 * 02-interior-shell.md. This diagnostic preview does not fulfill the disabled
 * materialSources layer; its final source and measured UV bindings remain due.
 */
import type { HousePartRole } from "../spaces/solids";
import { PALETTE } from "../spaces/palette";

export interface HouseFinish {
  id: string;
  color: number;
  roughness: number;
  metalness: number;
  /** Tile file and world metres per repeat. Missing maps use color/roughness. */
  texture?: { file: string; metres: readonly [number, number]; projection: "wall" | "ground" | "roof" };
}

const finishes: Readonly<Record<string, HouseFinish>> = {
  "wall/ebe5d8": {
    id: "siding-warm-white",
    color: 0xede8dc,
    roughness: 0.55,
    metalness: 0,
    texture: { file: "siding.png", metres: [1, 0.15], projection: "wall" },
  },
  "wall/f0ebe1": {
    id: "interior-painted-wall",
    color: 0xf0ebe1,
    roughness: 0.72,
    metalness: 0,
  },
  "roof/3d3f43": {
    id: "roof-shingle",
    color: 0x3a3c3e,
    roughness: 0.9,
    metalness: 0,
    texture: { file: "shingle.png", metres: [0.66, 0.28], projection: "roof" },
  },
  "chimney/8c4b36": {
    id: "brick-red-brown",
    color: 0x8a4a3a,
    roughness: 0.85,
    metalness: 0,
    texture: { file: "brick.png", metres: [0.4, 0.13], projection: "wall" },
  },
  "chimney/2b2b2b": {
    id: "charcoal-metal",
    color: 0x2e3033,
    roughness: 0.4,
    metalness: 0,
  },
  "porch/f4f2ec": {
    id: "trim-white",
    color: 0xf6f4ee,
    roughness: 0.35,
    metalness: 0,
  },
  "porch/a39a8e": {
    id: "porch-floor",
    color: 0xa8a49c,
    roughness: 0.8,
    metalness: 0,
    texture: { file: "porch.png", metres: [0.4, 0.4], projection: "ground" },
  },
  "paving/c4c0b6": {
    id: "paving-concrete",
    color: 0xb4b0a8,
    roughness: 0.88,
    metalness: 0,
    texture: { file: "concrete.png", metres: [0.5, 0.5], projection: "ground" },
  },
  "paving/bab7b0": {
    id: "paving-concrete",
    color: 0xb4b0a8,
    roughness: 0.88,
    metalness: 0,
    texture: { file: "concrete.png", metres: [0.5, 0.5], projection: "ground" },
  },
  "fence/8a6a4a": {
    id: "fence-wood",
    color: 0x8c6a48,
    roughness: 0.75,
    metalness: 0,
    texture: { file: "timber.png", metres: [0.14, 0.8], projection: "wall" },
  },
  "floor/a9a49a": {
    id: "structural-base",
    color: 0xa9a49a,
    roughness: 0.8,
    metalness: 0,
  },
  "floor/bab7b0": {
    id: "garage-concrete",
    color: 0x9c9890,
    roughness: 0.85,
    metalness: 0,
    texture: { file: "garage.png", metres: [0.5, 0.5], projection: "ground" },
  },
  "floor/b88a5c": {
    id: "oak-floor",
    color: 0xb08050,
    roughness: 0.5,
    metalness: 0,
    texture: { file: "oak.png", metres: [0.13, 1.2], projection: "ground" },
  },
  "floor/d6dadb": {
    id: "bath-floor-tile",
    color: 0xd8d4cc,
    roughness: 0.4,
    metalness: 0,
    texture: { file: "tile.png", metres: [0.3, 0.3], projection: "ground" },
  },
  "floor/c2c3c0": {
    id: "laundry-floor",
    color: 0xc9c4ba,
    roughness: 0.5,
    metalness: 0,
  },
  "floor/cbbfab": {
    id: "beige-carpet",
    color: 0xcdbfa6,
    roughness: 0.95,
    metalness: 0,
    texture: { file: "carpet.png", metres: [0.01, 0.01], projection: "ground" },
  },
  "floor/f0ebe1": {
    id: "interior-wall-paint",
    color: 0xf1eee6,
    roughness: 0.6,
    metalness: 0,
  },
  "partition/f0ebe1": {
    id: "interior-wall-paint",
    color: 0xf1eee6,
    roughness: 0.6,
    metalness: 0,
  },
  "ceiling/f6f4ef": {
    id: "interior-ceiling",
    color: 0xfaf9f6,
    roughness: 0.65,
    metalness: 0,
  },
  "stair/9a6b43": {
    id: "stair-tread-wood",
    color: 0xb08050,
    roughness: 0.5,
    metalness: 0,
    texture: { file: "oak.png", metres: [0.13, 1.2], projection: "ground" },
  },
  "guard/9a6b43": {
    id: "handrail-wood",
    color: 0x8a5a34,
    roughness: 0.45,
    metalness: 0,
  },
  "guard/2b2b2b": {
    id: "black-coated-metal",
    color: 0x1f1f20,
    roughness: 0.4,
    metalness: 0,
  },
};

/** Resolve every emitted house face; missing keys are a contract failure. */
export function houseFinish(role: HousePartRole, color: number): HouseFinish {
  const key = `${role}/${color.toString(16)}`;
  const finish = finishes[key];
  if (finish === undefined) throw new Error(`unbound house surface ${key}`);
  return finish;
}

/**
 * The current wall solid includes both the weather face and its room face.
 * Keep its triangles and part id, but give each face the finish belonging to
 * its side of the reviewed boundary. A shared garage wall has two room faces.
 * Reveal and thickness faces use the neutral interior paint until their
 * separate model trim exists. The exterior tile stays on the outward plane.
 */
export function houseWallFinishGroups(
  part: { id: string; owner: string; role: HousePartRole; color: number },
  normals: readonly number[],
  indices: readonly number[],
): { suffix: string; finish: HouseFinish; indices: number[] }[] {
  const base = houseFinish(part.role, part.color);
  if (part.role !== "wall" || part.color !== PALETTE.siding)
    return [{ suffix: "", finish: base, indices: [...indices] }];
  const outward: readonly [number, number, number] | undefined =
    part.owner === "envelope/front.ts"
      ? [0, 0, 1]
      : part.owner === "envelope/rear.ts"
        ? [0, 0, -1]
        : part.owner === "envelope/left.ts"
          ? [-1, 0, 0]
          : part.owner === "envelope/right.ts"
            ? [1, 0, 0]
            : undefined;
  if (outward === undefined) throw new Error(
    `siding wall ${part.id} has no exterior direction`,
  );
  const outside: number[] = [];
  const inside: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const vertex = indices[i]! * 3;
    const dot = normals[vertex]! * outward[0] + normals[vertex + 1]! * outward[1] + normals[vertex + 2]! * outward[2];
    (dot > 0.9 ? outside : inside).push(
      indices[i]!,
      indices[i + 1]!,
      indices[i + 2]!,
    );
  }
  return [
    ...(outside.length ? [{ suffix: "/exterior", finish: base, indices: outside }] : []),
    ...(inside.length ? [{ suffix: "/interior", finish: houseFinish("wall", PALETTE.interiorWall), indices: inside }] : []),
  ];
}

/**
 * Project current world-space vertices into the binding's metric repeat grid.
 * Ground uses X/Z; walls use their horizontal tangent/Y; a roof uses its eave
 * tangent and slope distance. Geometry is unchanged and the world origin keeps
 * phase continuous across adjacent emitted solids. The map itself wraps.
 */
export function houseTextureUvs(
  positions: readonly number[],
  normals: readonly number[],
  finish: HouseFinish,
): number[] | undefined {
  const texture = finish.texture;
  if (texture === undefined) return undefined;
  const output: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!, y = positions[i + 1]!, z = positions[i + 2]!;
    const nx = normals[i]!, ny = normals[i + 1]!, nz = normals[i + 2]!;
    let u: number, v: number;
    if (texture.projection === "ground" || Math.abs(ny) > 0.9) {
      u = x;
      v = z;
    } else if (texture.projection === "roof") {
      u = Math.abs(nx) > Math.abs(nz) ? z : x;
      v = y / Math.max(0.2, Math.hypot(nx, nz));
    } else {
      u = Math.abs(nx) > Math.abs(nz) ? z : x;
      v = y;
    }
    output.push(u / texture.metres[0], v / texture.metres[1]);
  }
  return output;
}

/** The reviewed textile palette receives one neutral weave without recolouring it. */
const textileColours = new Set([
  0xb7afa3, 0xcfc8bc, 0x6b7040, 0x6e7f8c, 0x8e8579, 0xeae6dc, 0xede9e0,
]);
export function modelTextileMap(fallback: number): string | undefined {
  return textileColours.has(fallback) ? "/textures/woven.png" : undefined;
}
