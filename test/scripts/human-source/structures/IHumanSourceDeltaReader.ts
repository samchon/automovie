import type { IHumanSourceSampleState } from "./IHumanSourceSampleState.ts";

/**
 * Frame-converted access to the sampled states. `skin` returns a dense XYZ
 * delta per source vertex and `landmarks` one per joint cube, both in the
 * shared frame (`[dx, dz, -dy]` of the Blender delta), unrounded.
 */
export interface IHumanSourceDeltaReader {
  has(name: string): boolean;
  state(name: string): IHumanSourceSampleState;
  skin(name: string): Float64Array;
  landmarks(name: string): Float64Array;
}
