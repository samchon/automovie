
import { EXTERIOR_WALL_BOTTOM, MAIN } from "../building";
import { PALETTE } from "../palette";
import {
  CHIMNEY_PLAN,
  MAIN_RIDGE_Z,
  ROOF_THICKNESS,
  mainRoof,
} from "../roof/junctions";
import type { IHousePart } from "../../types/IHousePart";
import { part } from "../part";
import { block, wallPanel } from "../solids";
import { STOREYS } from "../storeys";
import { EXTERIOR_PLINTH_TOP } from "./finish-boundary";

const OWNER = "envelope/left.ts";
/** Chimney cap projection beyond each side of the masonry body (chimney-roof-interface). */
export const CHIMNEY_CAP_OVERHANG = 0.1;
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN.outer.x[0], MAIN.inner.x[0]] as const;
const under = (z: number): number => mainRoof(z) - ROOF_THICKNESS;
/** Rough opening owned by the left elevation and consumed by bedroom reservations. */
export const PRIMARY_LEFT_WINDOW = {
  id: "primary-left-window",
  from: -8.9,
  to: -7.3,
  bottom: 3.91,
  top: 5.31,
} as const;
export const LIVING_LEFT_WINDOW = {
  id: "living-left-window",
  from: -5.5,
  to: -4.3,
  bottom: 0.75,
  top: 2.3,
} as const;

/** Emit the left gable wall panels and the chimney. */
export const buildLeft = (): IHousePart[] => {
  const front = MAIN.inner.z[1];
  const back = MAIN.inner.z[0];
  const [chimneyBack, chimneyFront] = CHIMNEY_PLAN.z;
  const frontPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: chimneyFront, y: EXTERIOR_PLINTH_TOP },
      { u: front, y: EXTERIOR_PLINTH_TOP },
      { u: front, y: under(front) },
      { u: chimneyFront, y: under(chimneyFront) },
    ],
  });
  const frontPlinth = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: chimneyFront, y: B },
      { u: front, y: B },
      { u: front, y: EXTERIOR_PLINTH_TOP },
      { u: chimneyFront, y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const backPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: EXTERIOR_PLINTH_TOP },
      { u: chimneyBack, y: EXTERIOR_PLINTH_TOP },
      { u: chimneyBack, y: under(chimneyBack) },
      { u: MAIN_RIDGE_Z, y: under(MAIN_RIDGE_Z) },
      { u: back, y: under(back) },
    ],
    holes: [LIVING_LEFT_WINDOW, PRIMARY_LEFT_WINDOW],
  });
  const backPlinth = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: B },
      { u: chimneyBack, y: B },
      { u: chimneyBack, y: EXTERIOR_PLINTH_TOP },
      { u: back, y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const fullBoundary = (solid: typeof frontPanel) => ({
    ...solid,
    face: {
      ...solid.face,
      outline: solid.face.outline.map((point, i) =>
        i < 2 ? { ...point, y: B } : point,
      ),
    },
  });
  return [
    part(
      "left-wall-front",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(frontPanel),
    ),
    {
      ...part(
        "left-wall-front-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        frontPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    part(
      "left-wall-back",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(backPanel),
    ),
    {
      ...part(
        "left-wall-back-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        backPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
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
