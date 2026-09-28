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
 * @evidenceReview spaces/envelope/left.md#chimney-roof-interface #1f0db15 `CHIMNEY_CAP_OVERHANG` is 0.10 m and `buildLeft` subtracts or adds it on both X and Z sides of the cap beyond `CHIMNEY_PLAN`.
 * @evidence spaces/envelope/left.md The left elevation owns the chimney cap projection around the masonry body.
 * @evidenceReview spaces/envelope/left.md #85cb611 `buildLeft` constructs the cap around its chimney body using this exported projection, matching the left-elevation parent; the site fence consumes its farthest X face separately.
 * @evidence principles/core/source-units.md#source-scope-preservation The cap projection belongs to the left elevation and is consumed by the fence setback.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The projection is declared with the left chimney; `buildLeft` uses it for the cap and `site/fence.ts` reads it to offset its own L line beyond that cap.
 * @evidence principles/core/source-units.md#source-substantive-completion A shared offset places both cap faces and the fence outside the farthest masonry.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f All four horizontal cap bounds use this value; the fence computes `L` from the lesser of the projected chimney X face and main wall X face, then subtracts 0.60 m.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The chimney-roof-interface parent fixes the 0.10 m cap projection that this exported value shares.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `chimney-roof-interface` fixes the cap's 0.10 m horizontal projection; this constant supplies that offset to the cap and to the site fence's parent-specified setback without revising the chimney design.
 */
export const CHIMNEY_CAP_OVERHANG = 0.1;
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN.outer.x[0], MAIN.inner.x[0]] as const;
const under = (z: number): number => mainRoof(z) - ROOF_THICKNESS;
/** Rough opening owned by the left elevation and consumed by bedroom reservations. */
/**
 * @evidence spaces/envelope/left.md The primary bedroom's side window has one Z and Y host in the rear left wall panel.
 * @evidenceReview spaces/envelope/left.md #85cb611 `PRIMARY_LEFT_WINDOW` is the sole upper-bedroom hole in `buildLeft`'s rear left-wall panel, kept behind the chimney gap and distinct from the living hole.
 * @evidence spaces/envelope/left.md#primary-left-window Its -8.90..-7.30 m opening lies clear of the chimney and above the upper floor.
 * @evidenceReview spaces/envelope/left.md#primary-left-window #21e8960 Its Z [-8.90, -7.30] lies behind `CHIMNEY_PLAN.z` [-2.75, -1.65], and Y [3.91, 5.31] places the cut above the upper-storey floor in the primary bedroom.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a wall void, while the bedroom only reserves a curtain from its bounds.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `buildLeft` alone cuts this left exterior wall; the primary-room source imports the record to reserve `primary-left-curtain` on the inner face.
 * @evidence principles/core/source-units.md#source-substantive-completion The back panel cut and the left curtain strip use this same interval and sill/head.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The rear wall-panel hole consumes this record, while `primary-left-curtain` widens its Z jambs by 0.10 m and extends from the sill minus 0.75 to the head plus 0.12.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Primary-left-window fixes the rear left-wall opening Z=-8.90..-7.30 m above the upper floor; this span stays on the envelope host before bedroom curtain use.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `primary-left-window` fixes the rear left-wall opening and upper sill/head; this record transfers that span to the facade hole and primary curtain without moving it toward the chimney or revising the parent.
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
 * @evidenceReview spaces/envelope/left.md #85cb611 `LIVING_LEFT_WINDOW` is one ground living-side rough opening in the rear left-wall panel, exported for its inward curtain reservation.
 * @evidence principles/core/source-units.md#source-scope-preservation The room reserves fit-out without moving this facade cut.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `living.ts` reads this opening's jambs and head for `living-left-curtain`; only `buildLeft` cuts the facade wall.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall hole and curtain share the same host span.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `backPanel.holes` includes this value, while `living-left-curtain` widens its Z interval and derives the curtain top from `.top`, making the export useful to both wall and room.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-left-window fixes Z=-5.50..-4.30 m behind the fireplace while leaving that masonry body closed; this export carries its rough void.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `living-left-window` fixes Z [-5.50, -4.30] behind the fireplace's Z [-3.00, -1.40] masonry; this record cuts the rear panel outside the closed firebox contact without a new opening decision.
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
 * @evidenceReview spaces/envelope/left.md #85cb611 `buildLeft` returns front/back left-wall panels around one chimney body and cap, then four brick fireplace surround parts around the living-room firebox gap.
 * @evidence spaces/envelope/left.md#left-roof-closure Front and back wall panels meet the main roof underside without a second gable slab.
 * @evidenceReview spaces/envelope/left.md#left-roof-closure #4810fd1 Both left-wall panels top out at `mainRoof(z) - ROOF_THICKNESS`, with a ridge vertex in the rear panel; no duplicate thin gable slab is added.
 * @evidence spaces/envelope/left.md#left-openings Only the living and primary window holes puncture the back panel behind the chimney.
 * @evidenceReview spaces/envelope/left.md#left-openings #5342577 Only `backPanel` receives `LIVING_LEFT_WINDOW` and `PRIMARY_LEFT_WINDOW`; the chimney-side front panel has no window, matching the two-window parent allocation.
 * @evidence spaces/envelope/left.md#living-left-window The living-side void spans Z=-5.50..-4.30 outside the fireplace body.
 * @evidenceReview spaces/envelope/left.md#living-left-window #1dfb320 The back panel cuts `LIVING_LEFT_WINDOW` at Z [-5.50, -4.30], clear of the fireplace brick's Z [-3.00, -1.40] span.
 * @evidence spaces/envelope/left.md#primary-left-window The primary bedroom's upper void spans Z=-8.90..-7.30 in the rear panel.
 * @evidenceReview spaces/envelope/left.md#primary-left-window #21e8960 The back panel carries `PRIMARY_LEFT_WINDOW` at Z [-8.90, -7.30], Y [3.91, 5.31], separated from the chimney body toward the rear.
 * @evidence spaces/envelope/left.md#chimney-roof-interface One chimney body and cap cross the roof notch; hearth, cheeks, and head surround a real firebox gap.
 * @evidenceReview spaces/envelope/left.md#chimney-roof-interface #1f0db15 `chimney-body` rises from `STOREYS.frontWalk` to Y 8.90 and its projected cap ends at 9.10; hearth, two cheeks, and head leave Z [-2.72, -1.68], Y [0.23, 0.87] open.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder omits flue/fire behavior, window fills, and mantel while retaining the exterior chimney and wall contact.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The builder constructs the chimney masonry and rough window holes but no flue, flame, window fill, firebox liner, or wooden mantel, which the parent reserves for later roles.
 * @evidence principles/core/source-units.md#source-substantive-completion Two cut wall meshes plus body, cap, and fireplace brick solids give a tangible left elevation.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Eight returned parts comprise two cut wall panels, one chimney body, its cap, and four brick hearth/cheek/head blocks around a real firebox gap.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Left-roof-closure supplies the two roof-contact panels, left-openings fixes living and primary holes, and chimney-roof-interface fixes masonry and its firebox gap; buildLeft emits those assigned bodies.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `left-roof-closure` divides the wall around the chimney, `left-openings` fixes two rear-panel cuts, and `chimney-roof-interface` fixes the cap and firebox gap; this builder emits those assigned forms without a new left-elevation decision.
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
