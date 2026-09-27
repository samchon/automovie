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
  * @evidenceReview spaces/03-surface-owners.md #9596716 `IRoomSpace` carries the room author's finished outline and floor colour into `roomFloor` and `roomCeiling`, which emit that owner's visible finish parts.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The room record keeps its owner, outline, finish and reserved uses together.
  * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f The record keeps `owner`, `outline`, `floor`, optional `levels`, and reservations together, allowing each listed room file to integrate its own finish and use zones.
 * @evidence principles/core/source-units.md#source-scope-preservation The shared type describes each room author's values without picking a plan for it.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The interface defines fields for a room builder's values; it contains no default footprint, room id, or finish colour selected by this shared file.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry, storey, and finish reach environment assembly; reservations reach checkReservations and the measurement tools.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildHouseEnvironment` reads room identity, storey, outline, and levels; `buildHouse` passes reservations to `checkReservations`, so the record supplies its declared downstream boundaries.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns each room its finished outline and visible surfaces; IRoomSpace retains id, owner, storey, outline, floor colour, levels and reservations, while IRoomBuild.parts carries the emitted walls, ceiling and reveal.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `interior-surface-handoff` assigns each room its visible inner finishes; this record transports that room's identity, storey, outline, colour, levels, and reservations while `IRoomBuild.parts` carries emitted surfaces.
 */
