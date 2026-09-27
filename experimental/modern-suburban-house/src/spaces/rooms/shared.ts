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
 * A plan zone a room reserves for one use, world metres: furniture or a
 * fixture body, a storage body, the floor a person uses in front of them, a
 * clear route, or the sweep of a door, drawer or appliance door. The zone is
 * a spaces decision later instances and observations consume; the object in it
 * is not authored here. A `covering` (a rug or mat a few millimetres thick) is
 * walked on, so a route may cross it.
 * @evidence spaces/05-route-network.md Room plans reserve bodies, use areas and clear passage before later objects are placed.
 * @evidenceReview spaces/05-route-network.md #60bf203 v-141 shared.ts:49-95 id/kind/x/z/y/space zone; 05-route-network.md:29 room owners decide reserved use spaces; :78 spaces-reservation section test before later models.
 * @evidence spaces/05-route-network.md#room-route-network Route clearance depends on distinct body, swing and use reservations.
 * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 v-141 kind union L63 separates body/use/swing/route. 05-route-network.md:62,66 separate door-operation and use states from passage; :78 bodies below 2.00 m block passage.
 * @evidence principles/core/source-units.md#source-scope-preservation This zone reserves space for later instances but creates no furniture or fixture.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Interface only (L49-95); no part, mesh or model is built from it.
 * @evidence principles/core/source-units.md#source-substantive-completion Identity, kind and metric bounds allow containment and collision checks.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 checkReservations L196-225 uses id, kind and x/z/y for containment (L197-209) and route/body crossing (L211-225).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network requires each room's passage bands to remain distinguishable from use reservations; this type carries their separate ids and extents.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 05-route-network.md:66 separates use states from passage, :68 main route bypasses furniture use, :78 walking bands are tested against bodies. IRoomReservation (shared.ts:49-95) keeps id/kind/x/z/y/space per zone, e.g. common.ts:110-113 routes vs its use and body zones.
 */
