import { IAutoMovieVisualDeliveryOccurrence } from "./IAutoMovieVisualDeliveryOccurrence";

/**
 * Explicit source for one occurrence. A deterministic lane carries its path/digest and a null repaint source; a repainted lane carries output, receipt and selection digests with a null deterministic source. These metadata joins do not themselves inspect resident media or authorize fallback.
 *
 * @evidence contracts/common.md#principled-implementation The discriminated union carries exactly one source family and preserves occurrence identity beside the output/receipt/selection lineage operands.
 * @evidence contracts/common.md#clear-and-simple-design Source choice is explicit at each occurrence while current receipt and final media verification remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repaint and deterministic metadata are mutually exclusive; a null/foreign source is not silently replaced by deterministic fallback.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies null alternatives, digest lineage and the distinction between metadata choice and resident verification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union performs no source-byte read, hash or occurrence join.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source identities declare no effect-sharing or currentness cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no media buffer, receipt handle or encoder task; callers own actual values.
 * @author Samchon
 */
export type IAutoMovieVisualDeliveryLane =
  | (IAutoMovieVisualDeliveryOccurrence & {
      /** Original deterministic source chosen for this occurrence. */
      lane: "deterministic";

      /** Selected deterministic artifact address and content identity. */
      deterministic: {
        /** Selected deterministic artifact address. */
        path: string;

        /** Content identity supplied by the deterministic-source owner. */
        digest: string;
      };

      /** The other source family is absent, rather than a fallback option. */
      repaint: null;
    })
  | (IAutoMovieVisualDeliveryOccurrence & {
      /** Reviewed repaint source chosen without a deterministic fallback. */
      lane: "repainted";

      /** A repainted occurrence does not carry a deterministic fallback. */
      deterministic: null;

      /** Selected output plus its exact candidate receipt and review selection identities. */
      repaint: {
        /** Selected repainted output address. */
        path: string;

        /** Content identity of the selected output. */
        digest: string;

        /** Canonical candidate receipt identity. */
        receiptDigest: string;

        /** Exact reviewed selection identity. */
        selectionDigest: string;
      };
    });
