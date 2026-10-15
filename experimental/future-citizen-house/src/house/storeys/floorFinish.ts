import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { identity } from "../identity";
import { rooms } from "../rooms";
import { v } from "../v";
import { finishDepth } from "./finishDepth";

export function floorFinish(a: Assembly, level: 0 | 1): void {
  for (const room of rooms.filter((r) => r.level === level)) {
    const tile = ["powder-utility", "upper-bathroom", "upper-service"].includes(
      room.id
    );
    const pitchX = tile ? 0.45 : 0.18, pitchZ = tile ? 0.45 : 1.8;
    const transforms: Parameters<Assembly["repeat"]>[3] = [];
    for (const [cellIndex, rect] of room.cells.entries()) {
      const nx = Math.ceil((rect[1] - rect[0]) / pitchX), nz = Math.ceil((rect[3] - rect[2]) / pitchZ) + 1;
      for (let x = 0; x < nx; x++)
        for (let z = 0; z < nz; z++) {
          const x0 = rect[0] + x * pitchX, x1 = Math.min(rect[1], x0 + pitchX);
          const start = rect[2] + z * pitchZ - (tile ? 0 : (x % 3) * 0.6);
          const z0 = Math.max(rect[2], start), z1 = Math.min(rect[3], start + pitchZ);
          if (z1 - z0 < 0.01) continue;
          transforms.push({
            id: cellIndex + "-" + x + "-" + z,
            translation: v(
              (x0 + x1) / 2,
              datum.floors[level] - finishDepth / 2,
              (z0 + z1) / 2
            ),
            scale: v(x1 - x0 - 0.0015, finishDepth, z1 - z0 - 0.0015),
            rotation: identity,
          });
        }
      a.environment.surfaces.push({
        space: room.id,
        surface: {
          id: room.id + "-floor-" + cellIndex,
          kind: "floor",
          polygon: [
            v(rect[0], 0, rect[2]),
            v(rect[1], 0, rect[2]),
            v(rect[1], 0, rect[3]),
            v(rect[0], 0, rect[3]),
          ],
          height: { kind: "constant", value: datum.floors[level] },
        },
      });
    }
    a.repeat(
      room.id + "-floor-boards",
      level === 0 ? "ground-storey" : "upper-storey",
      tile ? "tile" : "oak",
      transforms
    );
  }
}
