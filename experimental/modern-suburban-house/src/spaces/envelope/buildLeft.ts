
import { EXTERIOR_WALL_BOTTOM } from "../EXTERIOR_WALL_BOTTOM";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { mainRoof } from "../roof/mainRoof";
import { CHIMNEY_PLAN } from "../roof/CHIMNEY_PLAN";
import { MAIN_RIDGE_Z } from "../roof/MAIN_RIDGE_Z";
import { ROOF_THICKNESS } from "../roof/ROOF_THICKNESS";
import type { IHousePart } from "../../types/IHousePart";
import { part } from "../part";
import { wallPanel } from "../wallPanel";
import { block } from "../block";
import { STOREYS } from "../STOREYS";
import { EXTERIOR_PLINTH_TOP } from "./EXTERIOR_PLINTH_TOP";
import { CHIMNEY_CAP_OVERHANG } from "./CHIMNEY_CAP_OVERHANG";
import { PRIMARY_LEFT_WINDOW } from "./PRIMARY_LEFT_WINDOW";
import { LIVING_LEFT_WINDOW } from "./LIVING_LEFT_WINDOW";

const OWNER = "envelope/left.ts";
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN_OUTLINE.outer.x[0], MAIN_OUTLINE.inner.x[0]] as const;
const under = (z: number): number => mainRoof(z) - ROOF_THICKNESS;
/** Emit the left gable wall panels and the chimney. */
export const buildLeft = (): IHousePart[] => {
  const front = MAIN_OUTLINE.inner.z[1];
  const back = MAIN_OUTLINE.inner.z[0];
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
