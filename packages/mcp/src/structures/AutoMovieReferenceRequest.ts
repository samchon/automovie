import type { AutoMovieAuthoredDocumentLayer } from "@automovie/evidence";


/**
 * Four transport-independent reference requests; none can supply a new root.
 *
 *
 * @evidence contracts/common.md#principled-implementation Four operation discriminants admit layer navigation, file navigation and exact file or anchor reads.
 * @evidence contracts/common.md#clear-and-simple-design Only operation-relevant fields appear in each branch; no root override or authoring capability is represented.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closed operations expose actual supported reads rather than compile or runtime actions.
 * @evidence contracts/common.md#meaningful-documentation Members state numeric ranges, stale revision meaning, detail opt-in and complete-envelope budgeting.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased request union acquires no source bytes or handle; parseAutoMovieReferenceRequest returns copied scalar request fields to provider dispatch, and the invoking caller owns their lifetime.
 */
export type AutoMovieReferenceRequest =
  | {

      /** Select bounded layer navigation without returning source body text. */
      operation: "get_index_of_layer";

      /** One family from the shared thirteen-layer authored population. */
      layer: AutoMovieAuthoredDocumentLayer;

      /** Requested maximum whole file indices, 1 through 100; defaults to 20. */
      limit?: number;

      /** Resume the exact previously observed layer revision rather than mixing pages. */
      continuation?: {

        /** Sixty-four lowercase hex digits identifying the previous layer snapshot. */
        revision: string;

        /** Next file ordinal returned by the preceding page, between 1 and 10,000. */
        offset: number;
      };

      /** Complete success-envelope UTF-8 byte limit, 256 through 1 MiB; defaults to 64 KiB. */
      budgetBytes?: number;
    }
  | {

      /** Select compact current-file navigation without source body text. */
      operation: "get_index_of_file";

      /** Exact canonical authored Markdown path relative to the bound root. */
      file: string;

      /** Complete success-envelope byte limit; an oversized index is refused, not cut. */
      budgetBytes?: number;
    }
  | {

      /** Select all original file content except recognized HTML annotations. */
      operation: "read_file_without_annotations";

      /** Exact canonical authored Markdown path relative to the bound root. */
      file: string;

      /** Optional SHA-256 navigation revision; a mismatch refuses the current read as stale. */
      expectedDigest?: string;

      /** Opt into retained and omitted original source spans; false or absent stays compact. */
      detail?: boolean;

      /** Complete success-envelope byte limit; content is never silently truncated. */
      budgetBytes?: number;
    }
  | {

      /** Select one explicitly anchored H2/H3/H4 subtree with separate heading metadata. */
      operation: "read_section_without_annotations";

      /** Exact canonical file#anchor; no inferred slug or nearest-section fallback exists. */
      location: string;

      /** Optional SHA-256 navigation revision; a mismatch requires fresh discovery. */
      expectedDigest?: string;

      /** Opt into the exact source spans used to assemble this subtree projection. */
      detail?: boolean;

      /** Complete success-envelope byte limit; an oversized subtree is refused in full. */
      budgetBytes?: number;
    };
