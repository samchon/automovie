/**
 * Viewer projection of authored building finishes onto the existing house
 * solids. Spaces still own geometry and role/colour surface addresses; the
 * material source owns the swatch, response and metric tile. The structural
 * floor base alone retains an explicitly unresolved preview value.
 */
import { linearColorToSrgbHex } from "@automovie/engine";

import { buildingSpaceFinish } from "../materials/space-bindings";
import type { HousePartRole } from "../spaces/solid-records";
import { PALETTE } from "../spaces/palette";

export interface HouseFinish {
  id: string;
  color: number;
  roughness: number;
  metalness: number;
  /** Tile file and world metres per repeat. Missing maps use color/roughness. */
  texture?: { file: string; metres: readonly [number, number]; projection: "wall" | "ground" | "roof" | "local" };
}

/** Resolve every emitted house face; missing keys are a contract failure. */
export function houseFinish(role: HousePartRole, color: number): HouseFinish {
  if (role === "floor" && color === PALETTE.structure)
    return { id: "structural-base", color, roughness: 0.8, metalness: 0 };
  const source = buildingSpaceFinish(role, color);
  const material = source.material;
  return {
    id: material.id,
    color: Number.parseInt(linearColorToSrgbHex(material.baseColor).slice(1), 16),
    roughness: material.roughness,
    metalness: material.metallic,
    texture: source.texture,
  };
}

/**
 * Current wall and roof solids contain more than one finish boundary.
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
  if (part.role === "roof" && part.color === PALETTE.roof) {
    const weather: number[] = [];
    const trim: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const ny = normals[indices[i]! * 3 + 1]!;
      (ny > 0.1 ? weather : trim).push(
        indices[i]!,
        indices[i + 1]!,
        indices[i + 2]!,
      );
    }
    return [
      ...(weather.length ? [{ suffix: "/weather", finish: base, indices: weather }] : []),
      ...(trim.length ? [{ suffix: "/soffit-fascia", finish: houseFinish("porch", PALETTE.trim), indices: trim }] : []),
    ];
  }
  if (part.role === "stair" && part.color === PALETTE.stairWood) {
    const oak: number[] = [];
    const painted: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const ny = normals[indices[i]! * 3 + 1]!;
      (ny > 0.9 ? oak : painted).push(
        indices[i]!,
        indices[i + 1]!,
        indices[i + 2]!,
      );
    }
    return [
      ...(oak.length ? [{ suffix: "/top", finish: base, indices: oak }] : []),
      ...(painted.length ? [{ suffix: "/riser-edge", finish: houseFinish("porch", PALETTE.trim), indices: painted }] : []),
    ];
  }
  if (part.role !== "wall" || (part.color !== PALETTE.siding && part.color !== PALETTE.brick))
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
 * Consume spaces UV ownership: paving tops and graded connectors use X/Z,
 * exposed vertical sides use their horizontal tangent/Y, and stair tread tops
 * start at each left nose. Roofs use their eave tangent and slope distance.
 * Geometry is unchanged; world-based surfaces keep phase across split faces.
 */
export function houseTextureUvs(
  positions: readonly number[],
  normals: readonly number[],
  finish: HouseFinish,
  partId?: string,
): number[] | undefined {
  const texture = finish.texture;
  if (texture === undefined) return undefined;
  const lowerTread = partId?.startsWith("stair-lower-tread-") ?? false;
  const upperTread = partId?.startsWith("stair-upper-tread-") ?? false;
  const landing = partId === "stair-landing";
  const gradedConnector = partId?.startsWith("front-walk-connector-") ||
    partId?.startsWith("side-walk-front-connector-");
  let minX = Infinity;
  let maxZ = -Infinity;
  let minZ = Infinity;
  if (lowerTread || upperTread || landing)
    for (let i = 0; i < positions.length; i += 3) {
      minX = Math.min(minX, positions[i]!);
      maxZ = Math.max(maxZ, positions[i + 2]!);
      minZ = Math.min(minZ, positions[i + 2]!);
    }
  const output: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!, y = positions[i + 1]!, z = positions[i + 2]!;
    const nx = normals[i]!, ny = normals[i + 1]!, nz = normals[i + 2]!;
    let u: number, v: number;
    if (texture.projection === "roof") {
      u = Math.abs(nx) > Math.abs(nz) ? z : x;
      v = y / Math.max(0.2, Math.hypot(nx, nz));
    } else if ((texture.projection === "ground" || lowerTread || upperTread || landing) &&
      (Math.abs(ny) > 0.9 || (gradedConnector && Math.abs(ny) > 0.5))) {
      if (lowerTread || landing) {
        u = x - minX;
        v = maxZ - z;
      } else if (upperTread) {
        u = z - minZ;
        v = x - minX;
      } else {
        u = x;
        v = z;
      }
    } else if (Math.abs(ny) > 0.9) {
      u = x;
      v = z;
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