export interface IRoomSpace {
  /**
   * @evidence spaces/03-surface-owners.md The room's stable id ties its finish to its spatial record.
    * @evidenceReview spaces/03-surface-owners.md #9596716 `roomFloor` names its part from `room.id`, and environment assembly uses the same id for the room space and its floor surface.
   * @evidence principles/core/source-units.md#source-scope-preservation This id refers to the room owner's space, not a helper-owned room.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Room builders set `id`; this required field carries their existing space name without creating a helper-owned room.
   * @evidence principles/core/source-units.md#source-substantive-completion Routes and observations can address the same room.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `checkReservations` resolves zone spaces by room id, and `deriveHouseObservations` keys standing floors by the same id, giving both consumers one address.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network names front-entry and living-room as separate nodes joined by entry-living-door; id preserves those authored addresses in the environment.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `room-route-network` distinguishes `front-entry` from `living-room` across `entry-living-door`; the two room builders supply those ids and environment assembly preserves them.
   */
  id: string;
  /**
   * @evidence spaces/03-surface-owners.md The room record retains its specific source owner.
    * @evidenceReview spaces/03-surface-owners.md #9596716 The room builder sets `owner` to its assigned source file, such as `rooms/entry.ts`, and finish helpers pass that value into their returned parts.
   * @evidence principles/core/source-units.md#source-scope-preservation The shared helper never replaces the room's author.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `roomFloor`, `doorFloor`, and `roomCeiling` retain `room.owner`; `partition` separately uses the supplying room's `props.owner`, never a shared-file owner.
   * @evidence principles/core/source-units.md#source-substantive-completion Emitted parts can trace back to that source.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The finish helpers pass this field to `part`, whose returned `IHousePart.owner` lets downstream part consumers trace the emitting room.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns the entry, living room, and common room to their respective room files; owner retains the emitting file for each finish part.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `interior-surface-handoff` assigns entry, living, and common finishes to separate room files; their `owner` field follows each emitted floor, doorway strip, and ceiling part.
   */
  owner: string;
  /**
   * @evidence spaces/03-surface-owners.md A room finish belongs to one of the two storey surface populations.
    * @evidenceReview spaces/03-surface-owners.md #9596716 Each room's `storey` selects the ground or upper finish population, while the room file still owns the visible finish over its shared structural base.
   * @evidence principles/core/source-units.md#source-scope-preservation The field selects the room's existing storey, not a new floor.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `StoreyId` confines this field to the two authored storeys; it does not define a new elevation or extra floor.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor and ceiling helpers can read the correct datums.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `roomFloor` calls `floorOf(room.storey)`, `roomCeiling` reads `roomLevels`, and partition helpers select `partitionSpan` from this value.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network places entry and common below the stair and upper-hall with five doors above it; storey records that plan's ground/upper assignment.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `room-route-network` places entry and common below the single stair and upper hall with five doors above; each room builder supplies that assignment through `storey` to datum and environment consumers.
   */
  storey: StoreyId;
  /**
    * @evidence spaces/03-surface-owners.md The room owner retains its finished inner perimeter for its visible floor and ceiling surfaces.
    * @evidenceReview spaces/03-surface-owners.md #9596716 Each room builder supplies its own ordered `outline`; `roomFloor` and the default `roomCeiling` pass that ring to `slab` under the same room owner.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the author's inner finish boundary, not a cloned structural wall.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The readonly point list comes from the room builder; this field neither selects its coordinates nor duplicates a structural wall body.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered points produce the room's floor and ceiling surfaces.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `roomFloor` meshes this ring, and `roomCeiling` defaults to it unless its caller supplies a specific ceiling outline.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-surface-handoff` assigns each room file its floor and ceiling finishes; each room-plan parent fixes its inner outline, which this field carries to the finish helpers without copying a structural wall plan.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Entry and common builders supply their room-plan rings, and the shared finish helpers mesh those supplied rings under the room file assigned by `interior-surface-handoff`; this field makes no new boundary decision.
   */
  outline: readonly IPlanPoint[];
  /**
   * @evidence spaces/03-surface-owners.md The room author selects its floor's blocking base colour.
    * @evidenceReview spaces/03-surface-owners.md #9596716 Room builders set `floor` from their blocking palette, and `roomFloor` sends that value into the visible floor part for the room's assigned finish zone.
   * @evidence principles/core/source-units.md#source-scope-preservation This colour stays with the room finish, leaving material optics elsewhere.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This numeric field carries the room's chosen base colour to `roomFloor`; it does not declare texture or material response in this shared record.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor geometry carries an inspectable visual distinction.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `roomFloor` passes `room.floor` into `part`, and environment assembly uses the part's colour as its model base colour.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `interior-surface-handoff` assigns the visible floor finish to each room source; this field carries that room's blocking base colour into its floor part.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The interior handoff assigns each room's floor finish zone; the producing room sets a palette value and `roomFloor` carries it into the floor part without choosing a second surface owner.
   */
  floor: number;
  /**
   * Finished floor and ceiling heights when they differ from the storey's
   * datums (the garage, 01 ground-threshold-datums); absent for every room
   * that stands on its storey's finished floor.
   * @evidence spaces/03-surface-owners.md Garage finish levels may differ from ordinary room datums.
    * @evidenceReview spaces/03-surface-owners.md #9596716 The garage remains a ground-storey room with a lower finished floor; its builder supplies `levels` so its interior finish can use that exception under its own owner.
   * @evidence principles/core/source-units.md#source-scope-preservation The override stays within the room's assigned storey.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `levels` overrides a room's finished height pair while `storey` remains its authored ground or upper population; it does not create another storey.
   * @evidence principles/core/source-units.md#source-substantive-completion A nonstandard room can give its actual floor and ceiling heights.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `roomLevels` returns this pair when present; ceiling, environment, observation, and reservation consumers can then use the garage's actual finished heights.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-datums puts the garage finished floor at -0.15 m below the ordinary ground-room finish; this field preserves that authored floor difference.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `ground-threshold-datums` fixes the garage floor below the ordinary ground room; `garage-interior.ts` supplies its floor and ceiling pair here for `roomLevels` without choosing another threshold.
   */
  levels?: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The room record carries route and use reservations beside its surface owner outputs.
    * @evidenceReview spaces/05-route-network.md #60bf203 `IRoomSpace.reservations` keeps each room's passage, body, and use boxes alongside its identity and outline for the assembled route check.
   * @evidence spaces/05-route-network.md#room-route-network The reservation list supplies the room's internal occupancy bands to the route check.
    * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 `buildHouse` gathers room builders before `checkReservations` reads this list and tests their route bands against low reserved bodies.
   * @evidence principles/core/source-units.md#source-scope-preservation The list reserves later objects without building them.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The readonly list carries room-authored zones without constructing the later appliance, furniture, or person using them.
   * @evidence principles/core/source-units.md#source-substantive-completion Route validation can inspect each room's reserved uses.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildHouse` passes the assembled room list to `checkReservations`, where each present reservation receives containment and applicable route/body validation.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network requires each room's internal use and route bands alongside its connection; reservations carries those room-owned zones for the 2.00 m clearance check.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `room-route-network` sets internal passage and use-state roles plus the 2.00 m route band; this field carries each room's zones, including the garage overhead guide, into the shared check.
   */
  reservations?: readonly IRoomReservation[];
}

