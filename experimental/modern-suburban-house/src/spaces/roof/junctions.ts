
import { GARAGE, MAIN } from "../building";
const MAIN_PITCH = 8 / 12;
const GABLE_PITCH = 9 / 12;
const RIGHT_PITCH = 7 / 12;
const GARAGE_PITCH = 5 / 12;
const MAIN_WALL_HEIGHT = 6.3;
const RIGHT_WALL_HEIGHT = 5.95;
const GARAGE_WALL_HEIGHT = 2.95;
const GABLE_TO_MAIN_SLOPE = GABLE_PITCH / MAIN_PITCH;
const MAIN_TO_GABLE_SLOPE = MAIN_PITCH / GABLE_PITCH;

/** Vertical underside reservation of every roof, metres (roof-profile-datums). */
export const ROOF_THICKNESS = 0.24;

/** Free overhangs beyond outer wall lines, metres (roof-profile-datums table). */
export const OVERHANG = {
  main: 0.4,
  gable: 0.4,
  right: 0.4,
  garage: 0.35,
} as const;

/** X of the plane between the main roof and the right low roof (roof-mass-allocation). */
export const SPLIT_X = 1.6;

/** Front gable wall ends a, b on the front wall Z = 0 (roof-mass-allocation). */
export const GABLE = (() => {
  const a = -5.75;
  const b = -1.8;
  return { a, b, center: (a + b) / 2 } as const;
})();

/** Mid-plane of the main front and rear walls, where the main and right ridges run (roof-mass-allocation). */
export const MAIN_RIDGE_Z = (MAIN.outer.z[0] + MAIN.outer.z[1]) / 2;

/** Garage ridge Z: mean of the garage front and back walls (roof-mass-allocation). */
export const GARAGE_RIDGE_Z = (GARAGE.outer.z[1] + GARAGE.outer.z[0]) / 2;

/** Main roof front face. */
export const mFront = (z: number): number => MAIN_WALL_HEIGHT - MAIN_PITCH * (z - MAIN.outer.z[1]);
/** Main roof back face. */
export const mBack = (z: number): number => MAIN_WALL_HEIGHT + MAIN_PITCH * (z - MAIN.outer.z[0]);
/** Right low roof front face (same walls and ridge, 5.95 at the wall line, 7/12). */
export const rFront = (z: number): number => RIGHT_WALL_HEIGHT - RIGHT_PITCH * (z - MAIN.outer.z[1]);
/** Right low roof back face. */
export const rBack = (z: number): number => RIGHT_WALL_HEIGHT + RIGHT_PITCH * (z - MAIN.outer.z[0]);
/** Front gable faces: F(X) = 6.30 + (9/12) × min(X - a, b - X). */
export const gable = (x: number): number => mFront(MAIN.outer.z[1]) + GABLE_PITCH * Math.min(x - GABLE.a, GABLE.b - x);
/** Garage front face. */
export const gFront = (z: number): number => GARAGE_WALL_HEIGHT - GARAGE_PITCH * (z - GARAGE.outer.z[1]);
/** Garage back face. */
export const gBack = (z: number): number => GARAGE_WALL_HEIGHT + GARAGE_PITCH * (z - GARAGE.outer.z[0]);

/** Main roof weather surface at any Z (front or back of the ridge). */
export const mainRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? mFront(z)
  : mBack(z));
/** Right low roof weather surface at any Z. */
export const rightRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? rFront(z)
  : rBack(z));
/** Garage roof weather surface at any Z. */
export const garageRoof = (z: number): number => (z >= GARAGE_RIDGE_Z
  ? gFront(z)
  : gBack(z));

/** Front edge of the high main roof: the front wall plus its free overhang. */
export const FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.main;
/** Front free edge of the lower right roof, independently set by its own reach. */
export const RIGHT_FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.right;
/** Front edge of the gable candidate region, measured from its own overhang. */
export const GABLE_EAVE_Z = MAIN.outer.z[1] + OVERHANG.gable;
/** Back edge of the high main roof. */
export const BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.main;
/** Rear free edge of the lower right roof, independently set by its own reach. */
export const RIGHT_BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.right;
/** Left edge of the main roof. */
export const LEFT_EAVE_X = MAIN.outer.x[0] - OVERHANG.main;
/** Right edge of the right low roof. */
export const RIGHT_EAVE_X = MAIN.outer.x[1] + OVERHANG.right;

/** Valley Z at a gable X: where F(X) equals Mfront(Z). */
const valleyZ = (x: number): number => MAIN.outer.z[1] - GABLE_TO_MAIN_SLOPE * Math.min(x - GABLE.a, GABLE.b - x);

/**
 * Corners of the exposed front gable, shared by the gable planes and the main
 * front plane: the valley meets the front eave at `leftFoot` and `rightFoot`,
 * and the two valleys meet the gable ridge at `apex`.
 */
export const GABLE_CORNERS = (() => {
  // valleyZ(x) = GABLE_EAVE_Z  ⇒  min(x - a, b - x) = -(8/9) × (GABLE_EAVE_Z - front wall)
  const reach = MAIN_TO_GABLE_SLOPE * (MAIN.outer.z[1] - GABLE_EAVE_Z);
  return {
    leftFoot: { x: GABLE.a + reach, z: GABLE_EAVE_Z },
    rightFoot: { x: GABLE.b - reach, z: GABLE_EAVE_Z },
    apex: { x: GABLE.center, z: valleyZ(GABLE.center) },
    ridgeFront: { x: GABLE.center, z: GABLE_EAVE_Z },
  };
})();

/** Chimney body plan, cut from the main front face (envelope/left chimney-roof-interface). */
export const CHIMNEY_PLAN = {
  x: [-6.3, -5.5] as const,
  z: [-2.75, -1.65] as const,
};
