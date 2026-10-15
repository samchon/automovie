import type { IHousePart } from "../types/IHousePart";
import { solid } from "./solid";
import { occupied } from "./occupied";

/** A vertical closure is internal when its outward 1 cm probe enters another roof slab. */

export const verifyRoofInternalFaces = (parts: readonly Pick<IHousePart, "id" | "mesh">[]): void => {
  const shapes = parts.map((part) => solid(part.id, part.mesh));
  const buried: string[] = [];
  for (const shape of shapes) for (const face of shape.triangles) {
    const { a, b, c } = face;
    const nx = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
    const ny = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
    const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const magnitude = Math.hypot(nx, ny, nz);
    if (magnitude < 1e-12 || Math.abs(ny / magnitude) > 1e-6) continue;
    const centre = {
      x: (a.x + b.x + c.x) / 3,
      y: (a.y + b.y + c.y) / 3,
      z: (a.z + b.z + c.z) / 3,
    };
    for (const direction of [-1, 1]) {
      const x = centre.x + direction * 0.01 * nx / magnitude;
      const z = centre.z + direction * 0.01 * nz / magnitude;
      const own = occupied(shape, x, z);
      if (own !== null && centre.y >= own[0] - 1e-6 && centre.y <= own[1] + 1e-6) continue;
      for (const other of shapes) {
        if (other === shape || x < other.x[0] || x > other.x[1] || z < other.z[0] || z > other.z[1]) continue;
        const interval = occupied(other, x, z);
        if (interval !== null && centre.y > interval[0] + 1e-6 && centre.y < interval[1] - 1e-6)
          buried.push(
            `${shape.id} inside ${other.id} at ${JSON.stringify(centre)}`
          );
      }
    }
  }
  if (buried.length) throw new Error(
    `internal roof closure faces (${buried.length}):\n${buried.join("\n")}`
  );
};
