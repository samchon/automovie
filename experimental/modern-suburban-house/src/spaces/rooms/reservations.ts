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
 * @evidenceReview spaces/05-route-network.md `IRoomReservation` carries each room's named body, use, swing, or clear-route box; `buildHouse` gathers those room records before calling the shared clearance check.
 * @evidence spaces/05-route-network.md#room-route-network Route clearance depends on distinct body, swing and use reservations.
 * @evidenceReview spaces/05-route-network.md#room-route-network The `kind` union retains body, use, swing, covering, and route roles; `checkReservations` compares route boxes with furniture, fixture, and storage bodies in the authored 2.00 m walk band.
 * @evidence principles/core/source-units.md#source-scope-preservation This zone reserves space for later instances but creates no furniture or fixture.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation This interface stores a room-authored reservation's id, kind, box, and optional neighboring space; it declares no part, furniture, or route node of its own.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, kind and metric bounds allow containment and collision checks.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion Required id, kind, and X/Z bounds plus optional Y and space make a usable zone record; the validator reads those fields to locate containment and route/body failures.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network requires each room's passage bands to remain distinguishable from use reservations; this type carries their separate ids and extents.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `room-route-network` already separates empty passage from use and body occupancy; this type transports each room's assigned id and metric interval without choosing a new passage or furniture position.
 */
