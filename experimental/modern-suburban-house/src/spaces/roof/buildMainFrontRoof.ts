
import { PALETTE } from "../PALETTE";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { slopedPlate } from "../slopedPlate";
import { roofFreeEdge } from "./roofFreeEdge";
import { CHIMNEY_PLAN } from "./CHIMNEY_PLAN";
import { GABLE_CORNERS } from "./GABLE_CORNERS";
import { LEFT_EAVE_X } from "./LEFT_EAVE_X";
import { FRONT_EAVE_Z } from "./FRONT_EAVE_Z";
import { mFront } from "./mFront";
import { MAIN_RIDGE_Z } from "./MAIN_RIDGE_Z";
import { GABLE_ENDS } from "./GABLE_ENDS";
import { SPLIT_X } from "./SPLIT_X";
import { ROOF_THICKNESS } from "./ROOF_THICKNESS";

const OWNER = "roof/main-front.ts";

/**
 * Emit the single main front roof part.
 */
export const buildMainFrontRoof = (): IHousePart[] => {
  const { apex, leftFoot, rightFoot } = GABLE_CORNERS;
  const [notchBack, notchFront] = CHIMNEY_PLAN.z;
  const notchRight = CHIMNEY_PLAN.x[1];
  // Where the left valley crosses the notch's front edge Z = -1.65.
  const valleyAtNotch = {
    x: leftFoot.x + (apex.x - leftFoot.x) * (notchFront - leftFoot.z) / (apex.z - leftFoot.z),
    z: notchFront,
  };
  const top = (_x: number, z: number): number => mFront(z);
  const pieces = [
    // East of the gable ridge line: the ridge to the right valley and the front eave.
    [
      { x: GABLE_ENDS.center, z: MAIN_RIDGE_Z },
      { x: SPLIT_X, z: MAIN_RIDGE_Z },
      { x: SPLIT_X, z: FRONT_EAVE_Z },
      rightFoot,
      apex,
    ],
    // West, behind the chimney notch.
    [
      { x: LEFT_EAVE_X, z: MAIN_RIDGE_Z },
      { x: GABLE_ENDS.center, z: MAIN_RIDGE_Z },
      { x: GABLE_ENDS.center, z: notchBack },
      { x: notchRight, z: notchBack },
      { x: LEFT_EAVE_X, z: notchBack },
    ],
    // West, beside the notch, up to the left valley.
    [
      { x: notchRight, z: notchBack },
      { x: GABLE_ENDS.center, z: notchBack },
      apex,
      valleyAtNotch,
      { x: notchRight, z: notchFront },
    ],
    // West, in front of the notch, to the left valley foot on the eave.
    [{ x: LEFT_EAVE_X, z: notchFront }, { x: notchRight, z: notchFront }, valleyAtNotch, leftFoot, { x: LEFT_EAVE_X, z: FRONT_EAVE_Z }],
  ];
  const onPlanEdge = (x: number, z: number, a: { x: number; z: number }, b: { x: number; z: number }): boolean => {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const t = ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz);
    return t >= -1e-7 && t <= 1 + 1e-7 && Math.hypot(x - a.x - t * dx, z - a.z - t * dz) < 1e-6;
  };
  const freeEdge = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean => {
    const x = (a.x + b.x) / 2;
    const z = (a.z + b.z) / 2;
    const coincidentTiles = pieces.reduce(
      (count, plan) => count + Number(plan.some((p, i) => onPlanEdge(x, z, p, plan[(i + 1) % plan.length]!))),
      0,
    );
    return coincidentTiles === 1 && roofFreeEdge(a, b);
  };
  return [
    part(
      "roof-main-front",
      OWNER,
      "roof",
      PALETTE.roof,
      slopedPlate({ plans: pieces, top, thickness: ROOF_THICKNESS, freeEdge }),
    ),
  ];
};
