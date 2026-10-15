import type { RoofPatch } from "./RoofPatch";

/** The rule that splits a long face by the adjacent roof. within defaults to joint (a hidden contact face). */

export interface WallFaceSplit {
  /** Roof composition unit whose line splits the face. */
  tier: RoofPatch["tier"];
  /** Surface owner of the face above the roof line. */
  above: string;
  /** Surface owner of the band inside the roof thickness. */
  within?: string;
}
