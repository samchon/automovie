import type { IHumanSourceHeadRegion } from "./IHumanSourceHeadRegion.ts";

/** Historical registration and raw sample pins consumed by source guide export.
 * The original selection records remain authored frame readings rather than
 * measured clinical boundaries. Only immutable Git bytes supply this receipt.
 * @author Samchon
 */
export interface IHumanSourceHistoricalGuideManifest {
  /** Historical head generation that owns the native correspondence. */
  generation: string;

  /** Original oriented attachment selections and their unresolved ambiguity. */
  headRegions: IHumanSourceHeadRegion[];

  /** Original sample file digests and acquisition version strings. */
  sample: Record<string, string>;
}
