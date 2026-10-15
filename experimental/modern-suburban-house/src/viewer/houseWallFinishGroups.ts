/**
 * Viewer projection of authored building finishes onto the existing house
 * solids. Spaces still own geometry and role/colour surface addresses; the
 * material source owns the swatch, response and metric tile. The structural
 * floor base alone retains an explicitly unresolved preview value.
 */

import type { HousePartRole } from "../types/HousePartRole";
import { PALETTE } from "../spaces/PALETTE";
import { HousePreviewFinish } from "./HousePreviewFinish";
import { houseFinish } from "./houseFinish";

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
): { suffix: string; finish: HousePreviewFinish; indices: number[] }[] {
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

