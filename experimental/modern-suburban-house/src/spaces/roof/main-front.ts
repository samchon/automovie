/**
 * `roof.main.front`: the main roof's front face.
 *
 * Design owner: `docs/spaces/roof/main-front.md#main-front-roof`, with its
 * region, height and edges from `roof/00-junctions.md`. The face covers
 * X = [LEFT_EAVE_X, 1.60], Z = [ridge −5.35, front eave 0.40] under
 * Mfront(Z) = 6.30 − (8/12) Z, minus the exposed front-gable triangle (the two
 * valleys and the front eave) and minus the chimney notch
 * X = [-6.30, -5.50] × Z = [-2.75, -1.65]. Four coplanar convex top and underside faces form one mesh around
 * the notch. Sides close only free eaves; ridge, valleys and tile seams
 * receive no internal vertical face; the free X = SPLIT_X step closes its thickness.
 */
import { PALETTE } from "../palette";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { part, slopedPlate, type IHousePart } from "../solids";
import { roofFreeEdge } from "./edges";
import {
  CHIMNEY_PLAN,
  FRONT_EAVE_Z,
  GABLE,
  GABLE_CORNERS,
  LEFT_EAVE_X,
  MAIN_RIDGE_Z,
  mFront,
  ROOF_THICKNESS,
  SPLIT_X,
} from "./junctions";

const OWNER = "roof/main-front.ts";

/**
 * Emit the single main front roof part.
 * @evidence spaces/roof/main-front.md This export builds the front main-roof remainder around the exposed gable and chimney notch.
 * @evidence spaces/roof/main-front.md#main-front-roof Convex coplanar tiles form one roof part around the shared gable valley and chimney notch without internal side faces.
 * @evidence principles/core/source-units.md#source-scope-preservation The function cuts out the gable and chimney footprints before creating its one roof mesh; it imports junction values instead of claiming their faces.
 * @evidence principles/core/source-units.md#source-substantive-completion Four top/bottom tiles in one mesh preserve the cut plan and close every free edge, including the step and chimney notch.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The main-front parent defines the valley, notch, and free eaves consumed by this mesh.
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
      { x: GABLE.center, z: MAIN_RIDGE_Z },
      { x: SPLIT_X, z: MAIN_RIDGE_Z },
      { x: SPLIT_X, z: FRONT_EAVE_Z },
      rightFoot,
      apex,
    ],
    // West, behind the chimney notch.
    [
      { x: LEFT_EAVE_X, z: MAIN_RIDGE_Z },
      { x: GABLE.center, z: MAIN_RIDGE_Z },
      { x: GABLE.center, z: notchBack },
      { x: notchRight, z: notchBack },
      { x: LEFT_EAVE_X, z: notchBack },
    ],
    // West, beside the notch, up to the left valley.
    [
      { x: notchRight, z: notchBack },
      { x: GABLE.center, z: notchBack },
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
    const coincidentTiles = pieces.reduce((count, plan) => count + Number(plan.some((p, i) => onPlanEdge(x, z, p, plan[(i + 1) % plan.length]!))), 0);
    return coincidentTiles === 1 && roofFreeEdge(a, b);
  };
  return [
    part(
      "roof-main-front",
      OWNER,
      "roof",
      PALETTE.roof,
      slopedPlate({ plans: pieces, top, thickness: ROOF_THICKNESS, freeEdge }),
      true,
    ),
  ];
};
