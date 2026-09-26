/**
 * Room record shape and the two solids every room owner emits: its floor
 * finish and the partitions `07-boundary-assembly.md#interior-boundary-ownership`
 * assigns to it.
 *
 * Heights follow the layer splits: a ground-storey finish fills the top
 * 0.025 m above the support base (`10-ground-floor.md`), an upper-storey finish
 * the top 0.025 m of the interstorey reservation (`08-floor-assembly.md`).
 * A ceiling finish fills the 0.015 m above the finished ceiling (08 for the
 * ground storey, `09-ceiling-assembly.md#upper-ceiling-closure` for the
 * upper). A partition runs from its storey's finished floor to its finished
 * ceiling (`07-boundary-assembly.md#interior-boundary-ownership`); under a
 * door void each room's floor finish reaches the partition mid-plane
 * (`#interior-boundary-junctions`) through `doorFloor`.
 *
 * Consumers: the fifteen `rooms/*.ts` owners. This helper owns no surface.
 */
import { PALETTE } from "../palette";
import {
  part,
  slab,
  straightWall,
  type IHousePart,
  type IPlanPoint,
  type IWallHole,
} from "../solids";
import {
  CEILING_FINISH,
  ceilingOf,
  floorOf,
  GROUND_LAYERS,
  INTERSTOREY_FLOOR_FINISH,
  type StoreyId,
} from "../storeys";

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
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The room-route parent already requires clear routes beside assigned use zones.
 */
export interface IRoomReservation {
  /**
   * @evidence spaces/05-route-network.md Each reserved zone has a stable identifier.
   * @evidence principles/core/source-units.md#source-scope-preservation This names a zone, not a new route node or model.
   * @evidence principles/core/source-units.md#source-substantive-completion A failed clearance check can name the exact reservation.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network names front-entry, service-access, and upper-hall connections, while common-clear-routes names its four bands; reservation ids keep those authored paths separately diagnosable.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md Body, use, route and swing zones have different clearance behavior.
   * @evidence principles/core/source-units.md#source-scope-preservation The kind classifies a reserved area without constructing its object.
   * @evidence principles/core/source-units.md#source-substantive-completion A route is checked against body kinds while coverings and sweeps may overlap it.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The route design already distinguishes passage from placed bodies.
   */
  kind: "furniture" | "fixture" | "storage" | "covering" | "use" | "route" | "swing";
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan width.
   * @evidence principles/core/source-units.md#source-scope-preservation The range comes from the room's authored layout.
   * @evidence principles/core/source-units.md#source-substantive-completion The horizontal bounds support room containment and route overlap checks.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes supplies the four room bands' X spans and entry-use-routes supplies the entry passage width; this field transports each owner's span without choosing another width.
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
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network limits a clear route to 2.00 m above finished floor and garage-storage-use gives overhead guide heights; optional Y lets those distinct reservations coexist without changing either height.
   */
  y?: readonly [number, number];
  /**
   * The space the zone lies in when it is not the owning room: a zone this
   * room's design decides beside its own door, on the neighbour's floor
   * (laundry's garage-side waiting, the coat closet's front use).
   * @evidence spaces/05-route-network.md Some room-owned uses occur across a door in the adjacent space.
   * @evidence principles/core/source-units.md#source-scope-preservation The override locates a reservation without transferring its author.
   * @evidence principles/core/source-units.md#source-substantive-completion Containment checks use the actual neighboring space outline.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-through-route reserves garage-side waiting across laundry-garage-door and entry-coat-storage reserves use in front-entry; space points each reservation at the floor it occupies while its room author stays fixed.
   */
  space?: string;
}

/**
 * One interior space as its plan owner declares it.
 * @evidence spaces/03-surface-owners.md Each room owns its finished inner outline and visible floor/ceiling surfaces.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The room record keeps its owner, outline, finish and reserved uses together.
 * @evidence principles/core/source-units.md#source-scope-preservation The shared type describes each room author's values without picking a plan for it.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry, storey, and finish reach environment assembly; reservations reach checkReservations and the measurement tools.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns each room its inner walls, floor, ceiling, and reveal; this record carries those four outputs together without reallocating a face.
 */
