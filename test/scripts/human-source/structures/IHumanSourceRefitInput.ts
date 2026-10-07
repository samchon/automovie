import type { IHumanSourceSample } from "./IHumanSourceSample.ts";

/**
 * One bound part checked against MPFB's own refit of it: the part, how its
 * rows are read, and the sample that holds the refit positions.
 *
 * @author Samchon
 */
export interface IHumanSourceRefitInput {
  /** Part id as the sample manifest records it. */
  id: string;

  /** Published part vertex count. */
  count: number;

  /** Published neutral part positions, metres, in the generation frame. */
  positions: readonly number[];

  /** The bound part's row reader, head frame. */
  row: (name: string, v: number) => number[];

  /** The rigid head carry under a body endpoint. */
  anchorOf: (name: string) => number[];

  /** The upstream sample with the refit part positions per state. */
  sample: IHumanSourceSample;

  /** Vertical frame offset from Blender to the generation frame, metres. */
  offset: number;
}
