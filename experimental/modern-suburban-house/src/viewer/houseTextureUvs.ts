import { HousePreviewFinish } from "./HousePreviewFinish";

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
  finish: HousePreviewFinish,
  partId?: string
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
