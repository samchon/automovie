import type { IHumanSourceAuthoredBinding } from "./IHumanSourceAuthoredBinding.ts";
import type { IHumanSourceAuthoredPacketEntry } from "./IHumanSourceAuthoredPacketEntry.ts";
import type { IHumanSourceSampleFile } from "./IHumanSourceSampleFile.ts";
import type { IHumanSourceAuthoredPorts } from "./IHumanSourceAuthoredPorts.ts";

/** Provider neutral packet fields consumed by the actual root/P1 compiler.
 * Producer closure and biological qualification remain final-generation gates.
 * @author Samchon
 */
export interface IHumanSourceAuthoredPacket {
  /** Exact completed authoring input manifest used by this provider invocation. */
  authoringInputs: IHumanSourceAuthoredPacketEntry;
  originalNativeCount: number;
  appendedBindings: IHumanSourceAuthoredBinding[];
  cells: IHumanSourceAuthoredPacketEntry;
  positions: IHumanSourceAuthoredPacketEntry;
  bonepoints: IHumanSourceAuthoredPacketEntry;
  orderedPorts: IHumanSourceAuthoredPorts;
  nasalAxisFit: IHumanSourceAuthoredPacketEntry;
  sourceGuide: IHumanSourceAuthoredPacketEntry;
  sampleInputs: Record<string, IHumanSourceSampleFile>;
}
