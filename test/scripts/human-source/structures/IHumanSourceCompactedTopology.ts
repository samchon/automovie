import type { IHumanSourceTopology } from "./IHumanSourceTopology.ts";

/** Active source geometry and the exact authoring/canonical index correspondence. */
export interface IHumanSourceCompactedTopology {
  /** Only triangle-referenced vertices, in the shared canonical metre frame. */
  topology: IHumanSourceTopology;
  /** Native authoring ordinal to dense canonical source ID; -1 means retired. */
  nativeToSource: Int32Array;
  /** Dense canonical source ID to its retained native authoring ordinal. */
  sourceToNative: Int32Array;
}
