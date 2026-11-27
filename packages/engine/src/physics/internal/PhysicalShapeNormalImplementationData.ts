import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Canonical face order: negative then positive X, Y and Z, as in the original
 * plane construction.
 */
export const BOX: readonly IBoxPlane[] = [
  { axis: "x", normal: { x: -1, y: 0, z: 0 } },
  { axis: "x", normal: { x: 1, y: 0, z: 0 } },
  { axis: "y", normal: { x: 0, y: -1, z: 0 } },
  { axis: "y", normal: { x: 0, y: 1, z: 0 } },
  { axis: "z", normal: { x: 0, y: 0, z: -1 } },
  { axis: "z", normal: { x: 0, y: 0, z: 1 } },
];

/*
 * How wide, metres, a box's or a hull's normal blends across an edge
 * (`physicalShapeNormal`), provisional: half the 10 mm a pressed skin gives, so
 * a face's middle keeps its own normal (a face 30 mm off weighs e^-6 of it) and
 * an edge turns within a fingertip's breadth.
 */
export const SMOOTH: number = 0.005;

/*
 * Metres under which a radius or a normal has no direction.
 */
export const BOUNDARY: number = 1e-9;

/*
 * Fixed collider geometry can lend only its invariant normal prerequisites.
 */

/*
 * One fixed box face's unit normal and the half-extent axis that gives its
 * offset.
 */
export interface IBoxPlane {
  /*
   * The face's outward unit normal in box-local coordinates.
   */
  normal: IAutoMovieVector3;

  /*
   * Which current half extent supplies the plane's offset, metres.
   */
  axis: "x" | "y" | "z";
}