export interface IRoomReservation {
  /**
   * @evidence spaces/05-route-network.md Each reserved zone has a stable identifier.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 L56 id string; 05-route-network.md:29 names handed to source are identifiers; use/route H2s are addressed by anchor (05:66-74).
   * @evidence principles/core/source-units.md#source-scope-preservation This names a zone, not a new route node or model.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 A plain string field; it adds no route node or model.
   * @evidence principles/core/source-units.md#source-substantive-completion A failed clearance check can name the exact reservation.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Error texts L198,202,208,217,223 carry r.id, route id and body id.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes fixes the right and rear passage bands, laundry-through-route fixes the Z=[-4.32, -3.42] crossing, and garage-use-routes fixes the cross band Z=[-4.75, -3.85]; id distinguishes the emitted reservation for each tested band.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 common.md:189 (#common-clear-routes) right/back bands -> common-main-route-right/back; laundry.md #laundry-through-route Z=[-4.32,-3.42] -> laundry-through-route; garage-interior.md #garage-use-routes Z=[-4.75,-3.85] -> garage-cross-route. v-143 F4 closed.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md Body, use, route and swing zones have different clearance behavior.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 In checkReservations only bodies (furniture/fixture/storage, L211-213) and routes (L214) take part. use, swing and covering are never tested, so use and swing have identical clearance behaviour. See notes.
   * @evidence principles/core/source-units.md#source-scope-preservation The kind classifies a reserved area without constructing its object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 L63 is a string union label; nothing is constructed from it.
   * @evidence principles/core/source-units.md#source-substantive-completion A route is checked against body kinds while coverings and sweeps may overlap it.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L211-213 bodies = furniture/fixture/storage; L214-225 only routes are tested against them; covering and swing are never tested.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network distinguishes a clear passage from fixture, furniture, use, and door swing reservations; kind retains the caller's class for clearance checks.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 05-route-network.md:78 separates the clear walking band from furniture/fixture/storage bodies; :62,66 separate door operation and seating/storage use from passage. kind (shared.ts:63) keeps the producer's class, and checkReservations tests routes only against furniture/fixture/storage (shared.ts:212-226) while swings, uses and coverings may overlap.
   */
  kind: "furniture" | "fixture" | "storage" | "covering" | "use" | "route" | "swing";
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan width.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 L70 x range per zone; 05-route-network.md:29 reserved use spaces are room-owner decisions.
   * @evidence principles/core/source-units.md#source-scope-preservation The range comes from the room's authored layout.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Type contract; rooms/*.ts fill x from their room H2s (e.g. entry.ts reservations with plan values).
   * @evidence principles/core/source-units.md#source-substantive-completion The horizontal bounds support room containment and route overlap checks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 x used in L197, L204-209 containment and L221 overlap.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Common-clear-routes supplies the four common-room passage bands' X intervals, and living-through-route supplies the three living room bands; x transports each authored reservation width without selecting a new corridor.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 common.ts:110-113 four route bands; living-through-route body: main band X=[-4.90,-4.00], front floor Z=[-1.45,-0.45], bookcase cross Z=[-4.65,-3.75] = living.ts:66,69,70. v-144 F5 minor closed.
   */
  x: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A reserved zone occupies an explicit plan depth.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 L77 z range per zone.
   * @evidence principles/core/source-units.md#source-scope-preservation The range stays within the room or named neighboring space.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 L200-209 throws 'leaves space' if a 3x3 sample leaves the outline of r.space ?? room.id.
   * @evidence principles/core/source-units.md#source-substantive-completion The depth bounds support containment and route overlap checks.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 z used in L197, L204-209 and L221.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-through-route fixes the mudroom crossing and common-clear-routes fixes the rear/garden approach depths; this field carries each authored Z interval for clearance checks.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 laundry.md:97 through-route Z=[-4.32,-3.42] = laundry.ts:88; common.md:189 rear band Z=[-10.33,-9.25] and garden approach Z=[-10.45,-10.33] = common.ts:111-112 (MAIN.inner.z[0]+0.12). z carries them to checkReservations (shared.ts:198-226).
   */
  z: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md A body may need a vertical envelope above its plan area.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 L84 optional y; 05-route-network.md:78 reservations above the 2.00 m band (garage overhead guide) are not collisions.
   * @evidence principles/core/source-units.md#source-scope-preservation The range reserves height but builds no object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 A range field only; nothing built.
   * @evidence principles/core/source-units.md#source-substantive-completion Body and wall-hung zones can be checked separately from clear floor areas.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L221 a body blocks only if y is undefined or y[0] < floor+2.0, so the garage guide (garage-interior.ts:29, y from door top 2.15) is checked separately.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network fixes the 2.00 m clear band that checkReservations applies to every route through routeClearHeight, and garage-front-opening fixes the overhead guide Y=[2.15, 2.50]; current routes have no y, while optional y records the height of a body, wall-hung or overhead reservation when one is specified.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 N1 closed. 05-route-network.md:78 2.00 m; front.md:213 guide Y=[2.15,2.50]; checkReservations applies routeClearHeight=2.0 to every kind:"route" (shared.ts:187,217-219); dump: 16 routes, 0 with y; y present on furniture/fixture/storage bodies, wall-hung items, garage-door-overhead-guide (and 3 coverings; row makes no exclusive claim). Consistent with sibling rows :78-80.
   */
  y?: readonly [number, number];
  /**
   * The space the zone lies in when it is not the owning room: a zone this
   * room's design decides beside its own door, on the neighbour's floor
   * (laundry's garage-side waiting, the coat closet's front use).
   * @evidence spaces/05-route-network.md Some room-owned uses occur across a door in the adjacent space.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 L94 space override. 05-route-network.md:66 coat storage used from service, :70 garage lower waiting. entry.ts entry-coat-front-use has space 'service-access'.
   * @evidence principles/core/source-units.md#source-scope-preservation The override locates a reservation without transferring its author.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 L189-195 keeps room (author, owner in errors) while space = r.space ?? room.id.
   * @evidence principles/core/source-units.md#source-substantive-completion Containment checks use the actual neighboring space outline.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L188 outline map built from all room outlines; L200 looks up the target space's outline for containment.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Laundry-plan puts the garage-side wait across laundry-garage-door, while entry-coat-storage puts the coat-use clearance in service-access; space names the neighbouring floor for each room-authored reservation.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 laundry.md:33 in #laundry-plan garage-side lower wait X=[5.75,6.80]; entry.md:93 front use in service band; code: laundry-garage-lower-waiting space "garage", entry-coat-front-use space "service-access". v-143 F7 closed.
   */
  space?: string;
}

