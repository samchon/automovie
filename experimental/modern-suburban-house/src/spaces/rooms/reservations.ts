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
import type { IPlanPoint } from "../solid-records";
import { roomLevels, type IRoomSpace } from "./shared";

/**
 * A plan zone a room reserves for one use, world metres: furniture or a
 * fixture body, a storage body, the floor a person uses in front of them, a
 * clear route, or the sweep of a door, drawer or appliance door. The zone is
 * a spaces decision later instances and observations consume; the object in it
 * is not authored here. A `covering` (a rug or mat a few millimetres thick) is
 * walked on, so a route may cross it.
 * @evidence spaces/05-route-network.md Room plans reserve bodies, use areas and clear passage before later objects are placed.
 * @evidence spaces/05-route-network.md#room-route-network Route clearance depends on distinct body, swing and use reservations.
 * @evidence principles/core/source-units.md#source-scope-preservation This zone reserves space for later instances but creates no furniture or fixture.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, kind and metric bounds allow containment and collision checks.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network requires each room's passage bands to remain distinguishable from use reservations; this type carries their separate ids and extents.
 */
export interface IRoomReservation {
  /**
   * @evidence spaces/05-route-network.md Each reserved zone has a stable identifier.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a zone, not a new route node or model.
   * @evidence principles/core/source-units.md#source-substantive-completion A failed clearance check can name the exact reservation.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes fixes the right and rear passage bands, laundry-through-route fixes the Z=[-4.32, -3.42] crossing, and garage-use-routes fixes the cross band Z=[-4.75, -3.85]; id distinguishes the emitted reservation for each tested band.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md Body, use, route and swing zones retain distinct roles; this validator tests route/body overlap while operation states remain separate.
   * @evidence principles/core/source-units.md#source-scope-preservation The kind classifies a reserved area without constructing its object.
   * @evidence principles/core/source-units.md#source-substantive-completion A route is checked against body kinds while coverings and sweeps may overlap it.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network distinguishes a clear passage from fixture, furniture, use, and door swing reservations; kind retains the caller's class for clearance checks.
   */
  kind: "furniture" | "fixture" | "storage" | "covering" | "use" | "route" | "swing";
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan width.
   * @evidence principles/core/source-units.md#source-scope-preservation The range comes from the room's authored layout.
   * @evidence principles/core/source-units.md#source-substantive-completion The horizontal bounds support room containment and route overlap checks.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes supplies the four common-room passage bands' X intervals, and living-through-route supplies the three living room bands; x transports each authored reservation width without selecting a new corridor.
   */
  x: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan depth.
   * @evidence principles/core/source-units.md#source-scope-preservation The range stays within the room or named neighboring space.
   * @evidence principles/core/source-units.md#source-substantive-completion The depth bounds support containment and route overlap checks.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-through-route fixes the mudroom crossing and common-clear-routes fixes the rear/garden approach depths; this field carries each authored Z interval for clearance checks.
   */
  z: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A body may need a vertical envelope above its plan area.
   * @evidence principles/core/source-units.md#source-scope-preservation The range reserves height but builds no object.
   * @evidence principles/core/source-units.md#source-substantive-completion Body and wall-hung zones can be checked separately from clear floor areas.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network fixes the 2.00 m clear band that checkReservations applies to every route through routeClearHeight, and garage-front-opening fixes the overhead guide Y=[2.15, 2.50]; current routes have no y, while optional y records the height of a body, wall-hung or overhead reservation when one is specified.
   */
  y?: readonly [number, number];
  /**
   * The space the zone lies in when it is not the owning room: a zone this
   * room's design decides beside its own door, on the neighbour's floor
   * (laundry's garage-side waiting, the coat closet's front use).
   * @evidence spaces/05-route-network.md Some room-owned uses occur across a door in the adjacent space.
   * @evidence principles/core/source-units.md#source-scope-preservation The override locates a reservation without transferring its author.
   * @evidence principles/core/source-units.md#source-substantive-completion Containment checks use the actual neighboring space outline.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan puts the garage-side wait across laundry-garage-door, while entry-coat-storage puts the coat-use clearance in service-access; space names the neighbouring floor for each room-authored reservation.
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
 * @evidence spaces/05-route-network.md The route must remain in its space and clear of reserved bodies.
 * @evidence spaces/05-route-network.md#room-route-network It checks reservation bounds, unknown spaces and route/body intersections within the designed 2.00 m walking volume while allowing sweeps and coverings.
 * @evidence principles/core/source-units.md#source-scope-preservation Validation reads room-authored zones without moving or generating them.
 * @evidence principles/core/source-units.md#source-substantive-completion Failures name the offending room, zone and crossing body.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The overhead garage guide exposed an unspecified vertical route test; room-route-network now fixes the 2.00 m body band this validator uses.
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
