import type { AutoMovieDesignReferenceMedia } from "@automovie/interface";

import type { IAutoMovieDesignReferenceBounds } from "./IAutoMovieDesignReferenceBounds";

/**
 * What one design-reference asset's bytes actually are.
 *
 * @evidence contracts/common.md#principled-implementation The inspector derives media, exact-byte digest and extent from the same supplied bytes; media is parser-confirmed rather than inferred from a pathname.
 * @evidence contracts/common.md#clear-and-simple-design One inspection record carries the facts the production reference gate compares with the authored observation, keeping the declared reference separate from its byte evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported extent is explicit through the bounds union; the record provides no fallback measurement from authored frame dimensions.
 * @evidence contracts/common.md#meaningful-documentation Members state container confirmation, exact-byte identity and unsupported-extent meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares a parser result; hashing and parsing costs are answered by inspectDesignReferenceAsset.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The gate reads one result for a reference's frames; this data carrier starts or shares no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result retains scalar facts and bounds only, not the inspected bytes or an open parser handle.
 * @author Samchon
 */
export interface IAutoMovieInspectedDesignReference {
  /**
   * Container family confirmed by its own parser, never by a name.
   */
  media: AutoMovieDesignReferenceMedia;

  /**
   * SHA-256 of the exact inspected bytes.
   */
  digest: string;

  /**
   * Source-space extent, or the reason this host cannot measure it.
   */
  bounds: IAutoMovieDesignReferenceBounds;
}