/**
 * Finished floor and ceiling heights of a room.
 * @evidence spaces/01-storeys.md Normal rooms use storey datums; garage can supply its own finished levels.
 * @evidenceReview spaces/01-storeys.md #3d5a439 v-141 L238 levels ?? [floorOf, ceilingOf]; 01-storeys.md:29,31 storey datums; :63 garage levels.
 * @evidence spaces/01-storeys.md#storey-datums The default pair comes from the assigned storey's floor and ceiling.
 * @evidenceReview spaces/01-storeys.md#storey-datums #9624dfb v-141 floorOf/ceilingOf (storeys.ts:120-133) read STOREYS ground 0/2.75 and upper 3.06/5.66 = 01-storeys.md:29,31.
 * @evidence spaces/01-storeys.md#ground-threshold-datums A room-level override preserves the garage threshold exception.
 * @evidenceReview spaces/01-storeys.md#ground-threshold-datums #b38ce8d v-141 garage-interior.ts:27 levels [garageFloor, garageCeiling] = 01-storeys.md:63 -0.15/2.55.
 * @evidence principles/core/source-units.md#source-scope-preservation The function reads established datums and does not choose a new floor.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Only reads room.levels or the STOREYS datums via floorOf/ceilingOf.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns an explicit height pair for downstream ceiling and observation construction.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f roomCeiling, environment assembly, observations and reservations.ts checkReservations all read this finished floor/ceiling pair when the garage overrides ordinary storey datums.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums fixes ordinary room floors and ceilings, while ground-threshold-datums puts the garage floor at -0.15 m; roomLevels chooses that explicit override without a third level.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Storeys fixes floors 0/3.06 and ceilings 2.75/5.66, with garage floor -0.15; roomLevels returns either the room override or its storey floor/ceiling pair and creates no third level.
 */
export const roomLevels = (room: IRoomSpace): readonly [number, number] => room.levels ?? [floorOf(room.storey), ceilingOf(room.storey)];

/**
 * A closed storage volume a room owns and uses through a real opening (coat
 * closet, linen closet): a logical space of its own, never a route node.
 * @evidence spaces/05-route-network.md Closet and linen storage are accessible from rooms without becoming passage nodes.
  * @evidenceReview spaces/05-route-network.md #60bf203 `IStorageSpace` records a bounded coat or linen volume with its own id; environment assembly emits it as a storage space without adding a passage edge.
 * @evidence spaces/05-route-network.md#room-route-network Storage volume has its own id while the door remains on the room route.
  * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 Entry and upper-hall builders return storage records separate from their room records; the room route reaches each opening without making the volume another transit node.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a space reservation, not an authored storage model.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The interface contains only an id and world X/Y/Z intervals; closet shelves, doors, and model meshes remain outside this logical storage record.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and full world box let the environment expose the storage volume.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Environment assembly reads the storage id and all three world intervals to create a bounded storage cell usable by observations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network keeps the entry coat and upper linen volumes outside passage edges while their door openings remain reachable; this type records each storage cell separately.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `room-route-network` keeps coat and linen behind their reachable openings without passage edges; this type carries their separately bounded volumes into environment storage cells.
 */