export interface IRoomReservation {
  /**
   * @evidence spaces/05-route-network.md Each reserved zone has a stable identifier.
   * @evidenceReview spaces/05-route-network.md Each room supplies `id` for one reservation; `checkReservations` carries that id into invalid-plan, escape, and crossing errors without generating a route-node id.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a zone, not a new route node or model.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation The required string names the caller's reservation only; the interface field neither instantiates the reserved object nor adds a graph edge.
   * @evidence principles/core/source-units.md#source-substantive-completion A failed clearance check can name the exact reservation.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion The validator includes `r.id` in its empty-plan, unknown-space, escaping-zone, and route/body messages, making this field a usable failure address.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes fixes the right and rear passage bands, laundry-through-route fixes the Z=[-4.32, -3.42] crossing, and garage-use-routes fixes the cross band Z=[-4.75, -3.85]; id distinguishes the emitted reservation for each tested band.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Common, laundry, and garage room builders supply distinct ids for their assigned passage bands; this field carries those names unchanged into the shared check.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md Body, use, route and swing zones retain distinct roles; this validator tests route/body overlap while operation states remain separate.
   * @evidenceReview spaces/05-route-network.md The union records seven reservation roles; `checkReservations` selects route records against furniture, fixture, and storage, leaving use, swing, and covering overlaps for their separate operating-state checks.
   * @evidence principles/core/source-units.md#source-scope-preservation The kind classifies a reserved area without constructing its object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation The literal union classifies a room-authored zone; it does not create a model or reassign the later object from its room owner.
   * @evidence principles/core/source-units.md#source-substantive-completion A route is checked against body kinds while coverings and sweeps may overlap it.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion `checkReservations` filters three body kinds and route zones by this field; it allows coverings and sweeps to overlap the route during this clearance check.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network distinguishes a clear passage from fixture, furniture, use, and door swing reservations; kind retains the caller's class for clearance checks.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `room-route-network` distinguishes passage from bodies and sequential use; the `kind` field preserves each authored class while the validator applies only the route/body test assigned here.
   */
  kind: "furniture" | "fixture" | "storage" | "covering" | "use" | "route" | "swing";
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan width.
   * @evidenceReview spaces/05-route-network.md Every reservation requires an X pair supplied by its room; the type preserves the authored horizontal span for later containment and passage checks.
   * @evidence principles/core/source-units.md#source-scope-preservation The range comes from the room's authored layout.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation This readonly pair transports the room's X endpoints and contains no default width, corridor alignment, or fixture dimension.
   * @evidence principles/core/source-units.md#source-substantive-completion The horizontal bounds support room containment and route overlap checks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion The validator rejects an empty X interval, samples both ends and centre against the chosen space outline, and uses the pair in its strict route/body overlap predicate.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes supplies the four common-room passage bands' X intervals, and living-through-route supplies the three living room bands; x transports each authored reservation width without selecting a new corridor.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Common and living room builders provide the passage X spans fixed by their clear-route parents; this tuple carries each span without creating another corridor decision.
   */
  x: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan depth.
   * @evidenceReview spaces/05-route-network.md The required Z pair accompanies the room's X pair, locating its body, use, or passage zone in the common plan frame.
   * @evidence principles/core/source-units.md#source-scope-preservation The range stays within the room or named neighboring space.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation This readonly Z range preserves the room's authored depth; the validator tests it against the chosen space outline without modifying its endpoints.
   * @evidence principles/core/source-units.md#source-substantive-completion The depth bounds support containment and route overlap checks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion An empty Z interval fails; both ends and centre are sampled for containment, and the same interval participates in the strict route/body plan overlap test.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-through-route fixes the mudroom crossing and common-clear-routes fixes the rear/garden approach depths; this field carries each authored Z interval for clearance checks.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The laundry crossing supplies Z `[-4.32, -3.42]` and the common room supplies its rear passage depths; this field keeps those authored intervals for the shared check.
   */
  z: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A body may need a vertical envelope above its plan area.
   * @evidenceReview spaces/05-route-network.md The optional Y pair can place an overhead body above the walk band; the validator compares its lower endpoint with the route room's finished floor plus 2.00 m.
   * @evidence principles/core/source-units.md#source-scope-preservation The range reserves height but builds no object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation The optional height interval records occupancy above the caller's plan rectangle and instantiates no wall, guide, or other mesh.
   * @evidence principles/core/source-units.md#source-substantive-completion Body and wall-hung zones can be checked separately from clear floor areas.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion A body with no Y is tested by plan alone; one with Y blocks only when its lower endpoint lies below route floor plus 2.00 m, leaving the garage overhead guide clear.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network fixes the 2.00 m clear band that checkReservations applies to every route through routeClearHeight, and garage-front-opening fixes the overhead guide Y=[2.15, 2.50]; current routes have no y, while optional y records the height of a body, wall-hung or overhead reservation when one is specified.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `room-route-network` fixes the walk band's 2.00 m height and `garage-front-opening` fixes the door guide above it; `y` carries the guide's room-authored interval into that comparison.
   */
  y?: readonly [number, number];
  /**
   * The space the zone lies in when it is not the owning room: a zone this
   * room's design decides beside its own door, on the neighbour's floor
   * (laundry's garage-side waiting, the coat closet's front use).
   * @evidence spaces/05-route-network.md Some room-owned uses occur across a door in the adjacent space.
   * @evidenceReview spaces/05-route-network.md The entry coat-front use zone names `service-access`, and the laundry lower waiting zone names `garage`; each remains in its author room's reservation list across the door.
   * @evidence principles/core/source-units.md#source-scope-preservation The override locates a reservation without transferring its author.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation `placed` keeps the originating room beside each reservation, while `space` selects the named room outline and, for routes, its finished floor without changing authorship.
   * @evidence principles/core/source-units.md#source-substantive-completion Containment checks use the actual neighboring space outline.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion The validator resolves the chosen `space` in the assembled outline map and rejects unknown names or any of its sampled points outside that boundary.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan puts the garage-side wait across laundry-garage-door, while entry-coat-storage puts the coat-use clearance in service-access; space names the neighbouring floor for each room-authored reservation.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Laundry's garage-side wait and entry's coat-front use are placed across their doors by their respective design parents; this field carries those destinations without transferring ownership.
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
 * @evidenceReview spaces/05-route-network.md `checkReservations` checks each room-owned zone against the outline of its named space, then rejects route intersections with furniture, fixture, or storage bodies below the walk-height limit.
 * @evidence spaces/05-route-network.md#room-route-network It checks reservation bounds, unknown spaces and route/body intersections within the designed 2.00 m walking volume while allowing sweeps and coverings.
 * @evidenceReview spaces/05-route-network.md#room-route-network The validator rejects empty X/Z spans, unknown space names, and sampled points outside the space before checking route/body plan overlaps below floor plus 2.00 m; sweeps and coverings are separate states.
 * @evidence principles/core/source-units.md#source-scope-preservation Validation reads room-authored zones without moving or generating them.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation The function reads its assembled `rooms` argument and their reservations, returns void on success, and throws on invalid bounds or crossings without moving a room's zone.
 * @evidence principles/core/source-units.md#source-substantive-completion Failures name the offending room, zone and crossing body.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion Invalid-plan, unknown-space, escaping-zone, and route/body errors name the zone and originating owner; crossing errors also name the body zone and its owner.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The overhead garage guide exposed an unspecified vertical route test; room-route-network now fixes the 2.00 m body band this validator uses.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work `room-route-network` sets a 2.00 m walking volume; `routeClearHeight` adds it to the route room's finished floor, allowing the garage overhead guide to overlap only above that band.
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
