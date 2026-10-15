import { HeightPlane } from "./HeightPlane";
import { PlanPoint } from "./PlanPoint";

/**
 * A roof top-face piece. tier is the composition unit (wing roofs compose with each other, while the
 * sanctuary and porch are separate units floating above them), and thickness is the vertical depth from top to underside.
 */

export interface RoofPatch {
  /** Patch identity within its owner. */
  id: string;
  /** Roof owner the patch belongs to, such as `roof-west`. */
  owner: string;
  /** Surface identity of the patch's top face. */
  surface: string;
  /** Composition unit the patch composes with. */
  tier: "wing" | "sanctuary" | "porch";
  /** Convex counter-clockwise plan outline of the patch. */
  polygon: PlanPoint[];
  /** Height field of the patch's top face. */
  height: HeightPlane;
  /** Vertical depth from the top face to the underside. */
  thickness: number;
}