export interface IStorageSpace {
  /**
   * @evidence spaces/05-route-network.md A storage volume has a stable address separate from the room route.
    * @evidenceReview spaces/05-route-network.md #60bf203 Entry and upper-hall builders supply distinct coat and linen `id` values, which environment assembly uses for their storage spaces apart from the two room ids.
   * @evidence principles/core/source-units.md#source-scope-preservation The id names the closet volume, not a new route connection.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This string names a closet volume; it does not create an opening, connector, or route edge.
   * @evidence principles/core/source-units.md#source-substantive-completion Environment assembly can expose the exact storage space.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Environment assembly assigns `storage.id` to the emitted storage space so later observation lookup can address that exact volume.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage names coat-storage and upper-linen-storage names the hall linen volume; their ids remain distinct from front-entry and upper-hall.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `entry-coat-storage` and `upper-linen-storage` parents name separate closets; their builders supply those ids here, distinct from `front-entry` and `upper-hall`.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a horizontal width.
    * @evidenceReview spaces/05-route-network.md #60bf203 A storage volume needs depth behind its room-side opening; this X interval bounds the coat and linen cells independently of their route rooms.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval stays inside the authored closet.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Entry supplies X from the coat body start to the stair closure face, while upper hall supplies its linen interior span; the field introduces neither dimension.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world X.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Environment assembly reads `storage.x` as the X bounds of the storage cell, preserving the chosen horizontal volume.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage derives its X start from tread seven plus 0.07 m, and upper-linen-storage fixes its own hall-side width; this interval carries each closet's owner value.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The coat builder derives its X start from the seventh upper tread and extends the logical cell to the stair closure face; the linen builder supplies its hall-side X span from its own parent.
   */
  x: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a vertical interval.
    * @evidenceReview spaces/05-route-network.md #60bf203 The storage `y` interval bounds a usable closet volume behind its opening instead of adding a floor-to-ceiling passage node.
   * @evidence principles/core/source-units.md#source-scope-preservation This is interior clearance, not a shelf model.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The required height pair preserves the room builder's closet limit and does not construct a shelf or hanging rail.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world Y.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Environment assembly places `storage.y` directly on the storage cell, making its vertical occupancy queryable.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage fixes its body top at Y=2.15 and upper-linen-storage fixes the linen volume from upper floor through 2.20 m height; this range carries those closet-owned limits, not room ceiling height.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Entry's coat parent fixes Y 2.15 m; the linen parent fixes 2.20 m above upper floor, and each builder supplies that height pair here instead of its room ceiling.
   */
  y: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a plan depth.
    * @evidenceReview spaces/05-route-network.md #60bf203 This plan Z pair keeps each closet's bounded depth behind its opening while the room route remains outside the storage volume.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval remains the author's closet reservation.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Entry supplies the stair-back to coat-front Z span; upper hall supplies the linen interior Z span, both from their room designs.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world Z.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Environment assembly reads `storage.z` as the storage cell's world Z bounds, completing its three-axis volume.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage places the coat volume below the upper flight with X depth 0.65 m and a separate Z width, while upper-linen-storage fixes its hall recess; z retains each volume's authored Z span.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The coat parent fixes its Z span below the upper flight and the linen parent fixes its recess depth; the two builders pass those different intervals unchanged into this field.
   */
  z: readonly [number, number];
}

