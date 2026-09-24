/**
 * Roof height functions and shared roof edges, computed once for every roof
 * plane, wall head and ceiling owner.
 *
 * Design owner: `docs/spaces/roof/00-junctions.md` (`roof-mass-allocation`,
 * `roof-profile-datums`, `roof-shared-edges`, `roof-wall-head-junctions`).
 * All functions return the weather-surface Y at a world (X, Z); the underside
 * lies `ROOF_THICKNESS` lower in world Y. Slopes are rise per 12 horizontal:
 * main 8/12, front gable 9/12, right low roof 7/12, garage 5/12.
 *
 * The front gable shows only where F(X) > Mfront(Z); the equal-height line
 * Z = -(9/8) × min(X - a, b - X) is the shared valley. Inside the finite
 * candidate region the exposed gable is therefore the triangle between the two
 * valleys and the front overhang edge, and the main front face is its
 * complement. Both use the same corner values below so no face rounds the
 * valley independently.
 *
 * Consumers: the eight roof plane owners, the envelope owners for wall heads,
 * and ceilings. This module emits no surface.
 */
import { MAIN, MAIN_RIDGE_Z } from "../building";

/** Vertical underside reservation of every roof, metres (roof-profile-datums). */
export const ROOF_THICKNESS = 0.24;

/** Free overhangs beyond outer wall lines, metres (roof-profile-datums table). */
export const OVERHANG = { main: 0.4, gable: 0.4, right: 0.4, garage: 0.35 } as const;

/** X of the plane between the main roof and the right low roof (roof-mass-allocation). */
export const SPLIT_X = 1.6;

/** Front gable wall ends a, b on the front wall Z = 0 (roof-mass-allocation). */
export const GABLE = { a: -5.75, b: -1.8, center: (-5.75 + -1.8) / 2 } as const;

/** Garage outline used by its roof, metres (00-building attached-garage-extent). */
export const GARAGE_ROOF = { westFace: 5.75, eastFace: 11.7, frontFace: -0.3, backFace: -6.7 } as const;
/** Garage ridge Z: mean of the garage front and back walls. */
export const GARAGE_RIDGE_Z = (GARAGE_ROOF.frontFace + GARAGE_ROOF.backFace) / 2;

/** Main roof front face. */
export const mFront = (z: number): number => 6.3 - (8 / 12) * z;
/** Main roof back face. */
export const mBack = (z: number): number => 6.3 + (8 / 12) * (z + 10.7);
/** Right low roof front face (same walls and ridge, 5.95 at the wall line, 7/12). */
export const rFront = (z: number): number => 5.95 - (7 / 12) * z;
/** Right low roof back face. */
export const rBack = (z: number): number => 5.95 + (7 / 12) * (z + 10.7);
/** Front gable faces: F(X) = 6.30 + (9/12) × min(X - a, b - X). */
export const gable = (x: number): number => 6.3 + (9 / 12) * Math.min(x - GABLE.a, GABLE.b - x);
/** Garage front face. */
export const gFront = (z: number): number => 2.95 - (5 / 12) * (z + 0.3);
/** Garage back face. */
export const gBack = (z: number): number => 2.95 + (5 / 12) * (z + 6.7);

/** Main roof weather surface at any Z (front or back of the ridge). */
export const mainRoof = (z: number): number => (z >= MAIN_RIDGE_Z ? mFront(z) : mBack(z));
/** Right low roof weather surface at any Z. */
export const rightRoof = (z: number): number => (z >= MAIN_RIDGE_Z ? rFront(z) : rBack(z));
/** Garage roof weather surface at any Z. */
export const garageRoof = (z: number): number => (z >= GARAGE_RIDGE_Z ? gFront(z) : gBack(z));

/** Front edge of the main and gable roofs: the front wall plus the free overhang. */
export const FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.main;
/** Back edge of the main and right roofs. */
export const BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.main;
/** Left edge of the main roof. */
export const LEFT_EAVE_X = MAIN.outer.x[0] - OVERHANG.main;
/** Right edge of the right low roof. */
export const RIGHT_EAVE_X = MAIN.outer.x[1] + OVERHANG.right;

/** Valley Z at a gable X: where F(X) equals Mfront(Z). */
export const valleyZ = (x: number): number => -(9 / 8) * Math.min(x - GABLE.a, GABLE.b - x);

/**
 * Corners of the exposed front gable, shared by the gable planes and the main
 * front plane: the valley meets the front eave at `leftFoot` and `rightFoot`,
 * and the two valleys meet the gable ridge at `apex`.
 */
export const GABLE_CORNERS = (() => {
  // valleyZ(x) = FRONT_EAVE_Z  ⇒  min(x - a, b - x) = -(8/9) × FRONT_EAVE_Z
  const reach = -(8 / 9) * FRONT_EAVE_Z;
  return {
    leftFoot: { x: GABLE.a + reach, z: FRONT_EAVE_Z },
    rightFoot: { x: GABLE.b - reach, z: FRONT_EAVE_Z },
    apex: { x: GABLE.center, z: valleyZ(GABLE.center) },
    ridgeFront: { x: GABLE.center, z: FRONT_EAVE_Z },
  };
})();

/** Chimney body plan, cut from the main front face (envelope/left chimney-roof-interface). */
export const CHIMNEY_PLAN = { x: [-6.3, -5.5] as const, z: [-2.75, -1.65] as const };
