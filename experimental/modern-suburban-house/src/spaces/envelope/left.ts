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
import { block, part, wallPanel, type IHousePart } from "../solids";
import { STOREYS } from "../storeys";

const OWNER = "envelope/left.ts";
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN.outer.x[0], MAIN.inner.x[0]] as const;
const under = (z: number): number => mainRoof(z) - ROOF_THICKNESS;
/** Rough opening owned by the left elevation and consumed by bedroom reservations. */
/**
 * @evidence spaces/envelope/left.md The primary bedroom's side window has one Z and Y host in the rear left wall panel.
 * @evidence spaces/envelope/left.md#primary-left-window Its -8.90..-7.30 m opening lies clear of the chimney and above the upper floor.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a wall void, while the bedroom only reserves a curtain from its bounds.
 * @evidence principles/core/source-units.md#source-substantive-completion The back panel cut and the left curtain strip use this same interval and sill/head.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The left opening plan already fixes the side window's wall location.
 */
export const PRIMARY_LEFT_WINDOW = {
  id: "primary-left-window",
  from: -8.9,
  to: -7.3,
  bottom: 3.91,
  top: 5.31,
} as const;

/** Emit the left gable wall panels and the chimney. */
/**
 * @evidence spaces/envelope/left.md This builder emits the left main-wall panels and the single exterior/interior chimney contact.
 * @evidence spaces/envelope/left.md#left-roof-closure Front and back wall panels meet the main roof underside without a second gable slab.
 * @evidence spaces/envelope/left.md#left-openings Only the living and primary window holes puncture the back panel behind the chimney.
 * @evidence spaces/envelope/left.md#living-left-window The living-side void spans Z=-5.50..-4.30 outside the fireplace body.
 * @evidence spaces/envelope/left.md#primary-left-window The primary bedroom's upper void spans Z=-8.90..-7.30 in the rear panel.
 * @evidence spaces/envelope/left.md#chimney-roof-interface One chimney body and cap cross the roof notch; hearth, cheeks, and head surround a real firebox gap.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder omits flue/fire behavior, window fills, and mantel while retaining the exterior chimney and wall contact.
 * @evidence principles/core/source-units.md#source-substantive-completion Two cut wall meshes plus body, cap, and fireplace brick solids give a tangible left elevation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The left parent fixes chimney footprint, fireplace void, two windows, and roof closure; no additional wall bay was invented.
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
    holes: [
      { id: "living-left-window", from: -5.5, to: -4.3, bottom: 0.75, top: 2.3 },
      PRIMARY_LEFT_WINDOW,
    ],
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
        [CHIMNEY_PLAN.x[0] - 0.1, 8.9, chimneyBack - 0.1],
        [CHIMNEY_PLAN.x[1] + 0.1, 9.1, chimneyFront + 0.1],
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