/**
 * What one room owner emits: its space record and the solids it owns.
 * @evidence spaces/03-surface-owners.md A room source emits its finished surfaces and room record as one owned unit.
  * @evidenceReview spaces/03-surface-owners.md #9596716 Every room builder returns an `IRoomBuild` with its room record and emitted finish or partition parts, keeping that file's visible surfaces together for house assembly.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish parts stay with their room while storage records remain separately addressable.
  * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f `IRoomBuild` separates mesh parts from optional storage volumes; `buildHouse` collects both under the emitting room, and environment assembly exposes storage as separate spaces.
 * @evidence principles/core/source-units.md#source-scope-preservation The interface preserves one room author and does not assign another room's partition.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This output type receives a builder's `space`, `parts`, and optional `storages`; it assigns no neighboring partition that the room builder did not emit.
 * @evidence principles/core/source-units.md#source-substantive-completion Space, parts and optional storage are all available for house assembly.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildHouse` flattens each result's `parts`, collects its `space`, and pairs each optional storage with that room, so all three fields have assembly consumers.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns every room one file for its finishes, with coat/linen as consuming-room storage; IRoomBuild returns that file's space, parts, and optional storage together.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `interior-surface-handoff` assigns one source file per room and keeps coat and linen with entry and upper hall; this result type carries each builder's space, parts, and optional storage without choosing another owner.
 */
