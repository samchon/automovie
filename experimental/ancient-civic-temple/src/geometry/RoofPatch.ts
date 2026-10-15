import { HeightPlane } from "./HeightPlane";
import { PlanPoint } from "./PlanPoint";

/**
 * A roof top-face piece. tier is the composition unit (wing roofs compose with each other, while the
 * sanctuary and porch are separate units floating above them), and thickness is the vertical depth from top to underside.
 */

export interface RoofPatch {
  id: string;
  owner: string;
  surface: string;
  tier: "wing" | "sanctuary" | "porch";
  polygon: PlanPoint[];
  height: HeightPlane;
  thickness: number;
}