/**
 * One interior space as its plan owner declares it.
 * @evidence spaces/03-surface-owners.md Each room owns its finished inner outline and visible floor/ceiling surfaces.
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 03-surface-owners.md:96 each room owner integrates its interior floor/ceiling finish; IRoomSpace outline/floor L133,140 feed roomFloor/roomCeiling.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff The room record keeps its owner, outline, finish and reserved uses together.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f v-141 IRoomSpace L112-157 groups owner, outline, floor colour and reservations; 03-surface-owners.md:96 one author integrates the room finish.
 * @evidence principles/core/source-units.md#source-scope-preservation The shared type describes each room author's values without picking a plan for it.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Interface only; values come from rooms/*.ts.
 * @evidence principles/core/source-units.md#source-substantive-completion Geometry, storey, and finish reach environment assembly; reservations reach checkReservations and the measurement tools.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment.ts:605-624 reads room.id, storey (parent), outline (cells, floor surface) and roomLevels (finished levels); finish parts reach elements through house.parts (:635). Reservations reach checkReservations (house.ts:242) and measurements (casing-space-scan.cjs:62, scene-snapshot.ts:34, space-design.ts:110). v141 defect fixed.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns each room its finished outline and visible surfaces; IRoomSpace retains id, owner, storey, outline, floor colour, levels and reservations, while IRoomBuild.parts carries the emitted walls, ceiling and reveal.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 IRoomSpace fields id, owner, storey, outline, floor (number), levels?, reservations? (shared.ts:100-125); walls/ceiling/reveal emitted as IRoomBuild.parts. v-143 F8 closed.
 */
