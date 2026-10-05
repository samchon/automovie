import type { IAutoMovieHumanSkinRegion } from "@automovie/human";

/**
 * The per-tooth regions of the dentition and the record of how each was
 * numbered.
 *
 * @author Samchon
 */
export interface IHumanSourceToothRegistration {
  /** `tooth-<ISO 3950 code>` regions on the dentition surface. */
  regions: Record<string, IAutoMovieHumanSkinRegion>;

  /** Numbering record, written to the generation manifest. */
  record: Record<string, unknown>;
}
