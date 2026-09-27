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
 * @evidenceReview spaces/05-route-network.md #60bf203 IRoomReservation carries each room-chosen zone's id, kind, plan bounds, optional height and neighboring space; buildHouse invokes this file's validator before later model placement.
 * @evidence spaces/05-route-network.md#room-route-network Route clearance depends on distinct body, swing and use reservations.
 * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 The kind union distinguishes body, use, swing and route records; checkReservations blocks only route/body crossings below the 2.00 m band, leaving use and swing overlaps available for separate operating states.
 * @evidence principles/core/source-units.md#source-scope-preservation This zone reserves space for later instances but creates no furniture or fixture.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This interface stores room-authored occupancy bounds and produces no part, mesh, furniture or route node.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, kind and metric bounds allow containment and collision checks.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The id and metric bounds identify each failing zone; the validator reads kind and x/z/y for containment and low route/body intersections across the assembled rooms.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network requires each room's passage bands to remain distinguishable from use reservations; this type carries their separate ids and extents.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The reviewed route-network unit already separates passage, use and body reservations; this record transports each caller's id and bounds, as the common room's distinct route and furniture zones demonstrate.
 */
export interface IRoomReservation {
  /**
   * @evidence spaces/05-route-network.md Each reserved zone has a stable identifier.
   * @evidenceReview spaces/05-route-network.md #60bf203 The required id remains the room author's stable address for one reservation; the validator includes it in containment and route-crossing diagnostics.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a zone, not a new route node or model.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This string identifies a reserved zone and does not create a route node, object or surface.
   * @evidence principles/core/source-units.md#source-substantive-completion A failed clearance check can name the exact reservation.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Empty-plan, unknown-space, escaping-zone and route/body refusal messages include this id, so the offending reservation can be located.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes fixes the right and rear passage bands, laundry-through-route fixes the Z=[-4.32, -3.42] crossing, and garage-use-routes fixes the cross band Z=[-4.75, -3.85]; id distinguishes the emitted reservation for each tested band.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Common-clear-routes, laundry-through-route and garage-use-routes already name their passage bands; this field retains common-main-route-back, laundry-through-route and garage-cross-route without choosing another route.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md Body, use, route and swing zones have different clearance behavior.
   * @evidenceReview spaces/05-route-network.md #60bf203 The union records furniture, fixture, storage, covering, use, route and swing separately; this validator treats use and swing alike because only body kinds are compared with routes, a narrower behavior than the evidence sentence suggests.
   * @evidence principles/core/source-units.md#source-scope-preservation The kind classifies a reserved area without constructing its object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The kind is a closed classification of a reservation, while the room owner remains responsible for any eventual object.
   * @evidence principles/core/source-units.md#source-substantive-completion A route is checked against body kinds while coverings and sweeps may overlap it.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Furniture, fixture and storage are selected as blocking bodies; route records are tested against them, while covering and swing remain nonblocking in this check.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network distinguishes a clear passage from fixture, furniture, use, and door swing reservations; kind retains the caller's class for clearance checks.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The route-network unit fixes body obstruction versus door operation and room use; kind keeps the room's class, and checkReservations compares only routes with furniture, fixture or storage bodies.
   */
  kind: "furniture" | "fixture" | "storage" | "covering" | "use" | "route" | "swing";
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan width.
   * @evidenceReview spaces/05-route-network.md #60bf203 Each room supplies this required X interval for its own body, use or route band; the shared type fixes its metric shape without selecting a room width.
   * @evidence principles/core/source-units.md#source-scope-preservation The range comes from the room's authored layout.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The readonly X pair carries the producing room's plan width and does not derive a new corridor or fixture size.
   * @evidence principles/core/source-units.md#source-substantive-completion The horizontal bounds support room containment and route overlap checks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The validator refuses a reversed X pair, samples its left, centre and right positions inside the target space, and compares its overlap with a body's X interval.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes supplies the four common-room passage bands' X intervals, and living-through-route supplies the three living room bands; x transports each authored reservation width without selecting a new corridor.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Common-clear-routes and living-through-route supply their passage X bands, including living's [-4.90, -4.00] main band; this tuple carries the authored interval without choosing a corridor.
   */
  x: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan depth.
   * @evidenceReview spaces/05-route-network.md #60bf203 The required Z interval records the depth of each room-chosen reservation alongside its X span, allowing the route check to place it on the shared plan.
   * @evidence principles/core/source-units.md#source-scope-preservation The range stays within the room or named neighboring space.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This field carries room-authored depth; the validator checks its samples against the named space outline instead of moving or extending it.
   * @evidence principles/core/source-units.md#source-substantive-completion The depth bounds support containment and route overlap checks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The validator rejects an empty Z range, samples its near, centre and far positions for containment, and uses it in the route/body overlap test.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-through-route fixes the mudroom crossing and common-clear-routes fixes the rear/garden approach depths; this field carries each authored Z interval for clearance checks.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Laundry-through-route supplies Z = [-4.32, -3.42], while common-clear-routes supplies the rear and garden depths; z transports each authored interval into checkReservations.
   */
  z: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A body may need a vertical envelope above its plan area.
   * @evidenceReview spaces/05-route-network.md #60bf203 Optional Y describes an overhead or wall-hung body; the validator compares its lower face with floor plus the 2.00 m walking band before marking a route crossing.
   * @evidence principles/core/source-units.md#source-scope-preservation The range reserves height but builds no object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This optional height range reserves vertical occupancy but emits no body or wall geometry.
   * @evidence principles/core/source-units.md#source-substantive-completion Body and wall-hung zones can be checked separately from clear floor areas.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f A body without Y blocks by plan; one with Y blocks only below the route floor plus 2.00 m, which lets the garage overhead guide remain above its walking band.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network fixes the 2.00 m clear band that checkReservations applies to every route through routeClearHeight, and garage-front-opening fixes the overhead guide Y=[2.15, 2.50]; current routes have no y, while optional y records the height of a body, wall-hung or overhead reservation when one is specified.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The route-network unit fixes the 2.00 m walking band and garage-front-opening fixes guide Y = [2.15, 2.50]; optional y records a body's actual vertical interval for that existing clearance comparison.
   */
  y?: readonly [number, number];
  /**
   * The space the zone lies in when it is not the owning room: a zone this
   * room's design decides beside its own door, on the neighbour's floor
   * (laundry's garage-side waiting, the coat closet's front use).
   * @evidence spaces/05-route-network.md Some room-owned uses occur across a door in the adjacent space.
   * @evidenceReview spaces/05-route-network.md #60bf203 Entry's coat-front use remains entry-authored but names service-access here; laundry's lower waiting similarly names garage, matching the route document's cross-door use areas.
   * @evidence principles/core/source-units.md#source-scope-preservation The override locates a reservation without transferring its author.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The validator retains the originating room and its owner in the placed record while this optional field selects the neighboring floor for containment.
   * @evidence principles/core/source-units.md#source-substantive-completion Containment checks use the actual neighboring space outline.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The validator looks up this space in the assembled room-outline map and refuses an unknown destination or a sampled zone outside its boundary.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan puts the garage-side wait across laundry-garage-door, while entry-coat-storage puts the coat-use clearance in service-access; space names the neighbouring floor for each room-authored reservation.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Laundry-plan assigns the garage-side waiting band and entry-coat-storage assigns front use in service-access; space preserves those existing destinations without transferring the reservation's room author.
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
 * @evidenceReview spaces/05-route-network.md #60bf203 The validator refuses a zone outside its named room outline and a route intersecting a low furniture, fixture or storage body, as the route document requires.
 * @evidence spaces/05-route-network.md#room-route-network It checks reservation bounds, unknown spaces and route/body intersections within the designed 2.00 m walking volume while allowing sweeps and coverings.
 * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 Empty plans, unknown spaces and escaping samples throw before route/body testing; low bodies crossing the 2.00 m band throw, while use, swing and covering records do not block that route.
 * @evidence principles/core/source-units.md#source-scope-preservation Validation reads room-authored zones without moving or generating them.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This function reads the assembled room and reservation records, returns void, and only throws diagnostics; it neither creates nor moves zones.
 * @evidence principles/core/source-units.md#source-substantive-completion Failures name the offending room, zone and crossing body.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The refusal messages identify the originating room owner and reservation id, with the crossing body's id and owner when two zones conflict.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The overhead garage guide exposed an unspecified vertical route test; room-route-network now fixes the 2.00 m body band this validator uses.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The earlier route-network revision fixed the 2.00 m band after the garage guide exposed the missing vertical test; routeClearHeight still applies it above roomLevels, leaving that guide above the band.
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
