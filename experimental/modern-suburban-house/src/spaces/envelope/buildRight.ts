
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { EXTERIOR_WALL_BOTTOM } from "../EXTERIOR_WALL_BOTTOM";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { mainRoof } from "../roof/mainRoof";
import { RIGHT_BACK_EAVE_Z } from "../roof/RIGHT_BACK_EAVE_Z";
import { BACK_EAVE_Z } from "../roof/BACK_EAVE_Z";
import { RIGHT_FRONT_EAVE_Z } from "../roof/RIGHT_FRONT_EAVE_Z";
import { FRONT_EAVE_Z } from "../roof/FRONT_EAVE_Z";
import { garageRoof } from "../roof/garageRoof";
import { rightRoof } from "../roof/rightRoof";
import { GARAGE_RIDGE_Z } from "../roof/GARAGE_RIDGE_Z";
import { MAIN_RIDGE_Z } from "../roof/MAIN_RIDGE_Z";
import { SPLIT_X } from "../roof/SPLIT_X";
import { ROOF_THICKNESS } from "../roof/ROOF_THICKNESS";
import type { IHousePart } from "../../types/IHousePart";
import type { IWallPoint } from "../../types/IWallPoint";
import { part } from "../part";
import { wallPanel } from "../wallPanel";
import { EXTERIOR_PLINTH_TOP } from "./EXTERIOR_PLINTH_TOP";
import { FAMILY_RIGHT_WINDOW } from "./FAMILY_RIGHT_WINDOW";
const OWNER = "envelope/right.ts";
const B = EXTERIOR_WALL_BOTTOM;
const ACROSS = [MAIN_OUTLINE.inner.x[1], MAIN_OUTLINE.outer.x[1]] as const;
const under = (z: number): number => rightRoof(z) - ROOF_THICKNESS;

/** A step-wall run over [z0, z1]: low-roof underside up to the main underside. */
const stepRun = (z0: number, z1: number): IWallPoint[] => {
  const zs =
    z0 < MAIN_RIDGE_Z && MAIN_RIDGE_Z < z1 ? [z0, MAIN_RIDGE_Z, z1] : [z0, z1];
  return [
    ...zs.map((z) => ({ u: z, y: rightRoof(z) - ROOF_THICKNESS })),
    ...[...zs]
      .reverse()
      .map((z) => ({ u: z, y: mainRoof(z) - ROOF_THICKNESS })),
  ];
};

/** Emit the right elevation parts. */
export const buildRight = (): IHousePart[] => {
  const back = MAIN_OUTLINE.inner.z[0];
  const garageBack = GARAGE_OUTLINE.outer.z[0];
  const garageFront = GARAGE_OUTLINE.outer.z[1];
  const backPanel = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: EXTERIOR_PLINTH_TOP },
      { u: garageBack, y: EXTERIOR_PLINTH_TOP },
      { u: garageBack, y: under(garageBack) },
      { u: back, y: under(back) },
    ],
    holes: [
      FAMILY_RIGHT_WINDOW,
      { id: "tub-right-window", from: -8.4, to: -7.5, bottom: 4.56, top: 5.31 },
    ],
  });
  const backPlinth = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: back, y: B },
      { u: garageBack, y: B },
      { u: garageBack, y: EXTERIOR_PLINTH_TOP },
      { u: back, y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const front = MAIN_OUTLINE.inner.z[1];
  const sliver = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: garageFront, y: EXTERIOR_PLINTH_TOP },
      { u: front, y: EXTERIOR_PLINTH_TOP },
      { u: front, y: under(front) },
      { u: garageFront, y: under(garageFront) },
    ],
  });
  const sliverPlinth = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: garageFront, y: B },
      { u: front, y: B },
      { u: front, y: EXTERIOR_PLINTH_TOP },
      { u: garageFront, y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const garageSharedUpper = wallPanel({
    axis: "z",
    across: ACROSS,
    outline: [
      { u: garageBack, y: garageRoof(garageBack) },
      { u: GARAGE_RIDGE_Z, y: garageRoof(GARAGE_RIDGE_Z) },
      { u: garageFront, y: garageRoof(garageFront) },
      { u: garageFront, y: under(garageFront) },
      { u: MAIN_RIDGE_Z, y: under(MAIN_RIDGE_Z) },
      { u: garageBack, y: under(garageBack) },
    ],
  });
  const step = (id: string, z0: number, z1: number): IHousePart =>
    part(
      id,
      OWNER,
      "wall",
      PALETTE.siding,
      wallPanel({
        axis: "z",
        across: [SPLIT_X - 0.15, SPLIT_X],
        outline: stepRun(z0, z1),
      }),
    );
  const garageUnder = (z: number): number => garageRoof(z) - ROOF_THICKNESS;
  const garageWall = wallPanel({
    axis: "z",
    across: [GARAGE_OUTLINE.inner.x[1], GARAGE_OUTLINE.outer.x[1]],
    outline: [
      { u: GARAGE_OUTLINE.inner.z[0], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_OUTLINE.inner.z[1], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_OUTLINE.inner.z[1], y: garageUnder(GARAGE_OUTLINE.inner.z[1]) },
      { u: GARAGE_RIDGE_Z, y: garageUnder(GARAGE_RIDGE_Z) },
      { u: GARAGE_OUTLINE.inner.z[0], y: garageUnder(GARAGE_OUTLINE.inner.z[0]) },
    ],
    holes: [
      {
        id: "garage-right-window",
        from: -5.85,
        to: -4.25,
        bottom: 1.4,
        top: 2.2,
      },
    ],
  });
  const garagePlinth = wallPanel({
    axis: "z",
    across: [GARAGE_OUTLINE.inner.x[1], GARAGE_OUTLINE.outer.x[1]],
    outline: [
      { u: GARAGE_OUTLINE.inner.z[0], y: B },
      { u: GARAGE_OUTLINE.inner.z[1], y: B },
      { u: GARAGE_OUTLINE.inner.z[1], y: EXTERIOR_PLINTH_TOP },
      { u: GARAGE_OUTLINE.inner.z[0], y: EXTERIOR_PLINTH_TOP },
    ],
  });
  const fullBoundary = (solid: typeof backPanel) => ({
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
      "right-main-wall-back",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(backPanel),
    ),
    {
      ...part(
        "right-main-wall-back-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        backPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    part(
      "right-main-wall-front",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(sliver),
    ),
    {
      ...part(
        "right-main-wall-front-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        sliverPlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
    part(
      "right-garage-shared-upper-wall",
      OWNER,
      "wall",
      PALETTE.siding,
      garageSharedUpper,
    ),
    step("right-step-wall", MAIN_OUTLINE.inner.z[0], MAIN_OUTLINE.inner.z[1]),
    step(
      "right-step-wall-front-eave",
      MAIN_OUTLINE.outer.z[1],
      Math.min(FRONT_EAVE_Z, RIGHT_FRONT_EAVE_Z),
    ),
    step(
      "right-step-wall-back-eave",
      Math.max(BACK_EAVE_Z, RIGHT_BACK_EAVE_Z),
      MAIN_OUTLINE.outer.z[0],
    ),
    part(
      "right-garage-wall",
      OWNER,
      "wall",
      PALETTE.siding,
      fullBoundary(garageWall),
    ),
    {
      ...part(
        "right-garage-wall-plinth",
        OWNER,
        "wall",
        PALETTE.brick,
        garagePlinth.mesh,
      ),
      pendingMapGround: "map-ground-pending",
    },
  ];
};
