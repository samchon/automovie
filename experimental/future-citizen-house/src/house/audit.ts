import { validateBuiltEnvironment, builtSpaceContainsPoint, builtSpaceVolumeBounds, builtConvexCellVertices, builtEnvironmentPlacementBounds, builtEnvironmentEnvelopeFaces, builtEnvironmentEnvelopeCorners } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
/** Exact topology and metric facts. Bounds are never promoted to triangle
 * collision or human-use certificates; absent measurement remains explicit. */
export function auditHouse(environment: IAutoMovieBuiltEnvironment) {
  const native = validateBuiltEnvironment({ environment });
  const errors: string[] = [];
  if (!native.success) errors.push(...native.violations.map((v) => JSON.stringify(v)));
  const rooms = environment.spaces.filter((s) => s.kind === "room");
  for (const room of rooms) {
    const parent = environment.spaces.find((s) => s.id === room.parent);
    if (!parent || parent.kind !== "storey") errors.push(room.id + ": missing storey parent");
    else for (const cell of room.cells) for (const p of builtConvexCellVertices(cell)) if (!builtSpaceContainsPoint(parent, p)) errors.push(room.id + "/" + cell.id + ": vertex outside " + parent.id);
  }
  const reached = new Set(["entry"]);
  for (let changed = true; changed;) {
    changed = false;
    for (const c of environment.connectors) {
      if (reached.has(c.from) && !reached.has(c.to)) { reached.add(c.to); changed = true; }
      if (c.bidirectional && reached.has(c.to) && !reached.has(c.from)) { reached.add(c.from); changed = true; }
    }
  }
  for (const room of rooms) if (!reached.has(room.id)) errors.push(room.id + ": disconnected from entry");
  const stairs = environment.connectors.filter((c) => c.kind === "stair");
  if (stairs.length !== 1) errors.push("single-stair: expected one internal stair, found " + stairs.length);
  const doors = environment.openings.filter((o) => o.kind === "door" || o.kind === "passage");
  const roomsById = new Map(environment.spaces.map((s) => [s.id, s]));
  for (const c of environment.connectors) {
    if (!builtSpaceContainsPoint(roomsById.get(c.from)!, c.route[0])) errors.push(c.id + ": first station outside from space");
    if (!builtSpaceContainsPoint(roomsById.get(c.to)!, c.route.at(-1)!)) errors.push(c.id + ": last station outside to space");
  }
  const treads = environment.elements.filter((e) => e.kind === "stair-tread").map((e) => ({ id: e.id, bounds: builtEnvironmentPlacementBounds({ environment, target: { kind: "element", id: e.id } }) }));
  const roomAreas = rooms.map((room) => ({ id: room.id, parent: room.parent, area: room.cells.reduce((total, cell) => { const b = builtSpaceVolumeBounds({ ...room, cells: [cell] }); return total + (b ? (b.max.x - b.min.x) * (b.max.z - b.min.z) : 0); }, 0) }));
  return { errors, native, roomAreas, reachable: [...reached].sort((a, b) => a.localeCompare(b)), treads, stairs: stairs.map((s) => ({ id: s.id, route: s.route, width: s.width, rise: s.route.at(-1)!.y - s.route[0].y })), doorStates: doors.map((d) => ({ id: d.id, state: d.operation?.state ?? "passage", boundary: d.boundary, profile: d.profile })), faces: builtEnvironmentEnvelopeFaces(environment), corners: builtEnvironmentEnvelopeCorners(environment), limits: { cylinderClearance: "unverified: no continuous swept-cylinder collision query executed", furnitureUse: "unverified", structuralCodeEnergyServices: "unverified", appearance: "unverified until current GPU frames are inspected", outlineGrounding: "not computed here: the y=-0.45..0 outline band is read from compiled element bounds" } };
}
