/**
 * Left elevation: the main left gable wall, its two windows, and the chimney.
 *
 * Design owner: `docs/spaces/envelope/left.md` (`left-roof-closure`,
 * `left-openings`, `living-left-window`, `primary-left-window`,
 * `chimney-roof-interface`). The wall is X = [-5.75, -5.50] m and ends at the
 * front and rear walls' inner faces (07). Its top is the main roof underside,
 * a triangle whose peak is the ridge at Z = -5.35. The chimney body
 * X = [-6.30, -5.50], Z = [-2.75, -1.65] m takes the wall's place over its Z
 * range, so the wall is two panels on either side of it. Voids (Z, Y m):
 * `living-left-window` [-5.50, -4.30] × [0.75, 2.30] and
 * `primary-left-window` [-8.90, -7.30] × [3.91, 5.31].
 *
 * Chimney: body Y = [-0.45, 8.90] m, cap Y = [8.90, 9.10] m projecting 0.10 m
 * on every side, and the living-room fireplace front X = [-5.50, -4.95],
 * Z = [-3.00, -1.40], Y = [0, 1.40] m. Brick surrounds a real firebox void
 * Z = [-2.72, -1.68], Y = [0.23, 0.87] m; models supplies the black liner and
 * the wood mantel at Y = [1.30, 1.40] m. The fire is out; flue and combustion
 * are not modelled.
 */
import { EXTERIOR_WALL_BOTTOM, MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  CHIMNEY_PLAN,
  MAIN_RIDGE_Z,
  mainRoof,
  ROOF_THICKNESS,
} from "../roof/junctions";
import { block, wallPanel } from "../solids";
import { part, type IHousePart } from "../solid-records";
import { STOREYS } from "../storeys";

const OWNER = "envelope/left.ts";
/** Chimney cap projection beyond each side of the masonry body (chimney-roof-interface). */
/**
 * @evidence spaces/envelope/left.md#chimney-roof-interface The cap projects 0.10 m beyond the chimney body on each side.
 * @evidenceReview spaces/envelope/left.md#chimney-roof-interface #bb50617 left.md:131 cap projects 0.10 m horizontally beyond the body; left.ts:133-140 apply CHIMNEY_CAP_OVERHANG on all four sides.
 * @evidence spaces/envelope/left.md The left elevation owns the projecting chimney cap that bounds the fence setback.
 * @evidenceReview spaces/envelope/left.md #24dc395 Ownership holds (left.md:131,:133; cap left.ts:126-143) and fence.ts:31 reads it, but left.md never mentions the fence: the cap-bounded fence line is authored in site/fence.md:29.
 * @evidence principles/core/source-units.md#source-scope-preservation The cap projection belongs to the left elevation and is consumed by the fence setback.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Exported at left.ts:41; readers are left.ts:133-140 and fence.ts:23,31 only.
 * @evidence principles/core/source-units.md#source-substantive-completion A shared offset places both cap faces and the fence outside the farthest masonry.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f left.ts:133-140 offset every cap face; fence.ts:31 L=min(CHIMNEY_PLAN.x[0]-OVERHANG, MAIN.outer.x[0])-0.6 = -7.00, outside the -6.30 body.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The chimney-roof-interface parent fixes the 0.10 m cap projection that this exported value shares.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 left.md:131 fixes the 0.10 m projection (present before source work, 18f2517c); left.ts:41 value shared by cap and fence.ts:31 (fence.md:29).
 */