export interface IRoomSpace {
  /**
   * @evidence spaces/03-surface-owners.md The room's stable id ties its finish to its spatial record.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 roomFloor part id room.id-floor (L328); environment.ts:584,594 room space and floor surface keyed by room.id.
   * @evidence principles/core/source-units.md#source-scope-preservation This id refers to the room owner's space, not a helper-owned room.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 id comes from each room owner's record; the helpers create no room.
   * @evidence principles/core/source-units.md#source-substantive-completion Routes and observations can address the same room.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 checkReservations matches route.space to room.id (L215). observations.ts:324,473 key room floors by s.id.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network names front-entry and living-room as separate nodes joined by entry-living-door; id preserves those authored addresses in the environment.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 05-route-network.md:37 front-entry -> entry-living-door -> living-room. The ids "front-entry" (entry.ts:54) and "living-room" (living.ts:45) become environment space ids (environment.ts:605-608).
   */
  id: string;
  /**
   * @evidence spaces/03-surface-owners.md The room record retains its specific source owner.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 L119 owner string, e.g. 'rooms/entry.ts' (entry.ts:55).
   * @evidence principles/core/source-units.md#source-scope-preservation The shared helper never replaces the room's author.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 roomFloor/doorFloor/roomCeiling pass room.owner (L329,350,371); partition passes props.owner supplied by the room.
   * @evidence principles/core/source-units.md#source-substantive-completion Emitted parts can trace back to that source.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 part(..., room.owner, ...) sets IHousePart.owner (solids.ts part).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns the entry, living room, and common room to their respective room files; owner retains the emitting file for each finish part.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03-surface-owners.md:100-102 assign entry.ts, living.ts and common.ts. owner holds the emitting file ("rooms/entry.ts" entry.ts:55, living.ts:46, common.ts:60), and roomFloor/doorFloor/roomCeiling put room.owner on each finish part (shared.ts:330,351,372).
   */
  owner: string;
  /**
   * @evidence spaces/03-surface-owners.md A room finish belongs to one of the two storey surface populations.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 StoreyId has two values; 03-surface-owners.md:45-47 ground base vs interstorey/upper ceiling bases, with the visible room finish per room.
   * @evidence principles/core/source-units.md#source-scope-preservation The field selects the room's existing storey, not a new floor.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Field typed StoreyId, only the two existing storeys.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor and ceiling helpers can read the correct datums.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 roomFloor floorOf(room.storey) L326; roomCeiling roomLevels L368; partition via partitionSpan.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network places entry and common below the stair and upper-hall with five doors above it; storey records that plan's ground/upper assignment.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 05-route-network.md:36-39 put front-entry and kitchen-dining-family on ground-storey, :50 runs the stair to upper-hall (upper-storey), and :51-55 give five hall doors. storey is set per producer (entry.ts:56 ground, upper-hall.ts:38 upper) and read by floorOf/ceilingOf and the environment parent.
   */
  storey: StoreyId;
  /**
   * @evidence spaces/03-surface-owners.md The room owner supplies its finished inner perimeter.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 03-surface-owners.md:96; 05-route-network.md:29 room owners decide finished inner boundaries.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the author's inner finish boundary, not a cloned structural wall.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 A plan point list; no wall body is derived from it here.
   * @evidence principles/core/source-units.md#source-substantive-completion Ordered points produce the room's floor and ceiling surfaces.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 roomFloor slab(room.outline) L332; roomCeiling default outline L367,374.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff makes each room's finished inner perimeter the floor/ceiling owner; this ring carries the room builder's outline without copying the structural wall plan.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A holds: outline carries each builder's ring (box(...) or explicit points, e.g. entry.ts:57-64), which roomFloor/roomCeiling slab; no structural wall plan is copied. B loose: 03:96 gives the room's source file its floor/ceiling/wall finish zones. It neither makes "the perimeter the owner" nor fixes the inner outline, which each room-plan H2 fixes (entry.md:29, common.md:25; 05:29).
   */
  outline: readonly IPlanPoint[];
  /**
   * @evidence spaces/03-surface-owners.md The room author selects its floor's blocking base colour.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 Rooms set floor: PALETTE.* (e.g. entry.ts:65); palette.ts:2 blocking-pass base colours; 03-surface-owners.md:96 the room owner owns its floor finish.
   * @evidence principles/core/source-units.md#source-scope-preservation This colour stays with the room finish, leaving material optics elsewhere.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 palette.ts:8-9: flat base colour only; optics and textures belong to materials.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor geometry carries an inspectable visual distinction.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 roomFloor colour room.floor (L331) becomes environment.ts:172 baseColor.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns the visible floor finish to the room source and leaves material optics elsewhere; floor carries that source's base colour.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03:96 gives the room's source file its floor finish zone (A: floor colour e.g. PALETTE.woodFloor entry.ts:65, used by roomFloor shared.ts:332). But "leaves material optics elsewhere" is not in the interior-surface-handoff body: 03:96-116 mention only models members and the baseboard. Material optics are the materials layer (docs/README.md:20). Partial over-reach.
   */
  floor: number;
  /**
   * Finished floor and ceiling heights when they differ from the storey's
   * datums (the garage, 01 ground-threshold-datums); absent for every room
   * that stands on its storey's finished floor.
   * @evidence spaces/03-surface-owners.md Garage finish levels may differ from ordinary room datums.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 03-surface-owners.md:46 garage low floor base; garage-interior.ts:27 levels differ from storey datums.
   * @evidence principles/core/source-units.md#source-scope-preservation The override stays within the room's assigned storey.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 levels changes heights only; storey stays ground-storey (garage-interior); 01-storeys.md:29 garage is a ground-storey annex.
   * @evidence principles/core/source-units.md#source-substantive-completion A nonstandard room can give its actual floor and ceiling heights.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 roomLevels L238 returns levels when present; used by roomCeiling, environment.ts:582 and observations.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Ground-threshold-datums puts the garage finished floor at -0.15 m below the ordinary ground-room finish; this field preserves that authored floor difference.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 01-storeys.md:63 garage finished floor Y=-0.15, ceiling 2.55; :29 ground Y=0. garage-interior.ts:34 levels [STOREYS.garageFloor (=groundFloor-0.15, storeys.ts:36), garageCeiling], used through roomLevels (shared.ts:239).
   */
  levels?: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The room record carries route and use reservations beside its surface owner outputs.
   * @evidenceReview spaces/05-route-network.md #60bf203 05-route-network.md:29 room owners decide the inner boundary and reserved use areas; :66-78 route/use checks. IRoomSpace carries reservations (shared.ts:158) beside owner/outline/floor (119,133,140).
   * @evidence spaces/05-route-network.md#room-route-network The reservation list supplies the room's internal occupancy bands to the route check.
   * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 05-route-network.md:78 tests walking bands to 2.00 m against bodies. checkReservations reads room.reservations (shared.ts:190-226) and is called at house.ts:242.
   * @evidence principles/core/source-units.md#source-scope-preservation The list reserves later objects without building them.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 A readonly list of zones; nothing built.
   * @evidence principles/core/source-units.md#source-substantive-completion Route validation can inspect each room's reserved uses.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 checkReservations L186-227, called at house.ts:231.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network requires each room's internal use and route bands alongside its connection; reservations carries those room-owned zones for the 2.00 m clearance check.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 05-route-network.md:68-74 room-internal routes/uses; :78 the 2.00 m test. reservations (shared.ts:158) feed routeClearHeight (shared.ts:188-226). 0fae5e8d added the band; the positive rows sit on the exposing hosts checkReservations (shared.ts:185) and buildGarageInterior (garage-interior.ts:65). This field is unchanged since 6a1501fb.
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
 * @evidenceReview spaces/05-route-network.md #60bf203 v-141 L207 'leaves space' throw; L221-223 route crosses body throw; 05-route-network.md:78 bodies block the walking band.
 * @evidence spaces/05-route-network.md#room-route-network It checks reservation bounds, unknown spaces and route/body intersections within the designed 2.00 m walking volume while allowing sweeps and coverings.
 * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 v-141 L197 empty plan, L201 unknown space, L207 leaves space, L214-225 route/body overlap below head = floor+2.0 (L187,219). use/swing/covering not tested. 05-route-network.md:78.
 * @evidence principles/core/source-units.md#source-scope-preservation Validation reads room-authored zones without moving or generating them.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Only reads and throws; returns void; no reservation is mutated or created.
 * @evidence principles/core/source-units.md#source-substantive-completion Failures name the offending room, zone and crossing body.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Messages L198-223 carry room.owner (room source path), r.id and body.r.id with body.room.owner. The room is named by its owner path.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The overhead garage guide exposed an unspecified vertical route test; room-route-network now fixes the 2.00 m body band this validator uses.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 0fae5e8d added 05-route-network.md:78 (2.00 m band above finished floor; the overhead garage guide is not a collision). The validator uses routeClearHeight 2.0 (L187, L219-221). The guide is garage-interior.ts:29 (y from door top 2.15 > -0.15+2.0).
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
 * @evidenceReview spaces/01-storeys.md #3d5a439 v-141 L238 levels ?? [floorOf, ceilingOf]; 01-storeys.md:29,31 storey datums; :63 garage levels.
 * @evidence spaces/01-storeys.md#storey-datums The default pair comes from the assigned storey's floor and ceiling.
 * @evidenceReview spaces/01-storeys.md#storey-datums #9624dfb v-141 floorOf/ceilingOf (storeys.ts:120-133) read STOREYS ground 0/2.75 and upper 3.06/5.66 = 01-storeys.md:29,31.
 * @evidence spaces/01-storeys.md#ground-threshold-datums A room-level override preserves the garage threshold exception.
 * @evidenceReview spaces/01-storeys.md#ground-threshold-datums #b38ce8d v-141 garage-interior.ts:27 levels [garageFloor, garageCeiling] = 01-storeys.md:63 -0.15/2.55.
 * @evidence principles/core/source-units.md#source-scope-preservation The function reads established datums and does not choose a new floor.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Only reads room.levels or the STOREYS datums via floorOf/ceilingOf.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns an explicit height pair for downstream ceiling and observation construction.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Consumers: roomCeiling L368, observations.ts:324,473, environment.ts:582, checkReservations L219.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums fixes ordinary room floors and ceilings, while ground-threshold-datums puts the garage floor at -0.15 m; roomLevels chooses that explicit override without a third level.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 01-storeys.md:29,31: floors 0/3.06, ceilings 2.75/5.66; :63 garage -0.15. roomLevels (shared.ts:239) returns room.levels ?? [floorOf, ceilingOf]: one pair, no third level.
 */
export const roomLevels = (room: IRoomSpace): readonly [number, number] => room.levels ?? [floorOf(room.storey), ceilingOf(room.storey)];

/**
 * A closed storage volume a room owns and uses through a real opening (coat
 * closet, linen closet): a logical space of its own, never a route node.
 * @evidence spaces/05-route-network.md Closet and linen storage are accessible from rooms without becoming passage nodes.
 * @evidenceReview spaces/05-route-network.md #60bf203 v-141 05-route-network.md:58 linen and coat closet are storage with a real opening and depth, not route edges; environment.ts:542-548 makes them kind 'storage' spaces.
 * @evidence spaces/05-route-network.md#room-route-network Storage volume has its own id while the door remains on the room route.
 * @evidenceReview spaces/05-route-network.md#room-route-network #42ec637 v-141 IStorageSpace.id is separate from the room id (house.ts:237-245); 05-route-network.md:58,66 closet used from the room route, not an edge.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a space reservation, not an authored storage model.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Interface of id and x/y/z only; no model or mesh.
 * @evidence principles/core/source-units.md#source-substantive-completion Id and full world box let the environment expose the storage volume.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:544-547 uses storage.id and cell(storage) with x/y/z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Room-route-network keeps the entry coat and upper linen volumes outside passage edges while their door openings remain reachable; this type records each storage cell separately.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 05-route-network.md:58: coat and linen storage have real openings and depth and are not route edges. IStorageSpace records (entry.ts:113, upper-hall.ts:69-74) become separate storage spaces (environment.ts:566-571), not route nodes.
 */
export interface IStorageSpace {
  /**
   * @evidence spaces/05-route-network.md A storage volume has a stable address separate from the room route.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 id field; environment.ts:544 its own space id.
   * @evidence principles/core/source-units.md#source-scope-preservation The id names the closet volume, not a new route connection.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 id is only a space id; no connector is created.
   * @evidence principles/core/source-units.md#source-substantive-completion Environment assembly can expose the exact storage space.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:542-548 adds one storage space per record.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage names coat-storage and upper-linen-storage names the hall linen volume; their ids remain distinct from front-entry and upper-hall.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:65,89 define the coat closet and upper-hall.md:33,57 the linen closet. Producers emit ids "entry-coat-storage" (entry.ts:113) and "upper-linen-storage" (upper-hall.ts:70), pushed as their own storage spaces (environment.ts:566-571), distinct from front-entry and upper-hall.
   */
  id: string;
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a horizontal width.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 05-route-network.md:58 storage with real opening and interior depth; x field L263.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval stays inside the authored closet.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 entry.ts:109 x=[1.10,1.87] is the body plus reveal to the opening boundary (entry.md:89); upper-hall.ts:71 x=[1.87,3.07] = upper-hall.md:57.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world X.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:547 cell x from storage.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage derives its X start from tread seven plus 0.07 m, and upper-linen-storage fixes its own hall-side width; this interval carries each closet's owner value.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:89: X start = 7th upper tread start + 0.07. entry.ts:113 x[0]=COAT_STORAGE.x[0]=STAIR_STEPS.upperClosetStartX+0.07 (entry.ts:86; stair.ts:102-104 upperTreadStart(7)). upper-hall.md:57 linen X=[1.87,3.07]; upper-hall.ts:71 [STAIR_OPENING.east, 3.07]. The coat x[1]=STAIR_OPENING.east includes the reveal (entry.ts:111).
   */
  x: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a vertical interval.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 y field L270; 05:58 storage volume.
   * @evidence principles/core/source-units.md#source-scope-preservation This is interior clearance, not a shelf model.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 A range field; no shelf is built (shelves are models/05).
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world Y.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:547 cell y from storage.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage fixes its body top at Y=2.15 and upper-linen-storage fixes the linen volume from upper floor through 2.20 m height; this range carries those closet-owned limits, not room ceiling height.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:89 top Y=2.15 is the owner value; entry.ts:113 y=[groundFloor, COAT_STORAGE.top]. upper-hall.md:57 height 2.20 m; upper-hall.ts:72 [upperFloor, upperFloor+2.2]. Neither uses a room ceiling (2.75/5.66). v141 defect fixed.
   */
  y: readonly [number, number];
  /**
   * @evidence spaces/05-route-network.md The usable storage volume has a plan depth.
   * @evidenceReview spaces/05-route-network.md #60bf203 v-141 z field L277; 05:58 interior depth.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval remains the author's closet reservation.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 entry z=[STAIR_OPENING.back -4.56, frontZ -3.51] = entry.md:89; linen z=[-3.26,-2.66] = upper-hall.md:57.
   * @evidence principles/core/source-units.md#source-substantive-completion The storage cell can be bounded in world Z.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 environment.ts:547 cell z from storage.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-coat-storage places the coat volume below the upper flight with X depth 0.65 m and a separate Z width, while upper-linen-storage fixes its hall recess; z retains each volume's authored Z span.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:89 body below the upper flight, X depth from 7th tread +0.07 .. +0.72 (0.65), Z=[-4.56,-3.51]; storage z = [STAIR_OPENING.back, COAT_STORAGE.frontZ] = [-4.56,-3.51]; linen z [-3.26,-2.66]. v-143 F9 closed.
   */
  z: readonly [number, number];
}

/**
 * What one room owner emits: its space record and the solids it owns.
 * @evidence spaces/03-surface-owners.md A room source emits its finished surfaces and room record as one owned unit.
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 IRoomBuild L288-310 space + parts (+ storages), returned by each rooms/*.ts builder; 03-surface-owners.md:96.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room finish parts stay with their room while storage records remain separately addressable.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f v-141 parts and storages are separate fields; house.ts:168 parts, :237 storages, environment.ts:542 storage spaces; 03-surface-owners.md:96,116.
 * @evidence principles/core/source-units.md#source-scope-preservation The interface preserves one room author and does not assign another room's partition.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 The type assigns nothing; partition owners come from callers per the 07-boundary-assembly.md:29-41 table.
 * @evidence principles/core/source-units.md#source-substantive-completion Space, parts and optional storage are all available for house assembly.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 house.ts:168 parts, :230 spaces, :237-245 storages.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff assigns every room one file for its finishes, with coat/linen as consuming-room storage; IRoomBuild returns that file's space, parts, and optional storage together.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03-surface-owners.md:98-114: one file per room; :116: coat and linen are storage of the consuming room. IRoomBuild (shared.ts:289-311) = space, parts, storages?; entry.ts:109-129 and upper-hall.ts return all three.
 */
export interface IRoomBuild {
  /**
   * @evidence spaces/03-surface-owners.md The emitting room retains its own plan record.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 space: IRoomSpace of the emitting room.
   * @evidence principles/core/source-units.md#source-scope-preservation This field does not create or claim an adjacent room.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 One IRoomSpace per build; house.ts:233-236 refuses duplicate space ids.
   * @evidence principles/core/source-units.md#source-substantive-completion House assembly can collect the room's id, outline and uses.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 house.ts:230 collects room.space (id, outline, reservations).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan and common-room-plan each fix their own room outline and doors; space preserves the respective IRoomSpace rather than composing a new plan.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:29,31 fix the entry outline and front-door; common.md:25,27 fix the outline and two openings (door() voids common.ts:34,48). Builders return their own IRoomSpace as space (entry.ts:110, common.ts:131), not a composed plan.
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
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03-surface-owners.md:96: the room file owns its inner wall, ceiling and floor finish zones and opening perimeter. parts (shared.ts:303) holds only what each builder emits (e.g. entry.ts:114-129).
   */
  parts: IHousePart[];
  /**
   * @evidence spaces/03-surface-owners.md A room may expose its own closet or linen volume.
   * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 03-surface-owners.md:116 closets are interfaces of the consuming room; entry.ts:109, upper-hall.ts:68-74.
   * @evidence principles/core/source-units.md#source-scope-preservation These are space records, not added storage furniture.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 IStorageSpace records only.
   * @evidence principles/core/source-units.md#source-substantive-completion House assembly can include the room's usable storage cells.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 house.ts:237-245 collects storages with the owning room.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interior-surface-handoff keeps coat storage with entry and linen storage with upper-hall, while the walk-in wardrobe owns a room file; storages carries only the shallow volumes.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03-surface-owners.md:100,108 keep coat with entry and linen with upper-hall; :110,116 give the wardrobe its own file. Only entry.ts:113 and upper-hall.ts:68-75 fill storages; wardrobe.ts has none.
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
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: roomFloor (shared.ts:326-335) slabs room.outline from floorOf(storey)-finishDepth to floorOf(storey). B: main-ground-floor-base (10-ground-floor.md:27) fixes 0.025 m only for ground rooms. Upper rooms use INTERSTOREY_FLOOR_FINISH (shared.ts:314-316) from 08-floor-assembly.md:27 #interstorey-floor-boundary, which the row does not name. Partial parent list.
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
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Upper rooms: 09-ceiling-assembly.md:27 puts the finish in the bottom 0.015 m of the 0.18 m reservation and :29 gives the visible ceiling to the room; roomCeiling (shared.ts:368-377) slabs [ceiling, ceiling+CEILING_FINISH]. But it also serves ground rooms (08-floor-assembly.md:27 ceiling finish 0.015) and the garage (09#garage-ceiling-closure); the row omits those parents (shared.ts:9-10).
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
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: partitionSpan (shared.ts:387-390) = [floorOf, ceilingOf]. B: the floor-to-ceiling partition height is stated in sibling #interior-boundary-ownership (07-boundary-assembly.md:45), not in #interior-boundary-junctions (07:75-87: junction zones and heights only). Same-file sibling.
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
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 B: 07-boundary-assembly.md:27: the structural owner creates the common body and opening cut once. A: partition (shared.ts:405-429) returns part(id, props.owner, "partition", straightWall(...)). straightWall builds one wallPanel mesh (solids.ts:419) but returns its own full-rectangle face (solids.ts:425-438). The row names the inner primitive, not what the host returns.
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
