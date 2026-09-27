/**
 * Rear elevation: the main rear wall and the garage rear wall with their voids.
 *
 * Design owner: `docs/spaces/envelope/rear.md`. The main rear wall is
 * Z = [-10.70, -10.45] m over X = [-5.75, 5.75] m and owns both rear corners
 * (07). Its top follows the main back roof to X = 1.60 and the right low roof
 * beyond, with wall-head wedges across the thickness. Voids (X, Y m):
 * - `kitchen-rear-window` [-4.50, -3.30] × [1.15, 2.30];
 * - `family-rear-window` [2.75, 4.75] × [0.75, 2.30];
 * - `primary-rear-window` [-3.85, -1.45] × [3.91, 5.31];
 * - `garden-door` [-1.20, 1.20] × [-0.175, 2.25]; the wall leaves the ground
 *   base reservation under it (10 ground-threshold-junctions) and
 *   `garden-door-threshold` fills the finish zone through the thickness, top
 *   0.02 m above the finished floor.
 * The garage rear wall is Z = [-6.70, -6.45] over X = [5.75, 11.70] with no
 * opening. Door leaves and window frames are later models.
 */
import { EXTERIOR_WALL_BOTTOM, GARAGE, MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  gBack,
  mBack,
  rBack,
  ROOF_THICKNESS,
  SPLIT_X,
} from "../roof/junctions";
import { block, wallPanel } from "../solids";
import { part, type IHousePart } from "../solid-records";
import { GROUND_LAYERS, STOREYS } from "../storeys";
import { wallHead } from "./wall-head";

const OWNER = "envelope/rear.ts";
const B = EXTERIOR_WALL_BOTTOM;
const BACK = MAIN.outer.z[0];
const INNER = BACK + MAIN.wall;
/** Bottom of the ground base reservation the wall leaves under the garden door (10). */
const SILL = STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base;
/**
 * @evidence spaces/envelope/rear.md The central rear exit has one opening span for wall, threshold, and floor support.
 * @evidenceReview spaces/envelope/rear.md #213e30e `GARDEN_DOOR` gives the one central rear passage X [-1.20, 1.20]; `buildRear` cuts that span and finishes its threshold while `buildGroundFloor` carries support beneath it.
 * @evidence spaces/envelope/rear.md#garden-door Its -1.20..1.20 m jambs meet the level terrace; the rough wall cut extends below the finished sill through the ground base reservation.
 * @evidenceReview spaces/envelope/rear.md#garden-door #24a7c9b The jambs and 2.25 m head match `garden-door`; `SILL` lowers the wall cut to `groundFloor - finish - base`, while `garden-door-threshold` tops the crossing 0.02 m above the level room and terrace floors.
 * @evidence principles/core/source-units.md#source-scope-preservation The host defines the rough wall cut and leaves glazed leaves and hardware to models.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This export contains a rough hole record and no door member; `buildRear` emits wall and threshold parts, leaving the two glazed leaves, frame, and hardware to models.
 * @evidence principles/core/source-units.md#source-substantive-completion Rear wall, rear threshold, and ground slab tongue take their X bounds from this object.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The rear wall hole, `garden-door-threshold` X bounds, and `buildGroundFloor` garden base strip all consume this record's jambs.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-door fixes X=-1.20..1.20 m and a finished threshold level with the raised terrace; this export gives the wall, floor tongue, and terrace one opening axis.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `garden-door` fixes X [-1.20, 1.20] with level inside/outside waits and a threshold no more than 0.02 m above them; this export carries its jambs to rear wall, base strip, threshold, and terrace step axis.
 */
