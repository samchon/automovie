import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Hand-typed building records the envelope derivations are calibrated against.
 *
 * Every face frame here is written out as literal metres and a literal quaternion rather than generated from a footprint. A generator would be a second implementation of the very placement the derivation under test performs, so a sign error in one would confirm the same sign error in the other. These records are the reference shape the reading convention is fixed on.
 */

/** Sine and cosine of forty-five degrees, typed rather than computed. */
const QUARTER: number = 0.7071067811865476;

/** The six rigid placements every hand-written face frame is built from.
 *
 * Supply the six authored face orientations used by envelope fixtures. Identity, a half-turn about Y and signed quarter-turns about Y/X map local +Z onto the declared world axes; the quarter coefficient is the independent sin/cos(45 degree) identity. Constructing this input alone is not product behavior proof; consumers own assertions.
 *
 * Six distinct axis directions separate front/back, left/right and roof/floor orientation without sampling arbitrary rotations or proving renderer winding. This portable internal declaration is reached through explicit imports or the compatibility barrel, registers no dynamic case, installs no consumer and starts no process, browser, native artifact build or GPU.
 */
export const ENVELOPE_FIXTURE_FACE_ROTATION: { readonly keepZ: { x: number; y: number; z: number; w: number; }; readonly halfTurnY: { x: number; y: number; z: number; w: number; }; readonly quarterY: { x: number; y: number; z: number; w: number; }; readonly quarterMinusY: { x: number; y: number; z: number; w: number; }; readonly quarterMinusX: { x: number; y: number; z: number; w: number; }; readonly quarterX: { x: number; y: number; z: number; w: number; }; } = {
  /** Local `+Z` stays world `+Z`. */
  keepZ: { x: 0, y: 0, z: 0, w: 1 } satisfies IAutoMovieQuaternion,
  /** Half turn about `+Y`: local `+Z` becomes world `-Z`. */
  halfTurnY: { x: 0, y: 1, z: 0, w: 0 } satisfies IAutoMovieQuaternion,
  /** Quarter turn about `+Y`: local `+Z` becomes world `+X`. */
  quarterY: {
    x: 0,
    y: QUARTER,
    z: 0,
    w: QUARTER,
  } satisfies IAutoMovieQuaternion,
  /** Quarter turn about `-Y`: local `+Z` becomes world `-X`. */
  quarterMinusY: {
    x: 0,
    y: -QUARTER,
    z: 0,
    w: QUARTER,
  } satisfies IAutoMovieQuaternion,
  /** Quarter turn about `-X`: local `+Z` becomes world `+Y`. */
  quarterMinusX: {
    x: -QUARTER,
    y: 0,
    z: 0,
    w: QUARTER,
  } satisfies IAutoMovieQuaternion,
  /** Quarter turn about `+X`: local `+Z` becomes world `-Y`. */
  quarterX: {
    x: QUARTER,
    y: 0,
    z: 0,
    w: QUARTER,
  } satisfies IAutoMovieQuaternion,
} as const;