export interface IRoomSpace {
  /**
   * @evidence spaces/03-surface-owners.md The room's stable id ties its finish to its spatial record.
   * @evidence principles/core/source-units.md#source-scope-preservation This id refers to the room owner's space, not a helper-owned room.
   * @evidence principles/core/source-units.md#source-substantive-completion Routes and observations can address the same room.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network names front-entry and living-room as separate nodes joined by entry-living-door; id preserves those authored addresses in the environment.
   */
  id: string;
  /**
   * @evidence spaces/03-surface-owners.md The room record retains its specific source owner.
   * @evidence principles/core/source-units.md#source-scope-preservation The shared helper never replaces the room's author.
   * @evidence principles/core/source-units.md#source-substantive-completion Emitted parts can trace back to that source.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns the entry, living room, and common room to their respective room files; owner retains the emitting file for each finish part.
   */
  owner: string;
  /**
   * @evidence spaces/03-surface-owners.md A room finish belongs to one of the two storey surface populations.
   * @evidence principles/core/source-units.md#source-scope-preservation The field selects the room's existing storey, not a new floor.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor and ceiling helpers can read the correct datums.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network places entry and common below the stair and upper-hall with five doors above it; storey records that plan's ground/upper assignment.
   */
  storey: StoreyId;
  /**
   * @evidence spaces/03-surface-owners.md The room owner supplies its finished inner perimeter.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the author's inner finish boundary, not a cloned structural wall.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered points produce the room's floor and ceiling surfaces.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff makes each room's finished inner perimeter the floor/ceiling owner; this ring carries the room builder's outline without copying the structural wall plan.
   */
  outline: readonly IPlanPoint[];
  /**
   * @evidence spaces/03-surface-owners.md The room author selects its floor's blocking base colour.
   * @evidence principles/core/source-units.md#source-scope-preservation This colour stays with the room finish, leaving material optics elsewhere.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor geometry carries an inspectable visual distinction.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns the visible floor finish to the room source and leaves material optics elsewhere; floor carries that source's base colour.
   */
  floor: number;
  /**
   * Finished floor and ceiling heights when they differ from the storey's
   * datums (the garage, 01 ground-threshold-datums); absent for every room
   * that stands on its storey's finished floor.
   * @evidence spaces/03-surface-owners.md Garage finish levels may differ from ordinary room datums.
   * @evidence principles/core/source-units.md#source-scope-preservation The override stays within the room's assigned storey.
   * @evidence principles/core/source-units.md#source-substantive-completion A nonstandard room can give its actual floor and ceiling heights.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage threshold exception already exists in storey design.
   */
  levels?: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The room record carries route and use reservations beside its surface owner outputs.
   * @evidence spaces/05-route-network.md#room-route-network The reservation list supplies the room's internal occupancy bands to the route check.
   * @evidence principles/core/source-units.md#source-scope-preservation The list reserves later objects without building them.
   * @evidence principles/core/source-units.md#source-substantive-completion Route validation can inspect each room's reserved uses.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network requires each room's internal use and route bands alongside its connection; reservations carries those room-owned zones for the 2.00 m clearance check.
   */
  reservations?: readonly IRoomReservation[];
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

/**
 * Finished floor and ceiling heights of a room.
 * @evidence spaces/01-storeys.md Normal rooms use storey datums; garage can supply its own finished levels.
 * @evidence spaces/01-storeys.md#storey-datums The default pair comes from the assigned storey's floor and ceiling.
 * @evidence spaces/01-storeys.md#ground-threshold-datums A room-level override preserves the garage threshold exception.
 * @evidence principles/core/source-units.md#source-scope-preservation The function reads established datums and does not choose a new floor.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns an explicit height pair for downstream ceiling and observation construction.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums fixes ordinary room floors and ceilings, while ground-threshold-datums puts the garage floor at -0.15 m; roomLevels chooses that explicit override without a third level.
 */
export const roomLevels = (room: IRoomSpace): readonly [number, number] => room.levels ?? [floorOf(room.storey), ceilingOf(room.storey)];

/**
 * A closed storage volume a room owns and uses through a real opening (coat
 * closet, linen closet): a logical space of its own, never a route node.
 * @evidence spaces/05-route-network.md Closet and linen storage are accessible from rooms without becoming passage nodes.
 * @evidence spaces/05-route-network.md#room-route-network Storage volume has its own id while the door remains on the room route.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a space reservation, not an authored storage model.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and full world box let the environment expose the storage volume.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network keeps the entry coat and upper linen volumes outside passage edges while their door openings remain reachable; this type records each storage cell separately.
 */
export interface IStorageSpace {
  /**
   * @evidence spaces/05-route-network.md A storage volume has a stable address separate from the room route.
   * @evidence principles/core/source-units.md#source-scope-preservation The id names the closet volume, not a new route connection.
   * @evidence principles/core/source-units.md#source-substantive-completion Environment assembly can expose the exact storage space.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage names coat-storage and upper-linen-storage names the hall linen volume; their ids remain distinct from front-entry and upper-hall.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a horizontal width.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval stays inside the authored closet.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world X.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage derives its X start from tread seven plus 0.07 m, and upper-linen-storage fixes its own hall-side width; this interval carries each closet's owner value.
   */
  x: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a vertical interval.
   * @evidence principles/core/source-units.md#source-scope-preservation This is interior clearance, not a shelf model.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world Y.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage fixes its body top at Y=2.15 and upper-linen-storage fixes the linen volume from upper floor through 2.20 m height; this range carries those closet-owned limits, not room ceiling height.
   */
  y: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a plan depth.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval remains the author's closet reservation.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world Z.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage reserves depth beside the stair and upper-linen-storage reserves its hall recess; this Z interval retains those different authored depths.
   */
  z: readonly [number, number];
}

/**
 * What one room owner emits: its space record and the solids it owns.
 * @evidence spaces/03-surface-owners.md A room source emits its finished surfaces and room record as one owned unit.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish parts stay with their room while storage records remain separately addressable.
 * @evidence principles/core/source-units.md#source-scope-preservation The interface preserves one room author and does not assign another room's partition.
 * @evidence principles/core/source-units.md#source-substantive-completion Space, parts and optional storage are all available for house assembly.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns every room one file for its finishes, with coat/linen as consuming-room storage; IRoomBuild returns that file's space, parts, and optional storage together.
 */
export interface IRoomBuild {
  /**
   * @evidence spaces/03-surface-owners.md The emitting room retains its own plan record.
   * @evidence principles/core/source-units.md#source-scope-preservation This field does not create or claim an adjacent room.
   * @evidence principles/core/source-units.md#source-substantive-completion House assembly can collect the room's id, outline and uses.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan and common-room-plan each fix their own room outline and doors; space preserves the respective IRoomSpace rather than composing a new plan.
   */
  space: IRoomSpace;
  /**
   * @evidence spaces/03-surface-owners.md Only the room's own finishes and partitions enter its emitted part list.
   * @evidence principles/core/source-units.md#source-scope-preservation Another room's wall or finish is not emitted here.
   * @evidence principles/core/source-units.md#source-substantive-completion The viewer receives the actual room floor, ceiling and assigned walls.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff leaves each room's wall, floor, ceiling, and reveal with its room file; parts carries only the builder's emitted bodies.
   */
  parts: IHousePart[];
  /**
   * @evidence spaces/03-surface-owners.md A room may expose its own closet or linen volume.
   * @evidence principles/core/source-units.md#source-scope-preservation These are space records, not added storage furniture.
   * @evidence principles/core/source-units.md#source-substantive-completion House assembly can include the room's usable storage cells.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff keeps coat storage with entry and linen storage with upper-hall, while the walk-in wardrobe owns a room file; storages carries only the shallow volumes.
   */
  storages?: IStorageSpace[];
}

/** Depth of the floor finish bundle below a storey's finished floor. */
const finishDepth = (storey: StoreyId): number => (storey === "ground-storey"
  ? GROUND_LAYERS.finish
  : INTERSTOREY_FLOOR_FINISH);

/**
 * Floor finish of one room: its outline over the top finish layer.
 * @evidence spaces/03-surface-owners.md The room source owns the visible floor inside its finished perimeter.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The returned part keeps the room's id, owner, outline and floor colour.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper reads the room's assigned plan and layer depth without choosing a new one.
 * @evidence principles/core/source-units.md#source-substantive-completion It emits a closed finish slab at the storey's finished floor.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns visible floor finish to the room and main-ground-floor-base fixes its finish thickness; roomFloor extrudes that room outline to its floor datum.
 */
export const roomFloor = (room: IRoomSpace): IHousePart => {
  const top = floorOf(room.storey);
  return part(
    `${room.id}-floor`,
    room.owner,
    "floor",
    room.floor,
    slab({ outline: room.outline, bottom: top - finishDepth(room.storey), top }),
  );
};

/**
 * The room's share of the floor finish under one interior door void: the
 * rectangle from the room's partition face to the partition mid-plane across
 * the door width, in the room's finish layer.
 * @evidence spaces/03-surface-owners.md Each adjacent room owns its half of the visible floor under an interior door.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff This part extends the room finish to the partition centre without claiming the other room's floor.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller supplies the door interval; the helper preserves its room owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The door-width finish becomes a closed slab in the same layer as the room floor.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-junctions requires the finished floor to meet each door void through the wall depth; doorFloor fills only that caller-supplied threshold strip.
 */
export const doorFloor = (room: IRoomSpace, doorId: string, x: readonly [number, number], z: readonly [number, number]): IHousePart => {
  const top = floorOf(room.storey);
  return part(
    `${room.id}-${doorId}-floor`,
    room.owner,
    "floor",
    room.floor,
    slab({ outline: box(x, z), bottom: top - finishDepth(room.storey), top }),
  );
};

/**
 * Visible ceiling finish of one room: its outline over the 0.015 m above its
 * storey's finished ceiling, under the interstorey structure (ground) or the
 * upper ceiling base (upper).
 * @evidence spaces/03-surface-owners.md The room source owns its visible ceiling finish.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The part follows the room's finished outline or caller-supplied ceiling cut.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper uses the room's ceiling datum and does not author a structural slab.
 * @evidence principles/core/source-units.md#source-substantive-completion It emits the thin ceiling finish at the resolved room height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-ceiling-closure fixes the room ceiling finish below its structural reservation and interior-surface-handoff assigns the visible face to the room; roomCeiling consumes both.
 */
export const roomCeiling = (room: IRoomSpace, outline: readonly IPlanPoint[] = room.outline): IHousePart => {
  const [, bottom] = roomLevels(room);
  return part(
    `${room.id}-ceiling`,
    room.owner,
    "ceiling",
    PALETTE.ceiling,
    slab({ outline, bottom, top: bottom + CEILING_FINISH }),
  );
};

/**
 * Height range of a full-height partition on a storey: finished floor to finished ceiling.
 * @evidence spaces/07-boundary-assembly.md Room partitions run between the established finish datums.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership The height pair makes one full wall between neighboring finishes.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads the selected storey instead of choosing a new boundary height.
 * @evidence principles/core/source-units.md#source-substantive-completion Partition construction receives an explicit bottom and top.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions joins room partitions from finished floor to the ceiling boundary; partitionSpan uses the selected storey's two datums for that height.
 */
export const partitionSpan = (storey: StoreyId): readonly [number, number] => [
  floorOf(storey),
  ceilingOf(storey),
];

/**
 * A straight 0.15 m interior partition with its door voids.
 *
 * `axis` is the world axis the wall runs along, `across` its thickness range,
 * `along` its length range. Door holes are given in the same `along`
 * coordinate with world heights.
 * @evidence spaces/07-boundary-assembly.md A room source emits only its assigned straight partition body.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership The owner id and single wall body remain together.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions Door voids are cut into that body before its face is recorded.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller provides the run, owner and holes; the helper assigns no adjacent wall.
 * @evidence principles/core/source-units.md#source-substantive-completion It emits the full-height cut partition with its boundary record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership gives one room source the partition body and its door void; partition returns that one wallPanel under the caller's owner id.
 */
export const partition = (props: {
  id: string;
  owner: string;
  storey: StoreyId;
  axis: "x" | "z";
  across: readonly [number, number];
  along: readonly [number, number];
  holes?: readonly IWallHole[];
}): IHousePart => {
  const [bottom, top] = partitionSpan(props.storey);
  return part(
    props.id,
    props.owner,
    "partition",
    PALETTE.interiorWall,
    straightWall({
      axis: props.axis,
      across: props.across,
      along: props.along,
      bottom,
      top,
      holes: props.holes,
    }),
  );
};

/**
 * A door void of standard head 2.20 m above the storey floor.
 * @evidence spaces/07-boundary-assembly.md Interior doors are wall voids whose floor finish reaches the centreline.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The void keeps its id, width and head on the assigned partition.
 * @evidence principles/core/source-units.md#source-scope-preservation This returns a cut specification and does not build a door leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion Bottom and top derive from the selected storey datum and head height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan assigns entry-living-door to the entry partition and laundry-plan assigns service-laundry-door to its host; door passes each supplied span and head into the cut.
 */
export const door = (id: string, storey: StoreyId, from: number, to: number, head = 2.2): IWallHole => ({
  id,
  from,
  to,
  bottom: floorOf(storey),
  top: floorOf(storey) + head,
});

/**
 * Plan rectangle helper for room outlines.
 * @evidence spaces/03-surface-owners.md Room finish surfaces use the owner's metric inner outline.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Given X/Z bounds become four ordered corners for that room.
 * @evidence principles/core/source-units.md#source-scope-preservation This helper adds no dimensions or new room to the caller's plan.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned ring can form floor and ceiling finish slabs.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-room-plan and upper-hall-plan each state their own rectangular room limits; box turns those X/Z pairs into a ring without choosing a third extent.
 */
export const box = (x: readonly [number, number], z: readonly [number, number]): IPlanPoint[] => [
  { x: x[0], z: z[0] },
  { x: x[1], z: z[0] },
  { x: x[1], z: z[1] },
  { x: x[0], z: z[1] },
];