export const GARDEN_DOOR = {
  id: "garden-door",
  from: -1.2,
  to: 1.2,
  bottom: SILL,
  top: 2.25,
} as const;
/** Rough opening owned by the rear elevation and consumed by bedroom reservations. */
/**
 * @evidence spaces/envelope/rear.md The upper rear opening in the primary bedroom remains a wall-hosted void.
 * @evidenceReview spaces/envelope/rear.md #213e30e `PRIMARY_REAR_WINDOW` is the high opening passed to the main rear wall's holes, aligned to the parent primary-bedroom span rather than the closed wardrobe bay.
 * @evidence spaces/envelope/rear.md#primary-rear-window The -3.85..-1.45 m span and 3.91..5.31 m heights avoid the wardrobe bay.
 * @evidenceReview spaces/envelope/rear.md#primary-rear-window #4233065 This record fixes X [-3.85, -1.45], Y [3.91, 5.31] on the rear wall; its right jamb stops before the wardrobe's X [0.90, 5.50] closed rear span.
 * @evidence principles/core/source-units.md#source-scope-preservation The bedroom imports this void only to reserve its inward curtain strip.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The rear elevation owns this wall hole; `primary.ts` imports the value solely to size its inward `primary-rear-curtain` reservation.
 * @evidence principles/core/source-units.md#source-substantive-completion The rear wall cut and the bedroom curtain share one sill, head, and horizontal host.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildRear` cuts this exported span; the primary-room curtain derives X from its jambs and Y from its sill minus 0.75 and head plus 0.12.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Primary-rear-window fixes the X=-3.85..-1.45 m upper opening and Y=3.91..5.31 m sill/head, which the bedroom curtain consumes.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `primary-rear-window` fixes this X/Y opening within the bedroom rather than the wardrobe, and the rear wall and bedroom curtain consume the same record without moving its parent boundary.
 */
export const PRIMARY_REAR_WINDOW = {
  id: "primary-rear-window",
  from: -3.85,
  to: -1.45,
  bottom: 3.91,
  top: 5.31,
} as const;

/**
 * @evidence spaces/envelope/rear.md The family room rear window owns one rough opening.
 * @evidenceReview spaces/envelope/rear.md #213e30e `FAMILY_REAR_WINDOW` is the single family-side rear opening, exported as one record and passed once into `buildRear`'s main wall hole list.
 * @evidence principles/core/source-units.md#source-scope-preservation The common room uses this window span for its curtain and to stop the garden-door approach before the curtain; the wall cut remains here.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `COMMON.reservations` reads the jambs and head for its family curtain and uses `.from - 0.1` to stop the garden-door approach at that curtain; the rough wall cut remains in `buildRear`.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall cut and curtain share the same jambs and head while the curtain's lower edge follows the room floor.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The rear wall cuts the full exported hole; `family-rear-curtain` derives X from `.from`/`.to` and its top from `.top`, but starts at `FLOOR + 0.1` rather than the window sill.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Family-rear-window fixes the ground opening X=2.75..4.75 m above its 0.75 m sill; the wall host exports that span to common-room fit-out and route clearance.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `family-rear-window` fixes X [2.75, 4.75], Y [0.75, 2.30] in the common room's rear wall; `buildRear` cuts it and common-room reservations use its jambs/head for curtain and approach without revising the parent.
 */
export const FAMILY_REAR_WINDOW = {
  id: "family-rear-window",
  from: 2.75,
  to: 4.75,
  bottom: 0.75,
  top: 2.3,
} as const;

/** Emit the rear elevation walls. */
/**
 * @evidence spaces/envelope/rear.md This builder creates the rear main and garage walls with room-specific voids.
 * @evidenceReview spaces/envelope/rear.md #213e30e `buildRear` returns the main and separate garage rear walls, their roof-contact heads, and a garden-door threshold; the main wall carries four room-bound openings.
 * @evidence spaces/envelope/rear.md#rear-roof-closures The main top steps under high and low rear roofs and the garage rear wall remains separate.
 * @evidenceReview spaces/envelope/rear.md#rear-roof-closures #c7594c6 The main wall outline steps at `SPLIT_X` from the low-right to main roof underside, while the garage rear wall is a separate panel under `gBack`.
 * @evidence spaces/envelope/rear.md#rear-openings Four named rough voids in the main rear wall bind kitchen, family, primary bedroom, and garden access.
 * @evidenceReview spaces/envelope/rear.md#rear-openings #57f678a The main rear panel has kitchen, family, primary-bedroom, and garden-door rough holes; the separate garage rear panel has no hole, preserving the parent room binding.
 * @evidence spaces/envelope/rear.md#kitchen-rear-window The narrow kitchen hole begins at Y=1.15 over the counter reservation.
 * @evidenceReview spaces/envelope/rear.md#kitchen-rear-window #f6b11e6 The inline kitchen hole spans X [-4.50, -3.30] with Y [1.15, 2.30], above the parent kitchen counter's maximum 0.91 m top.
 * @evidence spaces/envelope/rear.md#family-rear-window The right ground window hole remains in the common room's family side.
 * @evidenceReview spaces/envelope/rear.md#family-rear-window #7adb5f1 The main wall's `FAMILY_REAR_WINDOW` hole is X [2.75, 4.75] on the right ground portion of the shared kitchen-dining-family room.
 * @evidence spaces/envelope/rear.md#primary-rear-window The upper rear hole stops in the primary bedroom span, leaving wardrobe storage wall closed.
 * @evidenceReview spaces/envelope/rear.md#primary-rear-window #4233065 `PRIMARY_REAR_WINDOW` cuts the main wall at upper-bedroom Y [3.91, 5.31] within X [-3.85, -1.45], leaving the wardrobe's positive-X rear wall closed.
 * @evidence spaces/envelope/rear.md#garden-door The central X=-1.20..1.20 void and finished threshold reach the level terrace side.
 * @evidenceReview spaces/envelope/rear.md#garden-door #24a7c9b `GARDEN_DOOR` cuts the central wall; `garden-door-threshold` spans its jambs across `BACK..INNER` and tops out 0.02 m above the finished ground/terrace level.
 * @evidence principles/core/source-units.md#source-scope-preservation Door leaves and window frames remain model fills; this source owns wall, openings, roof wedges, and threshold.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The return contains rough wall panels, roof-contact heads, and one threshold, with no glazed door leaves, sash, frames, or hardware that the design assigns to models.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has two closed wall solids, four real voids, three head wedges, and garden threshold support.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Six returned parts comprise two walls, three `wallHead` closures, and a solid threshold; the main wall has four explicit rough holes.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Rear-roof-closures fixes the high/low rear step, rear-openings fixes the kitchen, family, primary, and garden-door voids, and garden-door meets the level terrace; buildRear emits those hosts.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `rear-roof-closures` supplies the high/low split and separate garage wall, `rear-openings` supplies the four room bindings, and `garden-door` fixes the level terrace contact; this builder realizes those parents without a new rear-wall decision.
 */
