/**
 * Room record shape and the solids every room owner emits: its floor
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
 * Consumers: the fifteen `rooms/*.ts` owners. Reservation validation lives in
 * `reservations.ts`; this helper owns no surface.
 */
import { PALETTE } from "../palette";
import type { IRoomReservation } from "./reservations";
import { slab, straightWall } from "../solids";
import {
  part,
  type IHousePart,
  type IPlanPoint,
  type IWallHole,
} from "../solid-records";
import {
  CEILING_FINISH,
  ceilingOf,
  floorOf,
  GROUND_LAYERS,
  INTERSTOREY_FLOOR_FINISH,
  type StoreyId,
} from "../storeys";

/**
 * One interior space as its plan owner declares it.
 * @evidence spaces/03-surface-owners.md Each room owns its finished inner outline and visible floor/ceiling surfaces.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The room record keeps its owner, outline, finish and reserved uses together.
 * @evidence principles/core/source-units.md#source-scope-preservation The shared type describes each room author's values without picking a plan for it.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry, storey, and finish reach environment assembly; reservations reach checkReservations and the measurement tools.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns each room its finished outline and visible surfaces; IRoomSpace retains id, owner, storey, outline, floor colour, levels and reservations, while IRoomBuild.parts carries the emitted walls, ceiling and reveal.
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
    * @evidence spaces/03-surface-owners.md The room owner retains its finished inner perimeter for its visible floor and ceiling surfaces.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the author's inner finish boundary, not a cloned structural wall.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered points produce the room's floor and ceiling surfaces.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-surface-handoff` assigns each room file its floor and ceiling finishes; each room-plan parent fixes its inner outline, which this field carries to the finish helpers without copying a structural wall plan.
   */
  outline: readonly IPlanPoint[];
  /**
   * @evidence spaces/03-surface-owners.md The room author selects its floor's blocking base colour.
   * @evidence principles/core/source-units.md#source-scope-preservation This colour stays with the room finish, leaving material optics elsewhere.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor geometry carries an inspectable visual distinction.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-surface-handoff` assigns the visible floor finish to each room source; this field carries that room's blocking base colour into its floor part.
   */
  floor: number;
  /**
   * Finished floor and ceiling heights when they differ from the storey's
   * datums (the garage, 01 ground-threshold-datums); absent for every room
   * that stands on its storey's finished floor.
   * @evidence spaces/03-surface-owners.md Garage finish levels may differ from ordinary room datums.
   * @evidence principles/core/source-units.md#source-scope-preservation The override stays within the room's assigned storey.
   * @evidence principles/core/source-units.md#source-substantive-completion A nonstandard room can give its actual floor and ceiling heights.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-datums puts the garage finished floor at -0.15 m below the ordinary ground-room finish; this field preserves that authored floor difference.
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
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage places the coat volume below the upper flight with X depth 0.65 m and a separate Z width, while upper-linen-storage fixes its hall recess; z retains each volume's authored Z span.
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
    * @evidence principles/core/source-units.md#source-substantive-completion The builder's emitted room parts are available for house assembly.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns room surfaces to their room files; this field transports each builder's emitted bodies without selecting a new surface owner.
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
 * Floor finish of one room zone: the main outline or a caller-owned storage inset over the same top finish layer.
 * @evidence spaces/03-surface-owners.md The room source owns the visible floor inside its finished outline and any separate inset outside it.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The returned part keeps the selected floor-zone id and outline with the room owner and floor colour.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper reads the room's assigned plan and layer depth without choosing a new one.
 * @evidence principles/core/source-units.md#source-substantive-completion It emits a closed finish slab at the storey's finished floor.
  * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-surface-handoff` assigns visible floor finish to each room, `main-ground-floor-base` fixes its ground depth, and `interstorey-floor-boundary` fixes the upper depth; `roomFloor` extrudes the supplied outline in the applicable layer.
 */
export const roomFloor = (room: IRoomSpace, zone: Pick<IRoomSpace, "id" | "outline"> = room): IHousePart => {
  const top = floorOf(room.storey);
  return part(
    `${zone.id}-floor`,
    room.owner,
    "floor",
    room.floor,
    slab({ outline: zone.outline, bottom: top - finishDepth(room.storey), top }),
  );
};

/**
 * The room's share of the floor finish under one interior door void: the
 * rectangle from the room's partition face to the partition mid-plane across
 * the door width, in the room's finish layer.
  * @evidence spaces/03-surface-owners.md Each caller's room owner authors its own finished doorway strip beneath an interior door.
  * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions At a same-height interior door, each caller supplies its room-side floor finish through the wall thickness to the central transition plane.
  * @evidence spaces/03-surface-owners.md#interior-surface-handoff The returned doorway finish part retains its room source and colour.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller supplies the door interval; the helper preserves its room owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The door-width finish becomes a closed slab in the same layer as the room floor.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions requires each room's finish to reach its interior door void's wall centreline; doorFloor fills the caller-supplied half of that threshold at the room's finish level.
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
  * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-surface-handoff` assigns room ceiling finishes; `interstorey-floor-boundary` fixes ground ceiling depth, `upper-ceiling-closure` fixes upper depth, and `garage-ceiling-closure` fixes the garage exception consumed by this helper.
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
  * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-boundary-ownership` fixes the ordinary partition body from finished floor to ceiling; `partitionSpan` reads the selected storey's two datums for that assigned height.
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
  * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-boundary-ownership` gives one room source the partition body and door cut; `partition` returns one caller-owned `straightWall` part with its boundary face.
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
  * @evidence spaces/07-boundary-assembly.md Interior door openings are cut from their assigned wall body using a named void specification.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The void keeps its id, width and head on the assigned partition.
 * @evidence principles/core/source-units.md#source-scope-preservation This returns a cut specification and does not build a door leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion Bottom and top derive from the selected storey datum and head height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-plan owns entry-living-door at Z=[-1.35, -0.35] and laundry-plan owns service-laundry-door at Z=[-4.40, -3.35]; their callers pass those spans to door, whose standard 2.20 m default matches both parents' heads.
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
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-room-plan fixes X=[-5.50, 5.50], Z=[-10.45, -6.20], while bedroom-two-plan fixes X=[-5.50, -1.95] and its front/back limits; box orders such caller-supplied rectangular intervals without changing them.
 */
export const box = (x: readonly [number, number], z: readonly [number, number]): IPlanPoint[] => [
  { x: x[0], z: z[0] },
  { x: x[1], z: z[0] },
  { x: x[1], z: z[1] },
  { x: x[0], z: z[1] },
];
