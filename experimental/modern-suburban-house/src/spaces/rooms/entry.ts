/**
 * `front-entry`: the ground-storey L-shaped distribution space and its coat closet.
 *
 * Design owner: `docs/spaces/rooms/entry.md` (`entry-plan`,
 * `entry-coat-storage`). Finished inner outline (X, Z): (-1.80, -0.25),
 * (2.02, -0.25), (2.02, -3.41), (-0.50, -3.41), (-0.50, -1.45), (-1.80, -1.45);
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
 * Output: the room record, its wood floor finish and the closet walls.
 */
import { DOOR_ENTRY_LIVING_DOOR } from "./living";
import { PALETTE } from "../palette";
import { block } from "../solids";
import { part } from "../solid-records";
import { floorOf, GROUND_LAYERS, STOREYS } from "../storeys";
import { STAIR_OPENING, STAIR_STEPS } from "../stair";
import {
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
 * @evidenceReview spaces/rooms/entry.md #4fde286 v-141 entry.ts:45-51 one FRONT_DOOR {0.4,1.4, top 2.2}; entry.md:31 X=[0.40,1.40], Y=[0,2.20]; source assignment entry.md:33. No other front-door declaration in src/spaces.
 * @evidence spaces/rooms/entry.md#entry-plan The same span and floor-derived sill feed its wall, base, and porch.
 * @evidenceReview spaces/rooms/entry.md#entry-plan #8374667 v-141 Span feeds wall hole (front.ts:105), threshold (front.ts:173-174), base (ground.ts:47) and porch (porch.ts:33). But the floor-derived bottom (entry.ts:49, -0.175) is read only by the wall hole; ground.ts:33-34 recomputes base bottom from GROUND_LAYERS and porch reads only the jamb centre, so 'sill feeds base and porch' overstates.
 * @evidence principles/core/source-units.md#source-scope-preservation This value declares no second doorway or door leaf.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 FRONT_DOOR is a single hole record (id, from/to, bottom/top) with no leaf; no second doorway export (grep src/spaces).
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers use one export for rough opening and threshold alignment.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 front.ts:105 hole and front.ts:173-174 front-door-threshold both read FRONT_DOOR; also ground.ts:47 and porch.ts:33.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan fixes the front doorway X span and Y=0..2.20 opening; 10-ground-floor.md#ground-threshold-junctions supplies the -0.175 m base cut below that sill.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:31 fixes X=[0.40,1.40], Y=[0,2.20] (entry.ts:47-50). Ground-threshold-junctions gives the rule (10-ground-floor.md:83 base carries the band at its floor-reservation height, :92 wall excludes the base under the door), but the -0.175 m depth (0.025+0.15 '두 예약의 합') is stated only in sibling #main-ground-floor-base :27; host reads GROUND_LAYERS entry.ts:49. Same-file sibling value. v141 B6 otherwise fixed.
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
    { x: -0.5, z: STAIR_OPENING.turnZ },
    { x: -0.5, z: STAIR_STEPS.lowerStartZ },
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
 * @evidenceReview spaces/rooms/entry.md #4fde286 COAT_STORAGE exports the entry-owned body X, top and opening; stair.ts buildStair reads that top for upper treads over the closet and the opening and top for its closure hole. The entry design assigns the closet wall and top to this room, with treads seven through nine consuming it.
 * @evidence principles/core/source-units.md#source-scope-preservation Entry fixes the closet top and opening but derives its body X from the stair's seventh upper tread station.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Entry owns top Y=2.15 and the opening; its closet X begins at STAIR_STEPS.upperClosetStartX plus 0.07, with upperClosetStartX derived from upperTreadStart(7), so the room consumes the stair station without owning a tread.
 * @evidence principles/core/source-units.md#source-substantive-completion The storage, closet walls, stair underside, and cut opening read one top; the closure reads this export's opening Z span.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f COAT_STORAGE.top drives this room's storage and two walls, then buildStair consumes it as tread underside and closure-hole top; COAT_STORAGE.opening supplies the closure cut and environment readback.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work COAT_STORAGE exposed reversed derivation of closet X and upper treads: a15c1dd1 revised rooms/entry.md#entry-coat-storage and 02-stair.md#stair-boundary-heights so the seventh tread sets X and treads 7-9 consume the closet top Y=2.15.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 r4-host-changed: getters -> values; x still reads STAIR_STEPS.upperClosetStartX (seventh-tread station), top/opening unchanged. See m1 (upperClosetStartX formula copy). | a15c1dd1 changed entry.md body :89/:95 (X from the 7th upper tread +0.07/+0.65; top Y=2.15 owned by the body; treads 7-9 underside consume it) and 02-stair.md:160 in #stair-boundary-heights. Code already derived X from STAIR_STEPS and tread underside from COAT.top in fa601efa, the reverse of the old body. Both targets, the commit and the exposing case are named; current bodies say this.
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
 * @evidenceReview spaces/rooms/entry.md #4fde286 v-141 roomFloor over the L outline, roomCeiling with outline excluding X[-1.80,-0.65] (entry.ts:114-121), storages entry-coat-storage + entry-coat-back/side (L109, L123-124).
 * @evidence spaces/rooms/entry.md#entry-plan ENTRY retains the six-corner outline and the stair waiting strip without creating a front-wall door body.
 * @evidenceReview spaces/rooms/entry.md#entry-plan #8374667 v-141 6 outline points entry.ts:57-64 = entry.md:29; entry-stair-waiting X[west,turnX] Z[lowerStartZ,front] = [-1.80,-0.65]x[-1.45,-0.25] L68; buildEntry emits no front-door part (front.ts cuts FRONT_DOOR).
 * @evidence spaces/rooms/entry.md#entry-use-routes The entry mat, lower stair waiting, and floor under entry-living-door remain in the entry's own use area.
 * @evidenceReview spaces/rooms/entry.md#entry-use-routes #16baa19 v-141 entry-mat L72 = entry.md:59 X[0.45,1.35] Z[-1.95,-1.30] 0.006; stair waiting L68; doorFloor entry-living-door entry side X[-1.875,-1.8] L122; entry.md:61 waiting + living-door front are open entry floor.
 * @evidence spaces/rooms/entry.md#entry-coat-storage A hollow storage record and two closet walls end under the upper flight at COAT_STORAGE.top.
 * @evidenceReview spaces/rooms/entry.md#entry-coat-storage #964226e Storage height and the entry-coat-back X=[1.03,1.10] and side X=[1.10,1.87] walls end at COAT_STORAGE.top; stair.ts uses that same top as the underside of overlapping upper treads seven through nine.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair builder retains its flight and closet closure; this room emits only its allocated floor, ceiling, and two closet walls.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 stair.ts still builds the treads and stair-arrival closure; this room emits its floor, ceiling, shared door floor and two coat walls under the entry owner.
 * @evidence principles/core/source-units.md#source-substantive-completion The return includes a logical room, storage volume, and real finish/partition parts with stable identities.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 space front-entry, storages [entry-coat-storage] L109, parts with stable ids (front-entry-floor/-ceiling/-entry-living-door-floor, entry-coat-back, entry-coat-side).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Entry-plan fixes the L outline and entry-coat-storage fixes the closet body; 02-stair.md#stair-floor-opening owns the open stair ceiling over its front void, leaving this builder no extra room exit.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 entry.md:29 L outline, :89 closet body; 02-stair.md:89-91 #stair-floor-opening L hole X=[-1.80,-0.65] Z to -0.25 over the lower waiting belongs to the stair and is consumed by ceiling owners; entry ceiling starts at STAIR_OPENING.turnX (entry.ts:118-125); only exit share is the existing entry-living-door strip :126. v141 B7 fixed.
 */
export const buildEntry = (): IRoomBuild => {
  const ENTRY = entrySpace();
  return {
  space: ENTRY,
  // The coat closet interior: body X = [1.10, 1.75] plus the open reveal to the
  // closure's inner face X = 1.87, under the stair structure at Y = 2.15.
  storages: [{ id: "entry-coat-storage", x: [COAT_STORAGE.x[0], STAIR_OPENING.east], y: [STOREYS.groundFloor, COAT_STORAGE.top], z: [STAIR_OPENING.back, COAT_STORAGE.frontZ] }],
  parts: [
    roomFloor(ENTRY),
    // Over X = [-1.80, -0.65], Z = [-1.45, -0.25] the stair opening runs on to the
    // front wall (02 stair-floor-opening): the entry ceiling stops at its edge.
    roomCeiling(ENTRY, [
      { x: STAIR_OPENING.turnX, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.front },
      { x: 2.02, z: STAIR_OPENING.turnZ },
      { x: -0.5, z: STAIR_OPENING.turnZ },
      { x: -0.5, z: STAIR_STEPS.lowerStartZ },
      { x: STAIR_OPENING.turnX, z: STAIR_STEPS.lowerStartZ },
    ]),
    doorFloor(ENTRY, "entry-living-door", [-1.875, -1.8], [DOOR_ENTRY_LIVING_DOOR.from, DOOR_ENTRY_LIVING_DOOR.to]),
    part("entry-coat-back", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.backWallX, BASE, STAIR_OPENING.back], [COAT_STORAGE.x[0], COAT_STORAGE.top, STAIR_OPENING.turnZ])),
    part("entry-coat-side", ENTRY.owner, "partition", PALETTE.interiorWall, block([COAT_STORAGE.x[0], BASE, COAT_STORAGE.frontZ], [STAIR_OPENING.east, COAT_STORAGE.top, STAIR_OPENING.turnZ])),
  ],
  };
};