export const CHIMNEY_CAP_OVERHANG = 0.1;
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN.outer.x[0], MAIN.inner.x[0]] as const;
const under = (z: number): number => mainRoof(z) - ROOF_THICKNESS;
/** Rough opening owned by the left elevation and consumed by bedroom reservations. */
/**
 * @evidence spaces/envelope/left.md The primary bedroom's side window has one Z and Y host in the rear left wall panel.
 * @evidenceReview spaces/envelope/left.md #24dc395 v-141 PRIMARY_LEFT_WINDOW is a hole of backPanel only (left.ts:86-100, Z back..chimneyBack); left.md:105 Z/Y host in the left wall.
 * @evidence spaces/envelope/left.md#primary-left-window Its -8.90..-7.30 m opening lies clear of the chimney and above the upper floor.
 * @evidenceReview spaces/envelope/left.md#primary-left-window #21e8960 v-141 Z=[-8.9,-7.3] (left.ts:46-47) far from chimney Z=[-2.75,-1.65]; Y 3.91 > upper floor 3.06; left.md:105 values (chimney avoidance itself stated at left.md:55, same file).
 * @evidence principles/core/source-units.md#source-scope-preservation This is a wall void, while the bedroom only reserves a curtain from its bounds.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Only room consumer primary.ts:63 (primary-left-curtain from .from/.to/.bottom/.top); the cut is made only at left.ts:98.
 * @evidence principles/core/source-units.md#source-substantive-completion The back panel cut and the left curtain strip use this same interval and sill/head.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Hole left.ts:98; curtain primary.ts:63 z=[from-0.1,to+0.1], y=[bottom-0.75,top+0.12]: same interval, sill and head.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Primary-left-window fixes the rear left-wall opening Z=-8.90..-7.30 m above the upper floor; this span stays on the envelope host before bedroom curtain use.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 left.md:105 Z=[-8.90,-7.30] Y=[3.91,5.31] upper-storey = left.ts:53-59; hole left.ts:111, curtain primary.ts:63.
 */
export const PRIMARY_LEFT_WINDOW = {
  id: "primary-left-window",
  from: -8.9,
  to: -7.3,
  bottom: 3.91,
  top: 5.31,
} as const;

/**
 * @evidence spaces/envelope/left.md The living room side window owns one rough opening.
 * @evidenceReview spaces/envelope/left.md #24dc395 One record left.ts:67-73, one hole left.ts:111; left.md:81.
 * @evidence principles/core/source-units.md#source-scope-preservation The room reserves fit-out without moving this facade cut.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 living.ts:52 reads from/to/top for its curtain without changing the record.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall hole and curtain share the same host span.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f left.ts:111 hole and living.ts:52 curtain both read LIVING_LEFT_WINDOW.from/to (head from .top).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-left-window fixes Z=-5.50..-4.30 m behind the fireplace while leaving that masonry body closed; this export carries its rough void.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 left.md:81 Z=[-5.50,-4.30] behind the fireplace reservation, no overlap with the firebox; left.ts:67-73; fireplace Z=[-3.00,-1.40] (left.ts:149-170) stays closed.
 */
export const LIVING_LEFT_WINDOW = {
  id: "living-left-window",
  from: -5.5,
  to: -4.3,
  bottom: 0.75,
  top: 2.3,
} as const;

