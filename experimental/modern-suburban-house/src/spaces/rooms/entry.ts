/**
 * `front-entry`: the ground-storey L-shaped distribution space and its coat closet.
 *
 * Design owner: `docs/spaces/rooms/entry.md` (`entry-plan`,
 * `entry-coat-storage`). Finished inner outline (X, Z): (-1.80, -0.25),
 * (2.02, -0.25), (2.02, -3.41), (-0.65, -3.41), (-0.65, -1.45), (-1.80, -1.45);
 * it includes the stair's lower waiting area X = [-1.80, -0.65],
 * Z = [-1.45, -0.25]. The front door void belongs to the front wall and is cut
 * by `envelope/front.ts`; no partition is assigned to this owner by 07.
 *
 * The coat closet body X = [1.10, 1.75], Z = [-4.56, -3.51], Y = [0, 2.15]
 * stays hollow under the upper flight, whose underside above it and whose
 * X = [1.87, 2.02] closure geometry belongs to `stair.ts`; this room exports
 * the closet body, top, and opening span that the closure consumes. This
 * owner emits the closet's own walls inside the stair plan: the back end
 * X = [1.03, 1.10] closing it against the solid under-stair at the upper
 * flight's seventh tread, and the side Z = [-3.51, -3.41] at the flight's front
 * line, both up to the closet top. X = [1.75, 2.02] stays an open reveal. The
 * rod, shelves and sliding leaves are later models.
 *
 * Output: the room record, its wood floor and ceiling through the open strip
 * beside the lower flight, the separate closet floor and room-side opening
 * strip, and the closet walls. The floor zones have disjoint plan interiors.
 */
import { DOOR_ENTRY_LIVING_DOOR } from "./living";
import { PALETTE } from "../palette";
import { MAIN } from "../building";
import { block } from "../solids";
import { part } from "../solid-records";
import { floorOf, GROUND_LAYERS, STOREYS } from "../storeys";
import { STAIR_OPENING, STAIR_STEPS } from "../stair";
import {
  box,
  doorFloor,
  roomCeiling,
  roomFloor,
  type IRoomBuild,
  type IRoomSpace,
} from "./shared";

const FLOOR = floorOf("ground-storey");
/** The entry plan owns the front threshold span consumed by wall, base and porch. */
/**
 * @evidence spaces/rooms/entry.md The front entrance has one room-owned rough door span.
 * @evidenceReview spaces/rooms/entry.md # `FRONT_DOOR` names the entry plan's sole porch-facing opening, X = [0.40, 1.40] with head Y = 2.20; the wall and threshold consumers read this exported value.
 * @evidence spaces/rooms/entry.md#entry-plan The exported jamb span feeds the front wall cut, ground base and porch step axis; its floor-derived bottom extends the wall cut through the support depth.
 * @evidenceReview spaces/rooms/entry.md#entry-plan # `buildFront` cuts the wall with `FRONT_DOOR` and spans its threshold by `from`/`to`; `buildGroundFloor` uses the same jambs for its base, while `PORCH_STEP_CENTRE_X` averages them. Only the wall cut reads this record's bottom.
 * @evidence principles/core/source-units.md#source-scope-preservation This value declares no second doorway or door leaf.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `FRONT_DOOR` is one rough hole record with id, jambs and vertical limits; it declares no door leaf, which belongs to the later front-entry filling.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers use one export for rough opening and threshold alignment.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildFront` uses this record for its front-wall hole and threshold jambs; `buildGroundFloor` aligns a base strip to those jambs and `PORCH_STEP_CENTRE_X` derives the porch axis from them.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan fixes the front doorway X span and Y = [0, 2.20] opening; 10-ground-floor.md#main-ground-floor-base fixes the 0.025 m finish and 0.15 m support depths, and ground-threshold-junctions carries that base under the crossing.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `FRONT_DOOR` preserves the entry plan's X = [0.40, 1.40] and 2.20 m head, deriving its lower wall-cut limit from `GROUND_LAYERS`; `buildGroundFloor` computes the matching support strip from the same layers without needing a new parent sill.
 */
export const FRONT_DOOR = {
  id: "front-door",
  from: 0.4,
  to: 1.4,
  bottom: STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: 2.2,
} as const;

