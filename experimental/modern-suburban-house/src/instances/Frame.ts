import { Vec } from "./Vec";


/** Orthonormal frame of a facade or roof plane: an origin, two in-plane axes and the normal. */
export type Frame = {
  /** World origin of the frame. */
  origin: Vec;
  /** In-plane horizontal axis. */
  u: Vec;
  /** In-plane axis perpendicular to `u`. */
  v: Vec;
  /** Plane normal. */
  n: Vec;
  /** Rotation from local axes to `u`, `v`, `n`. */
  rotation: { x: number; y: number; z: number; w: number; };
};
