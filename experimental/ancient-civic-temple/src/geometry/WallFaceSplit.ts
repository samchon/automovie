import type { RoofPatch } from "./RoofPatch";

/** The rule that splits a long face by the adjacent roof. within defaults to joint (a hidden contact face). */

export interface WallFaceSplit {
  tier: RoofPatch["tier"];
  above: string;
  within?: string;
}
