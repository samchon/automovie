import type { IHumanSourceCoherenceFile } from "./IHumanSourceCoherenceFile.ts";
import type { IHumanSourceCoherenceSurface } from "./IHumanSourceCoherenceSurface.ts";

/**
 * A candidate generation read against a reference one under an edit receipt.
 *
 * Bit identity is `Object.is` on every number after the JSON round trip that
 * both generations share, so `-0` and `0` differ. A coherent result says the
 * candidate differs from the reference only where its authoring stages said
 * it would; it accepts no shape.
 *
 * @author Samchon
 */
export interface IHumanSourceCoherence {
  /** Generation ID of the reference head view. */
  reference: string;

  /** SHA-256 of the edit receipt bytes that were applied. */
  editReceiptSha256: string;

  /** Topology, UV, weight, map and cut files of the two source stages. */
  files: IHumanSourceCoherenceFile[];

  /** Every surface and landmark table of the head and body views. */
  surfaces: IHumanSourceCoherenceSurface[];

  /** True when every file is equal and no surface reports a mismatch. */
  coherent: boolean;
}
