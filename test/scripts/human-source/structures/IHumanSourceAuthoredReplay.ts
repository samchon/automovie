import type { IHumanSourceSampleFile } from "./IHumanSourceSampleFile.ts";
import type { IHumanSourceSampleState } from "./IHumanSourceSampleState.ts";

/** Provider replay in its native Blender address space. A complete replay
 * retains every original state, including states whose sparse row is empty.
 * Schema 2 lists content files only: the replay's `run-environment.json`
 * names a host's interpreter and module paths and is provenance beside the
 * replay, so this manifest's bytes are the same on every host.
 * @author Samchon
 */
export interface IHumanSourceAuthoredReplay {
  schema: "automovie-authored-head-source-replay/2";
  originalNativeVertices: number;
  vertices: number;
  landmarkIds: string[];
  states: IHumanSourceSampleState[];
  sourceStateCount: number;
  complete: boolean;
  refusals: unknown[];
  files: Record<string, IHumanSourceSampleFile>;
  sampleInputs: Record<string, string>;
  authoringInputsSha256: string;
}
