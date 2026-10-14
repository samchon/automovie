/**
 * Room-authored occupancy reservations and their shared clearance check.
 *
 * Each room still chooses the identity, kind and metric box of every zone.
 * `IRoomSpace` in shared.ts carries these records into the house assembly;
 * `buildHouse` calls checkReservations after collecting all rooms so a route
 * can be checked against bodies owned by another room. The validator reads
 * room outlines and finished floors, refuses missing or escaping zones and
 * low body crossings, and never moves a room-owned reservation. Changing a
 * zone or a room datum requires rebuilding the route and observation results.
 */
import type { IPlanPoint } from "../../types/IPlanPoint";
import { roomLevels, type IRoomSpace } from "./shared";

/**
 * A plan zone a room reserves for one use, world metres: furniture or a
 * fixture body, a storage body, the floor a person uses in front of them, a
 * clear route, or the sweep of a door, drawer or appliance door. The zone is
 * a spaces decision later instances and observations consume; the object in it
 * is not authored here. A `covering` (a rug or mat a few millimetres thick) is
 * walked on, so a route may cross it.
 */
export interface IRoomReservation {
  id: string;
  kind: "furniture" | "fixture" | "storage" | "covering" | "use" | "route" | "swing";
  x: readonly [number, number];
  z: readonly [number, number];
  y?: readonly [number, number];
  /**
   * The space the zone lies in when it is not the owning room: a zone this
   * room's design decides beside its own door, on the neighbour's floor
   * (laundry's garage-side waiting, the coat closet's front use).
   */
  space?: string;
}

/** Whether a plan point lies inside or on a rectilinear outline. */
const inOutline = (outline: readonly IPlanPoint[], x: number, z: number): boolean => {
  const eps = 1e-9;
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i]!;
    const b = outline[j]!;
    const onEdge = (a.x === b.x && Math.abs(x - a.x) < eps && z >= Math.min(a.z, b.z) - eps && z <= Math.max(a.z, b.z) + eps) || (a.z === b.z && Math.abs(z - a.z) < eps && x >= Math.min(a.x, b.x) - eps && x <= Math.max(a.x, b.x) + eps);
    if (onEdge) return true;
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
};

/**
 * Refuse any reservation that leaves the space it lies in (its `space`, else
 * its owning room), and any clear route that crosses a furniture, fixture or
 * storage body below 2.00 m above the room floor, whichever room owns either. Door and
 * appliance sweeps and coverings may cross routes: operating a door and walking
 * through are separate states (05), and a rug is walked on.
 */
export const checkReservations = (rooms: readonly IRoomSpace[]): void => {
  const routeClearHeight = 2.0;
  const outline = new Map(rooms.map((r) => [r.id, r.outline]));
  const placed = rooms.flatMap((room) =>
    (room.reservations ?? []).map((r) => ({
      room,
      r,
      space: r.space ?? room.id,
    })),
  );
  for (const { room, r, space } of placed) {
    if (!(r.x[0] < r.x[1] && r.z[0] < r.z[1])) throw new Error(
      `${room.owner}: reservation "${r.id}" has an empty plan`,
    );
    const shape = outline.get(space);
    if (shape === undefined) throw new Error(
      `${room.owner}: reservation "${r.id}" lies in unknown space "${space}"`,
    );
    const samples = [r.x[0], (r.x[0] + r.x[1]) / 2, r.x[1]].flatMap((x) =>
      [r.z[0], (r.z[0] + r.z[1]) / 2, r.z[1]].map((z) => [x, z] as const),
    );
    if (samples.some(([x, z]) => !inOutline(shape, x, z))) throw new Error(
      `${room.owner}: reservation "${r.id}" leaves space "${space}"`,
    );
  }
  const bodies = placed.filter(
    (p) => p.r.kind === "furniture" || p.r.kind === "fixture" || p.r.kind === "storage",
  );
  for (const route of placed.filter((p) => p.r.kind === "route")) {
    const routeRoom = rooms.find((room) => room.id === route.space);
    if (routeRoom === undefined) throw new Error(
      `${route.room.owner}: route "${route.r.id}" has no room floor`,
    );
    const head = roomLevels(routeRoom)[0] + routeClearHeight;
    for (const body of bodies) {
      if (route.space === body.space && (body.r.y === undefined || body.r.y[0] < head - 1e-9) && route.r.x[0] < body.r.x[1] - 1e-9 && body.r.x[0] < route.r.x[1] - 1e-9 && route.r.z[0] < body.r.z[1] - 1e-9 && body.r.z[0] < route.r.z[1] - 1e-9)
        throw new Error(
          `${route.room.owner}: route "${route.r.id}" crosses "${body.r.id}" (${body.room.owner})`,
        );
    }
  }
};