const entrySpace = (): IRoomSpace => ({
  id: "front-entry",
  owner: "rooms/entry.ts",
  storey: "ground-storey",
  outline: [
    { x: STAIR_OPENING.west, z: STAIR_OPENING.front },
    { x: 2.02, z: STAIR_OPENING.front },
    { x: 2.02, z: STAIR_OPENING.turnZ },
    { x: STAIR_OPENING.turnX, z: STAIR_OPENING.turnZ },
    { x: STAIR_OPENING.turnX, z: STAIR_STEPS.lowerStartZ },
    { x: STAIR_OPENING.west, z: STAIR_STEPS.lowerStartZ },
  ],
  floor: PALETTE.woodFloor,
  reservations: [
    // entry-plan: the stair's lower waiting area kept on this room's floor.
    { id: "entry-stair-waiting", kind: "use", x: [STAIR_OPENING.west, STAIR_OPENING.turnX], z: [STAIR_STEPS.lowerStartZ, STAIR_OPENING.front] },
    // entry-use-routes: the shallow mat behind the opened front door.
    // entry-coat-storage decides the closet's front use, facing -X on the service band floor.
    { id: "entry-coat-front-use", kind: "use", space: "service-access", x: [2.1, 2.7], z: [-4.4, -3.65] },
    { id: "entry-mat", kind: "covering", x: [0.45, 1.35], z: [-1.95, -1.3], y: [FLOOR, FLOOR + 0.006] },
    // entry-coat-storage's body Z = [-4.56, -3.51] and its front use
    // X = [2.10, 2.70] lie outside this outline (the body is `storages`).
  ],
});

/**
 * @evidence spaces/rooms/entry.md The entry owns the coat body and opening consumed by the upper flight.
 * @evidenceReview spaces/rooms/entry.md # `COAT_STORAGE` exports the entry-owned body X, Y = 2.15 top and door span; `buildStair` consumes the top beneath overlapping upper treads and the span in its end closure.
 * @evidence principles/core/source-units.md#source-scope-preservation Entry fixes the closet top and opening but derives its body X from the stair's seventh upper tread station.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `COAT_STORAGE.x` starts 0.07 m beyond `STAIR_STEPS.upperClosetStartX`, the seventh upper-tread station; the entry owns the closet top and opening while stair remains the tread owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The storage, closet walls, stair underside, and cut opening read one top; the closure reads this export's opening Z span.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildEntry` uses `COAT_STORAGE.top` for the storage volume and two walls; `buildStair` uses the same top under the overlapping treads and above the closure opening, whose Z span comes from this record.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work COAT_STORAGE exposed reversed derivation of closet X and upper treads: a15c1dd1 revised rooms/entry.md#entry-coat-storage and 02-stair.md#stair-boundary-heights so the seventh tread sets X and treads 7-9 consume the closet top Y=2.15.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `COAT_STORAGE.x` follows the seventh upper-tread station and owns Y = 2.15 for the closet; `buildStair` tests its upper tread blocks against that interval and uses the closet top as their underside, as the revised entry and stair parents require.
 */
export const COAT_STORAGE = {
  x: [STAIR_STEPS.upperClosetStartX + 0.07, STAIR_STEPS.upperClosetStartX + 0.72] as const,
  frontZ: -3.51,
  top: 2.15,
  opening: { from: -4.51, to: -3.56 },
  backWallX: STAIR_STEPS.upperClosetStartX,
} as const;
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;