export interface IRoomBuild {
  /**
   * @evidence spaces/03-surface-owners.md The emitting room retains its own plan record.
    * @evidenceReview spaces/03-surface-owners.md #9596716 The `space` field is the emitting room's `IRoomSpace`; builders such as entry and common return their own finished outline and owner record here.
   * @evidence principles/core/source-units.md#source-scope-preservation This field does not create or claim an adjacent room.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The field carries one builder-supplied room record; `buildHouse` refuses duplicate room ids rather than merging another room into it.
   * @evidence principles/core/source-units.md#source-substantive-completion House assembly can collect the room's id, outline and uses.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildHouse` collects `room.space` into `house.spaces`, preserving id, storey, outline, and reservations for environment and route consumers.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan and common-room-plan each fix their own room outline and doors; space preserves the respective IRoomSpace rather than composing a new plan.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Entry and common room plans fix separate outlines and door contacts; each builder returns its own record through `space`, without this field composing another plan.
   */
  space: IRoomSpace;
  /**
   * @evidence spaces/03-surface-owners.md Only the room's own finishes and partitions enter its emitted part list.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 Rooms emit roomFloor, roomCeiling, doorFloor and partition parts, entry's own closet walls (entry.ts:123-124) and laundry's threshold (laundry.ts:117). All are own finishes or partitions per 07:29-45 and 10-ground-floor.md:90.
   * @evidence principles/core/source-units.md#source-scope-preservation Another room's wall or finish is not emitted here.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 All room parts use the room's own owner; house.ts:174-176 refuses duplicate part ids.
   * @evidence principles/core/source-units.md#source-substantive-completion The viewer receives the actual room floor, ceiling and assigned walls.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 house.ts:168 spreads room parts to the viewer, but garage-interior emits no floor (its visible floor is garage.ts base) and service emits no wall; 'actual room floor' is over-general.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff leaves each room's wall, floor, ceiling, and reveal with its room file; parts carries only the builder's emitted bodies.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The interior handoff gives each room its inner wall, ceiling, floor finish and opening perimeter; IRoomBuild.parts holds only the parts the caller emits, as entry.ts demonstrates, so the type does not invent another surface owner.
   */
  parts: IHousePart[];
  /**
   * @evidence spaces/03-surface-owners.md A room may expose its own closet or linen volume.
    * @evidenceReview spaces/03-surface-owners.md #9596716 The entry builder supplies its coat volume and upper hall its linen volume through `storages`, matching the handoff's consuming-room assignment.
   * @evidence principles/core/source-units.md#source-scope-preservation These are space records, not added storage furniture.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Optional `IStorageSpace` records are bounded logical volumes; this field creates no closet shelf or sliding door model.
   * @evidence principles/core/source-units.md#source-substantive-completion House assembly can include the room's usable storage cells.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildHouse` pairs each returned storage with its room record, giving environment assembly the correct parent storey and storage cell bounds.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff keeps coat storage with entry and linen storage with upper-hall, while the walk-in wardrobe owns a room file; storages carries only the shallow volumes.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `interior-surface-handoff` keeps shallow coat and linen storage with entry and upper hall, while the walk-in wardrobe is a room; only the first two builders fill this optional field.
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
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 roomFloor L325-334 slab over room.outline; 03-surface-owners.md:96.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The returned part keeps the room's id, owner, outline and floor colour.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f v-141 L328-332 id room.id-floor, owner room.owner, colour room.floor, outline room.outline.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper reads the room's assigned plan and layer depth without choosing a new one.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 finishDepth L313-315 = GROUND_LAYERS.finish or INTERSTOREY_FLOOR_FINISH; top = floorOf(room.storey).
 * @evidence principles/core/source-units.md#source-substantive-completion It emits a closed finish slab at the storey's finished floor.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 slab top=floorOf, bottom=top-finishDepth (L326,332); solids.ts slab is a closed extrusion.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns visible floor finish to the room and main-ground-floor-base fixes its finish thickness; roomFloor extrudes that room outline to its floor datum.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 roomFloor slabs the room outline from finished floor minus finishDepth to finished floor. The cited ground-floor base fixes 0.025 m for ground rooms, but upper roomFloor also uses INTERSTOREY_FLOOR_FINISH from interstorey-floor-boundary; the evidence sentence omits that second parent.
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
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 The half-and-half rule is 07-boundary-assembly.md:83 (each room's finish meets at the rough-partition centre plane). The cited 03 only says (03:45) that the same-height under-door floor transition belongs to '07's single room owner'. See notes.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff This part extends the room finish to the partition centre without claiming the other room's floor.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f v-141 03 #interior-surface-handoff body (03:96) has room finish ownership but no partition-centre rule, which is 07-boundary-assembly.md:83. The centre is a caller literal (e.g. living.ts:92 [-1.95,-1.875]), not derived here. See notes.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller supplies the door interval; the helper preserves its room owner.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 L346 caller supplies x/z; owner = room.owner (L350).
 * @evidence principles/core/source-units.md#source-substantive-completion The door-width finish becomes a closed slab in the same layer as the room floor.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L347,353 same top and finishDepth as roomFloor.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions requires each room's finish to reach its interior door void's wall centreline; doorFloor fills the caller-supplied half of that threshold at the room's finish level.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 07-boundary-assembly.md:83 (#interior-boundary-junctions) 마감 전환선은 거친 칸막이 두께의 중앙면; doorFloor fills the caller half. v-143 F10 closed.
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
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 roomCeiling L367-376 part per room; 03-surface-owners.md:96.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The part follows the room's finished outline or caller-supplied ceiling cut.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f v-141 Default outline = room.outline (L367); entry.ts:114 passes a cut at the stair opening.
 * @evidence principles/core/source-units.md#source-scope-preservation The helper uses the room's ceiling datum and does not author a structural slab.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 bottom = roomLevels(room)[1] (L368); 0.015 CEILING_FINISH finish only.
 * @evidence principles/core/source-units.md#source-substantive-completion It emits the thin ceiling finish at the resolved room height.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 slab bottom..bottom+CEILING_FINISH at the resolved ceiling (garage 2.55 via levels).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-ceiling-closure fixes the room ceiling finish below its structural reservation and interior-surface-handoff assigns the visible face to the room; roomCeiling consumes both.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Upper ceiling assembly puts the visible finish in the lower 0.015 m reservation, and roomCeiling slabs from finished ceiling to that datum plus CEILING_FINISH. This helper also serves ground rooms and garage, whose ceiling parents the evidence sentence omits.
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
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 L386-389 [floorOf, ceilingOf]; 07-boundary-assembly.md:45 partitions run finished floor to finished ceiling.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership The height pair makes one full wall between neighboring finishes.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 v-141 07-boundary-assembly.md:45 floor-to-ceiling height; :27 one common body per shared partition.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads the selected storey instead of choosing a new boundary height.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Reads only floorOf/ceilingOf(storey).
 * @evidence principles/core/source-units.md#source-substantive-completion Partition construction receives an explicit bottom and top.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Returns [bottom, top] consumed at L413.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-junctions joins room partitions from finished floor to the ceiling boundary; partitionSpan uses the selected storey's two datums for that height.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 partitionSpan returns finished floor and ceiling for a full-height room partition. The cited junction unit governs junction zones, while sibling interior-boundary-ownership states this floor-to-ceiling body height; the evidence sentence cites the wrong sibling.
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
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 L404-428 emits one straightWall part per call; owners per the 07-boundary-assembly.md:29-41 table.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-ownership The owner id and single wall body remain together.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-ownership #6a03f13 v-141 L414-418 part(props.id, props.owner, 'partition', ...) with one wall solid.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions Door voids are cut into that body before its face is recorded.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-junctions #78b06b5 v-141 solids.ts straightWall cuts notches and holes into the mesh, then returns a face with every void; part() stores it as wall. 07-boundary-assembly.md:79.
 * @evidence principles/core/source-units.md#source-scope-preservation The caller provides the run, owner and holes; the helper assigns no adjacent wall.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 All geometry comes from props; no other wall is emitted.
 * @evidence principles/core/source-units.md#source-substantive-completion It emits the full-height cut partition with its boundary record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 partitionSpan floor to ceiling (L413); part() keeps solid.face as the wall boundary record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-boundary-ownership gives one room source the partition body and its door void; partition returns that one wallPanel under the caller's owner id.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Boundary assembly assigns one structural body and opening cut to the owner; partition returns part(id, props.owner, "partition", straightWall(...)). straightWall builds one wallPanel mesh but returns its own full-rectangle face, so the evidence sentence names an inner primitive rather than the returned face.
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
 * @evidenceReview spaces/07-boundary-assembly.md #007d289 v-141 door() (L438-444) returns only id/from/to/bottom/top. The floor finish reaching the centreline is doorFloor (L346) with caller ranges, not this host. See notes.
 * @evidence spaces/07-boundary-assembly.md#interior-boundary-junctions The void keeps its id, width and head on the assigned partition.
 * @evidenceReview spaces/07-boundary-assembly.md#interior-boundary-junctions #78b06b5 v-141 L438-444 keeps id, from/to (width) and top = floor+head; caller hosts it via partition holes; 07-boundary-assembly.md:79.
 * @evidence principles/core/source-units.md#source-scope-preservation This returns a cut specification and does not build a door leaf.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Returns an IWallHole spec; no leaf (models/03).
 * @evidence principles/core/source-units.md#source-substantive-completion Bottom and top derive from the selected storey datum and head height.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 bottom floorOf(storey), top floorOf(storey)+head (L442-443).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-plan owns entry-living-door at Z=[-1.35, -0.35] and laundry-plan owns service-laundry-door at Z=[-4.40, -3.35]; door passes each caller's authored span and head into its interior cut.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 living.md:27, laundry.md:29; door() passes each caller span/head. v-144 F11 minor closed.
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
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 box builds room outlines (living.ts:48, common.ts:62 ...) and doorFloor rectangles.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Given X/Z bounds become four ordered corners for that room.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f v-141 L454-459 four corners in order.
 * @evidence principles/core/source-units.md#source-scope-preservation This helper adds no dimensions or new room to the caller's plan.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Pure mapping of caller bounds.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned ring can form floor and ceiling finish slabs.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Used in room outlines consumed by roomFloor/roomCeiling and in doorFloor L353.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-room-plan fixes X=[-5.50, 5.50], Z=[-10.45, -6.20], while bedroom-two-plan fixes X=[-5.50, -1.95] and its front/back limits; box orders such caller-supplied rectangular intervals without changing them.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 common.md:25 X=[-5.50,5.50], Z=[-10.45,-6.20] (common.ts:62 box); bedroom-two.md:25 X=[-5.50,-1.95] (bedroom-two.ts:45 box). v-143 F12 closed.
 */
export const box = (x: readonly [number, number], z: readonly [number, number]): IPlanPoint[] => [
  { x: x[0], z: z[0] },
  { x: x[1], z: z[0] },
  { x: x[1], z: z[1] },
  { x: x[0], z: z[1] },
];
