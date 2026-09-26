/**
 * `roof.main.front`: the main roof's front face.
 *
 * Design owner: `docs/spaces/roof/main-front.md#main-front-roof`, with its
 * region, height and edges from `roof/00-junctions.md`. The face covers
 * X = [LEFT_EAVE_X, 1.60], Z = [ridge −5.35, front eave 0.40] under
 * Mfront(Z) = 6.30 − (8/12) Z, minus the exposed front-gable triangle (the two
 * valleys and the front eave) and minus the chimney notch
 * X = [-6.30, -5.50] × Z = [-2.75, -1.65]. The engine builds convex faces only,
 * so the concave remainder is split into four convex pieces that share the
 * valley corners of `GABLE_CORNERS` exactly.
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, slopedSlab } from "../solids";
import { CHIMNEY_PLAN, FRONT_EAVE_Z, GABLE, GABLE_CORNERS, LEFT_EAVE_X, MAIN_RIDGE_Z, ROOF_THICKNESS, SPLIT_X, mFront } from "./junctions";

const OWNER = "roof/main-front.ts";

/**
 * Emit the main front face pieces.
 * @evidence spaces/roof/main-front.md This export builds the front main-roof remainder around the exposed gable and chimney notch.
 * @evidence spaces/roof/main-front.md#main-front-roof Four convex plans use the shared gable valley points and CHIMNEY_PLAN bounds, then mFront supplies one pitch to their sloped slabs.
 * @evidence principles/core/source-units.md#source-scope-preservation The function cuts out the gable and chimney footprints before creating its own roof pieces; it imports junction values instead of claiming their faces.
 * @evidence principles/core/source-units.md#source-substantive-completion The four plans become deterministic solid parts roof-main-front-0 through -3, closing the concave remainder without an empty placeholder.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The main-front parent defines both valley exclusion and chimney notch; splitting its concave remainder into convex mesh pieces needed no new exposed boundary.
 */
export const buildMainFrontRoof = (): IHousePart[] => {
  const { apex, leftFoot, rightFoot } = GABLE_CORNERS;
  const [notchBack, notchFront] = CHIMNEY_PLAN.z;
  const notchRight = CHIMNEY_PLAN.x[1];
  // Where the left valley crosses the notch's front edge Z = -1.65.
  const valleyAtNotch = { x: GABLE.a - (8 / 9) * notchFront, z: notchFront };
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
    [{ x: LEFT_EAVE_X, z: notchFront }, valleyAtNotch, leftFoot, { x: LEFT_EAVE_X, z: FRONT_EAVE_Z }],
  ];
  return pieces.map((plan, i) =>
    part(`roof-main-front-${i}`, OWNER, "roof", PALETTE.roof, slopedSlab({ plan, top, thickness: ROOF_THICKNESS })),
  );
};