/** Emit the entry floor and ceiling finishes, its share under entry-living-door and the coat closet walls. */
/**
 * @evidence spaces/rooms/entry.md This builder owns the L-shaped front-entry floor, its interrupted ceiling, and the under-stair coat closet.
 * @evidenceReview spaces/rooms/entry.md # `buildEntry` returns the six-corner entry floor, a separate coat-storage floor and inner opening strip, a ceiling stopped at the stair opening, and its two entry-owned closet walls beneath the upper flight.
 * @evidence spaces/rooms/entry.md#entry-plan ENTRY retains the six-corner outline and the stair waiting strip without creating a front-wall door body.
 * @evidenceReview spaces/rooms/entry.md#entry-plan # `entrySpace` traces the six plan corners and reaches `STAIR_OPENING.turnX` beside the lower flight; `buildEntry` finishes that open strip at both datums and leaves the front-wall door cut to `buildFront`.
 * @evidence spaces/rooms/entry.md#entry-use-routes The entry mat, lower stair waiting, and floor under entry-living-door remain in the entry's own use area.
 * @evidenceReview spaces/rooms/entry.md#entry-use-routes #16baa19 `entrySpace.reservations` records the thin mat at X = [0.45, 1.35], Z = [-1.95, -1.30] and lower stair waiting; `buildEntry` finishes the room-side floor under `entry-living-door`.
 * @evidence spaces/rooms/entry.md#entry-coat-storage A hollow storage record and two closet walls end under the upper flight at COAT_STORAGE.top.
 * @evidenceReview spaces/rooms/entry.md#entry-coat-storage #982edc9 The storage record, its floor inset and inner half of the opening strip use the coat bounds and ground datum; the two closet walls end at `COAT_STORAGE.top`, which `buildStair` consumes beneath the upper treads.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair builder retains its flight and closet closure; this room emits its allocated room and storage floors, opening half, ceiling, and two closet walls.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildEntry` emits its room and storage floors, its half of the coat opening, a cut-back ceiling, living-door finish and two coat walls; the stair flight and closet end closure remain with `buildStair`.
 * @evidence principles/core/source-units.md#source-substantive-completion The return includes a logical room, storage volume, and real finish/partition parts with stable identities.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildEntry` returns the `front-entry` record, named coat storage volume and seven concrete finish/wall parts, including separate storage and room-side opening floors.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Emitting the coat-storage floor exposed an uncovered interior beyond the entry circulation outline; rooms/entry.md#entry-coat-storage, rooms/service.md#service-access-plan and 03-surface-owners.md#interior-surface-handoff were revised to allocate that finish. Emitting the stair-side ceiling exposed another uncovered strip and then a shared edge-finish volume; rooms/entry.md#entry-plan, 02-stair.md#stair-floor-opening, 03-surface-owners.md#interior-surface-handoff and 08-floor-assembly.md#interstorey-edge-junctions were revised to separate the room datum finish from the stair-owned vertical finish.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work # The storage inset and opening strips in `buildEntry` exercise the revised coat and service boundaries; its room floor and ceiling reach the open stair side while the edge finish begins above `CEILING_FINISH`. The cited room, stair, surface and floor owners now allocate those formerly uncovered or shared sections before this builder emits them.
 */
export const buildEntry = (): IRoomBuild => {
  const ENTRY = entrySpace();
  const coatStorage = { id: "entry-coat-storage", x: [COAT_STORAGE.x[0], STAIR_OPENING.east] as const, y: [STOREYS.groundFloor, COAT_STORAGE.top] as const, z: [STAIR_OPENING.back, COAT_STORAGE.frontZ] as const };
  return {
  space: ENTRY,
  // The coat closet interior: body X = [1.10, 1.75] plus the open reveal to the
  // closure's inner face X = 1.87, under the stair structure at Y = 2.15.
  storages: [coatStorage],
  parts: [
    roomFloor(ENTRY),
    roomFloor(ENTRY, { id: coatStorage.id, outline: box(coatStorage.x, coatStorage.z) }),
    doorFloor(ENTRY, "entry-coat-opening", [STAIR_OPENING.east, STAIR_OPENING.east + MAIN.partition / 2], [COAT_STORAGE.opening.from, COAT_STORAGE.opening.to]),
    // Over X = [-1.80, -0.65], Z = [-1.45, -0.25] the stair opening runs on to the
    // front wall (02 stair-floor-opening): the entry ceiling stops at its edge.
    roomCeiling(ENTRY, [
      { x: STAIR_OPENING.turnX, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.turnZ },
      { x: STAIR_OPENING.turnX, z: STAIR_OPENING.turnZ },
    ]),
    doorFloor(ENTRY, "entry-living-door", [-1.875, -1.8], [DOOR_ENTRY_LIVING_DOOR.from, DOOR_ENTRY_LIVING_DOOR.to]),
    part("entry-coat-back", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.backWallX, BASE, STAIR_OPENING.back], [COAT_STORAGE.x[0], COAT_STORAGE.top, STAIR_OPENING.turnZ])),
    part("entry-coat-side", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.x[0], BASE, COAT_STORAGE.frontZ], [STAIR_OPENING.east, COAT_STORAGE.top, STAIR_OPENING.turnZ])),
  ],
  };
};
