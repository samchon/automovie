import type { IHumanFaceOcularSurface } from "./IHumanFaceOcularSurface";

/**
 * The analytic exterior of one eye in its two evaluated states, matching the
 * rest and posed hull meshes of the same optical assembly.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularSurfacePair {
  /** Exterior in the shape-only rest placement. */
  rest: IHumanFaceOcularSurface;

  /** Exterior carried by the eye's performed motion. */
  posed: IHumanFaceOcularSurface;
}