/** Emit the left gable wall panels and the chimney. */
/**
 * @evidence spaces/envelope/left.md This builder emits the left main-wall panels and the single exterior/interior chimney contact.
 * @evidenceReview spaces/envelope/left.md #24dc395 left.ts:113-172: two wall panels, chimney body and cap, hearth/cheeks/head.
 * @evidence spaces/envelope/left.md#left-roof-closure Front and back wall panels meet the main roof underside without a second gable slab.
 * @evidenceReview spaces/envelope/left.md#left-roof-closure #4810fd1 Panel tops follow under(z)=mainRoof-ROOF_THICKNESS (left.ts:44,97-98,107-109); no separate gable slab; left.md:25.
 * @evidence spaces/envelope/left.md#left-openings Only the living and primary window holes puncture the back panel behind the chimney.
 * @evidenceReview spaces/envelope/left.md#left-openings #5342577 backPanel holes [LIVING, PRIMARY] left.ts:111; frontPanel has none; left.md:55 two windows only.
 * @evidence spaces/envelope/left.md#living-left-window The living-side void spans Z=-5.50..-4.30 outside the fireplace body.
 * @evidenceReview spaces/envelope/left.md#living-left-window #1dfb320 Z -5.5..-4.3 (left.ts:69-70) vs fireplace Z -3.0..-1.4; left.md:81.
 * @evidence spaces/envelope/left.md#primary-left-window The primary bedroom's upper void spans Z=-8.90..-7.30 in the rear panel.
 * @evidenceReview spaces/envelope/left.md#primary-left-window #21e8960 PRIMARY Z -8.9..-7.3 in backPanel (back..chimneyBack, left.ts:101-111); left.md:105.
 * @evidence spaces/envelope/left.md#chimney-roof-interface One chimney body and cap cross the roof notch; hearth, cheeks, and head surround a real firebox gap.
 * @evidenceReview spaces/envelope/left.md#chimney-roof-interface #bb50617 Body to 8.9 and cap 8.9-9.1 (left.ts:116-143); hearth/left/right/head (:144-171) leave Z -2.72..-1.68, Y 0.23..0.87 open = left.md:133.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder omits flue/fire behavior, window fills, and mantel while retaining the exterior chimney and wall contact.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 No flue, window fill or mantel parts in left.ts:113-172; left.md:133 gives liner/mantel to models.
 * @evidence principles/core/source-units.md#source-substantive-completion Two cut wall meshes plus body, cap, and fireplace brick solids give a tangible left elevation.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Two wallPanel meshes plus body, cap and four brick blocks (left.ts:113-172).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Left-roof-closure supplies the two roof-contact panels, left-openings fixes living and primary holes, and chimney-roof-interface fixes masonry and its firebox gap; buildLeft emits those assigned bodies.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 left.md:25,:27 roof closure split at the chimney body via 07; :55 exactly two windows; :131,:133 masonry and firebox void; left.ts emits those parts. No source-work body revision of left.md.
 */
export const buildLeft = (): IHousePart[] => {
  const front = MAIN.inner.z[1];
  const back = MAIN.inner.z[0];
  const [chimneyBack, chimneyFront] = CHIMNEY_PLAN.z;
  const frontPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: chimneyFront, y: B },
      { u: front, y: B },
      { u: front, y: under(front) },
      { u: chimneyFront, y: under(chimneyFront) },
    ],
  });
  const backPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: B },
      { u: chimneyBack, y: B },
      { u: chimneyBack, y: under(chimneyBack) },
      { u: MAIN_RIDGE_Z, y: under(MAIN_RIDGE_Z) },
      { u: back, y: under(back) },
    ],
    holes: [LIVING_LEFT_WINDOW, PRIMARY_LEFT_WINDOW],
  });
  return [
    part("left-wall-front", OWNER, "wall", PALETTE.siding, frontPanel),
    part("left-wall-back", OWNER, "wall", PALETTE.siding, backPanel),
    part(
      "chimney-body",
      OWNER,
      "chimney",
      PALETTE.brick,
      block(
        [CHIMNEY_PLAN.x[0], STOREYS.frontWalk, chimneyBack],
        [CHIMNEY_PLAN.x[1], 8.9, chimneyFront],
      ),
    ),
    part(
      "chimney-cap",
      OWNER,
      "chimney",
      PALETTE.railing,
      block(
        [
          CHIMNEY_PLAN.x[0] - CHIMNEY_CAP_OVERHANG,
          8.9,
          chimneyBack - CHIMNEY_CAP_OVERHANG,
        ],
        [
          CHIMNEY_PLAN.x[1] + CHIMNEY_CAP_OVERHANG,
          9.1,
          chimneyFront + CHIMNEY_CAP_OVERHANG,
        ],
      ),
    ),
    part(
      "fireplace-hearth",
      OWNER,
      "chimney",
      PALETTE.brick,
      block([-5.5, 0, -3.0], [-4.95, 0.23, -1.4]),
    ),
    part(
      "fireplace-left",
      OWNER,
      "chimney",
      PALETTE.brick,
      block([-5.5, 0.23, -3.0], [-4.95, 1.3, -2.72]),
    ),
    part(
      "fireplace-right",
      OWNER,
      "chimney",
      PALETTE.brick,
      block([-5.5, 0.23, -1.68], [-4.95, 1.3, -1.4]),
    ),
    part(
      "fireplace-head",
      OWNER,
      "chimney",
      PALETTE.brick,
      block([-5.5, 0.87, -2.72], [-4.95, 1.3, -1.68]),
    ),
  ];
};
