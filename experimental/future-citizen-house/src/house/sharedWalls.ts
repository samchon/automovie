import { datum } from "./datum";
import { portals } from "./portals";
import { rooms } from "./rooms";
import { Wall } from "./Wall";

/** Shared walls use the overlap of opposing clear faces, including L-cell seams. */
export function sharedWalls(): Wall[] {
  const walls: Wall[] = [];
  for (let i = 0; i < rooms.length; i++)
    for (let j = i + 1; j < rooms.length; j++) {
      const left = rooms[i], right = rooms[j];
      if (left.level !== right.level) continue;
      for (const a of left.cells)
        for (const b of right.cells) {
          for (const axis of ["x", "z"] as const) {
            const lo = axis === "x" ? 0 : 2, cross = axis === "x" ? 2 : 0;
            const forward = Math.abs(b[lo] - a[lo + 1] - datum.wall) < 1e-7;
            const reverse = Math.abs(a[lo] - b[lo + 1] - datum.wall) < 1e-7;
            const start = Math.max(a[cross], b[cross]), end = Math.min(a[cross + 1], b[cross + 1]);
            if ((!forward && !reverse) || end - start < 1e-7) continue;
            const portal = portals.find(
              (p) => [p.from, p.to].includes(left.id) &&
                [p.from, p.to].includes(right.id)
            );
            const fits = portal &&
              portal.center - portal.width / 2 - 0.06 >= start - 1e-7 &&
              portal.center + portal.width / 2 + 0.06 <= end + 1e-7;
            const pair = [left.id, right.id]
              .sort((a, b) => a.localeCompare(b))
              .join("/");
            const names: Record<string, string> = {
              "powder-utility/storage-1f": "wall-powder-storage",
              "common-room/flex-workroom": "wall-flex-common",
              "child-bedroom-1/child-bedroom-2": "wall-child-one-two",
              "child-bedroom-2/primary-bedroom": "wall-child-two-primary",
              "upper-service/upper-storage": "wall-service-storage",
              "upper-bathroom/upper-storage": "wall-storage-bath",
              "primary-bedroom/upper-bathroom": "wall-bath-primary",
              "upper-corridor/upper-service": "wall-service-corridor-front",
              "entry/storage-1f": "wall-entry-storage",
            };
            const id = fits
              ? portal.wall
              : (names[pair] ?? "wall-" + pair.replace("/", "-"));
            const plane = forward
              ? (a[lo + 1] + b[lo]) / 2
              : (b[lo + 1] + a[lo]) / 2;
            const prior = walls.find(
              (w) => w.id === id &&
                w.axis === axis &&
                Math.abs(w.plane - plane) < 1e-7 &&
                start <= w.b + 1e-7 &&
                end >= w.a - 1e-7
            );
            if (prior) {
              prior.a = Math.min(prior.a, start);
              prior.b = Math.max(prior.b, end);
            }
            else
              walls.push({
                id,
                axis,
                plane,
                a: start,
                b: end,
                level: left.level,
                adjacent: [left.id, right.id],
              });
          }
        }
    }
  return walls;
}
