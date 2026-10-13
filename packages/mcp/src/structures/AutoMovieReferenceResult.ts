import type { IAutoMovieReferenceFileIndex } from "./IAutoMovieReferenceFileIndex";
import type { IAutoMovieReferenceLayerIndex } from "./IAutoMovieReferenceLayerIndex";
import type { IAutoMovieReferenceContent } from "./IAutoMovieReferenceContent";


/** A success or a sanitized, classified refusal shared by both transports.
 *
 * @evidence contracts/common.md#principled-implementation The ok discriminant separates complete navigation/projection data from classified sanitized refusal.
 * @evidence contracts/common.md#clear-and-simple-design One envelope is shared by SDK and local JSON transports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure messages contain provider-authored guidance rather than external source annotations or exception text.
 * @evidence contracts/common.md#meaningful-documentation Members document successful budget admission and classified failure recovery.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased envelope owns no response itself; createAutoMovieReferenceProvider returns navigation or projected text to the requesting transport, whose result lifetime is separate from the provider's temporary parsed snapshot.
 */
export type AutoMovieReferenceResult =
  | {

      /** True only when the complete admitted response fits its requested budget. */
      ok: true;

      /** Current source navigation or projection selected by the request operation. */
      data:
        | IAutoMovieReferenceFileIndex
        | IAutoMovieReferenceLayerIndex
        | IAutoMovieReferenceContent;
    }
  | {

      /** False distinguishes a refusal from an empty successful result. */
      ok: false;

      /** Sanitized classified failure, never external exception text or source annotations. */
      error: {

        /** Stable refusal category used to choose recovery or fresh navigation. */
        code: string;

        /** Source-free explanation and recovery guidance authored by the provider. */
        message: string;
      };
    };
