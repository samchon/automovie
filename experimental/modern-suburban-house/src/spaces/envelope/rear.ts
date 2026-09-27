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
 * @evidenceReview spaces/envelope/rear.md #43d1b80 v-141 GARDEN_DOOR read by rear wall hole rear.ts:112, threshold rear.ts:150-151, ground base ground.ts:52; rear.md:163 one garden door.
 * @evidence spaces/envelope/rear.md#garden-door Its -1.20..1.20 m jambs meet the terrace while the sill follows the ground base layers.
 * @evidenceReview spaces/envelope/rear.md#garden-door #f000425 v-141 Jambs -1.2/1.2 = rear.md:163 and terrace meets the outer face (rear.md:165-167) OK. But the sill SILL=-0.175 (rear.ts:36,48) comes from 10-ground-floor.md:92 (wall leaves base reservation); the cited body rear.md:163 states Y=[0,2.25].
 * @evidence principles/core/source-units.md#source-scope-preservation The host defines the rough wall cut and leaves glazed leaves and hardware to models.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Data object only; rear.ts emits no leaf/hardware; rear.md:167 leaves frame, two leaves and hardware to models.
 * @evidence principles/core/source-units.md#source-substantive-completion Rear wall, rear threshold, and ground slab tongue take their X bounds from this object.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 rear.ts:112 (hole), rear.ts:150-151 (threshold X), ground.ts:52 (garden-door-base X) all read GARDEN_DOOR.from/.to.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Garden-door fixes X=-1.20..1.20 m and a finished threshold level with the raised terrace; this export gives the wall, floor tongue, and terrace one opening axis.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 rear.md:163 X=[-1.20,1.20]; :165 both waits Y=0, threshold within 0.02; readers rear.ts:118,:156-157, ground.ts:52, terrace.ts:38 (step axis).
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
 * @evidenceReview spaces/envelope/rear.md #43d1b80 v-141 PRIMARY_REAR_WINDOW hole rear.ts:111 in rear-main-wall; rear.md:135 upper-storey primary-bedroom opening.
 * @evidence spaces/envelope/rear.md#primary-rear-window The -3.85..-1.45 m span and 3.91..5.31 m heights avoid the wardrobe bay.
 * @evidenceReview spaces/envelope/rear.md#primary-rear-window #4233065 v-141 rear.ts:61-64 X=[-3.85,-1.45] Y=[3.91,5.31] = rear.md:135, which keeps the wardrobe span closed.
 * @evidence principles/core/source-units.md#source-scope-preservation The bedroom imports this void only to reserve its inward curtain strip.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Only primary.ts:62 (primary-rear-curtain) reads it.
 * @evidence principles/core/source-units.md#source-substantive-completion The rear wall cut and the bedroom curtain share one sill, head, and horizontal host.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Hole rear.ts:111; curtain primary.ts:62 x from .from/.to, y from .bottom-0.75/.top+0.12.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Primary-rear-window fixes the X=-3.85..-1.45 m upper opening and Y=3.91..5.31 m sill/head, which the bedroom curtain consumes.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 rear.md:135 X=[-3.85,-1.45] Y=[3.91,5.31] = rear.ts:59-65; primary.ts:62 curtain reads it.
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
 * @evidenceReview spaces/envelope/rear.md #43d1b80 One record rear.ts:73-79, one hole rear.ts:116; rear.md:111.
 * @evidence principles/core/source-units.md#source-scope-preservation The common room uses this window span for its curtain and to stop the garden-door approach before the curtain; the wall cut remains here.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Readers: common.ts:65 curtain (from-0.1..to+0.1) and common.ts:112 common-garden-door-approach ending at from-0.1 = curtain start; hole stays rear.ts:116. v141 FALSE fixed.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall cut and curtain derive from the same horizontal and vertical span.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Unchanged: hole rear.ts:116 and curtain common.ts:65 share from/to and head, but the curtain Y starts at FLOOR+0.1, not the 0.75 sill; only the head derives from the vertical span.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Family-rear-window fixes the ground opening X=2.75..4.75 m above its 0.75 m sill; the wall host exports that span to common-room fit-out and route clearance.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 rear.md:111 X=[2.75,4.75] Y=[0.75,2.30] = rear.ts:73-79; exported to common.ts:65 (fit-out) and :112 (route).
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
 * @evidenceReview spaces/envelope/rear.md #43d1b80 rear.ts:132-169 main wall with voids, garage rear wall, heads, threshold.
 * @evidence spaces/envelope/rear.md#rear-roof-closures The main top steps under high and low rear roofs and the garage rear wall remains separate.
 * @evidenceReview spaces/envelope/rear.md#rear-roof-closures #c7594c6 Main outline steps at SPLIT_X (rear.ts:100-107); separate garage wall :122-131; rear.md:27,:31.
 * @evidence spaces/envelope/rear.md#rear-openings Four named rough voids in the main rear wall bind kitchen, family, primary bedroom, and garden access.
 * @evidenceReview spaces/envelope/rear.md#rear-openings #57f678a Four holes rear.ts:108-119 (kitchen, family, primary, garden); rear.md:61.
 * @evidence spaces/envelope/rear.md#kitchen-rear-window The narrow kitchen hole begins at Y=1.15 over the counter reservation.
 * @evidenceReview spaces/envelope/rear.md#kitchen-rear-window #f6b11e6 rear.ts:113 bottom 1.15 = rear.md:87 over the <=0.91 m counter.
 * @evidence spaces/envelope/rear.md#family-rear-window The right ground window hole remains in the common room's family side.
 * @evidenceReview spaces/envelope/rear.md#family-rear-window #7adb5f1 X 2.75..4.75 on the right of the main rear wall; rear.md:111 family side of kitchen-dining-family.
 * @evidence spaces/envelope/rear.md#primary-rear-window The upper rear hole stops in the primary bedroom span, leaving wardrobe storage wall closed.
 * @evidenceReview spaces/envelope/rear.md#primary-rear-window #4233065 X -3.85..-1.45; rear.md:135 keeps the wardrobe span closed.
 * @evidence spaces/envelope/rear.md#garden-door The central X=-1.20..1.20 void and finished threshold reach the level terrace side.
 * @evidenceReview spaces/envelope/rear.md#garden-door #f000425 GARDEN_DOOR hole + garden-door-threshold rear.ts:150-159 (BACK..INNER); rear.md:163-167.
 * @evidence principles/core/source-units.md#source-scope-preservation Door leaves and window frames remain model fills; this source owns wall, openings, roof wedges, and threshold.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 rear.ts emits walls, wall heads, threshold only; rear.md:167 leaves leaves/frames to models.
 * @evidence principles/core/source-units.md#source-substantive-completion The return has two closed wall solids, four real voids, three head wedges, and garden threshold support.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f rear-main-wall + rear-garage-wall, 4 holes, 3 wall heads (rear.ts:134,:142,:161), garden-door-threshold.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Rear-roof-closures fixes the high/low rear step, rear-openings fixes the kitchen, family, primary, and garden-door voids, and garden-door meets the level terrace; buildRear emits those hosts.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 rear.md:27 high/low step; :61 kitchen/family/primary/garden openings; :165-167 level terrace; buildRear emits them. rear.md body not revised by source work.
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
