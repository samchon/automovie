import type { IHumanHeadEarSourcePort } from "./IHumanHeadEarSourcePort.ts";
import type { IHumanHeadEarSourceRegion } from "./IHumanHeadEarSourceRegion.ts";

/** Complete paired source pinna supports in native Blender metres.
 * Region and attachment uncertainties remain at their original source owner.
 * @author Samchon
 */
export interface IHumanHeadEarSourceGuide {
  /** Historical native source registration generation. */
  generation: string;

  /** Declared native axes, origin and unit; no conversion is applied here. */
  frame: string;

  /** Original native point population shared with the head guide. */
  originalNativeCount: number;

  /** Actual source regions and sparse support selections. */
  regions: IHumanHeadEarSourceRegion[];

  /** Actual native root cycles whose geometry the head and pinnae share. */
  replacementPorts: IHumanHeadEarSourcePort[];
}