export const buildRear = (): IHousePart[] => {
  const mainTop = mBack(BACK) - ROOF_THICKNESS;
  const rightTop = rBack(BACK) - ROOF_THICKNESS;
  const main = wallPanel({
    axis: "x",
    across: [BACK, INNER],
    outline: [
      { u: MAIN.outer.x[0], y: B },
      { u: MAIN.outer.x[1], y: B },
      { u: MAIN.outer.x[1], y: rightTop },
      { u: SPLIT_X, y: rightTop },
      { u: SPLIT_X, y: mainTop },
      { u: MAIN.outer.x[0], y: mainTop },
    ],
    holes: [
      {
        id: "kitchen-rear-window",
        from: -4.5,
        to: -3.3,
        bottom: 1.15,
        top: 2.3,
      },
      FAMILY_REAR_WINDOW,
      PRIMARY_REAR_WINDOW,
      GARDEN_DOOR,
    ],
  });
  const garageTop = gBack(GARAGE.outer.z[0]) - ROOF_THICKNESS;
  const garage = wallPanel({
    axis: "x",
    across: [GARAGE.outer.z[0], GARAGE.inner.z[0]],
    outline: [
      { u: GARAGE.inner.x[0], y: B },
      { u: GARAGE.outer.x[1], y: B },
      { u: GARAGE.outer.x[1], y: garageTop },
      { u: GARAGE.inner.x[0], y: garageTop },
    ],
  });
  return [
    part("rear-main-wall", OWNER, "wall", PALETTE.siding, main),
    wallHead({
      id: "rear-main-wall-head",
      owner: OWNER,
      x: [MAIN.outer.x[0], SPLIT_X],
      z: [BACK, INNER],
      roof: mBack,
      outerZ: BACK,
    }),
    wallHead({
      id: "rear-right-wall-head",
      owner: OWNER,
      x: [SPLIT_X, MAIN.outer.x[1]],
      z: [BACK, INNER],
      roof: rBack,
      outerZ: BACK,
    }),
    part(
      "garden-door-threshold",
      OWNER,
      "floor",
      PALETTE.structure,
      block(
        [GARDEN_DOOR.from, STOREYS.groundFloor - GROUND_LAYERS.finish, BACK],
        [GARDEN_DOOR.to, STOREYS.groundFloor + 0.02, INNER],
      ),
    ),
    part("rear-garage-wall", OWNER, "wall", PALETTE.siding, garage),
    wallHead({
      id: "rear-garage-wall-head",
      owner: OWNER,
      x: [GARAGE.inner.x[0], GARAGE.outer.x[1]],
      z: [GARAGE.outer.z[0], GARAGE.inner.z[0]],
      roof: gBack,
      outerZ: GARAGE.outer.z[0],
    }),
  ];
};
