import type { IHousePart } from "../types/IHousePart";
import { GARAGE_OUTLINE } from "./GARAGE_OUTLINE";
import { EXTERIOR_WALL_BOTTOM } from "./EXTERIOR_WALL_BOTTOM";
import { GARAGE_OWNER } from "./GARAGE_OWNER";
import { MAIN_OUTLINE } from "./MAIN_OUTLINE";
import { PALETTE } from "./PALETTE";
import { part } from "./part";
import { garageRoof } from "./roof/garageRoof";
import { GARAGE_RIDGE_Z } from "./roof/GARAGE_RIDGE_Z";
import { LAUNDRY_GARAGE_DOOR } from "./rooms/LAUNDRY_GARAGE_DOOR";
import { wallPanel } from "./wallPanel";

/** Ceiling finish zone inside the 0.18 m reservation, owned by the garage interior (09). */
/** Emit the main/garage shared wall with the laundry-garage door void. */
export const buildGarageSharedWall = (): IHousePart[] => {
  const weatherLine = (z: number): number => garageRoof(z);
  const back = GARAGE_OUTLINE.outer.z[0];
  const front = GARAGE_OUTLINE.outer.z[1];
  const shared = wallPanel({
    axis: "z",
    across: [MAIN_OUTLINE.inner.x[1], MAIN_OUTLINE.outer.x[1]],
    outline: [
      { u: back, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: EXTERIOR_WALL_BOTTOM },
      { u: front, y: weatherLine(front) },
      { u: GARAGE_RIDGE_Z, y: weatherLine(GARAGE_RIDGE_Z) },
      { u: back, y: weatherLine(back) },
    ],
    holes: [LAUNDRY_GARAGE_DOOR],
  });
  return [
    part("garage-shared-wall", GARAGE_OWNER, "wall", PALETTE.interiorWall, shared),
  ];
};
