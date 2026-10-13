import type { AutoMovieDerivedArtifactEncoding } from "@automovie/interface";
import type { AutoMovieDerivedArtifactGenerationErrorCode } from "./AutoMovieDerivedArtifactGenerationErrorCode";
import { AutoMovieDerivedArtifactGenerationError } from "./AutoMovieDerivedArtifactGenerationError";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";

/**
 * Base64 permits arbitrary bytes; utf8 uses fatal TextDecoder to refuse malformed scalar encoding with the supplied generation error code.
 *
 * @evidence contracts/common.md#principled-implementation Base64 permits arbitrary bytes; utf8 uses fatal TextDecoder to refuse malformed scalar encoding with the supplied generation error code.
 * @evidence contracts/common.md#clear-and-simple-design Generation checks output encoding before either output or ledger publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No replacement-character decoding turns malformed utf8 into publishable text; base64's unrestricted byte domain is intentional.
 * @evidence contracts/common.md#meaningful-documentation States encoding-dependent admission and cause-preserving typed refusal.
 * @evidence contracts/performance.md#efficient-algorithms utf8 validation decodes B bytes with proportional temporary text; base64 admission takes constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The output byte array is reused by publication after admission; no encoding verdict is cached over mutable arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary decoded text expires on return or throw; no resource handle is acquired.
 */
export const derivedArtifactAssertEncoding: (bytes: Uint8Array, encoding: AutoMovieDerivedArtifactEncoding, code: AutoMovieDerivedArtifactGenerationErrorCode) => void = (bytes: Uint8Array, encoding: AutoMovieDerivedArtifactEncoding, code: AutoMovieDerivedArtifactGenerationErrorCode): void => {
    if (encoding === "base64")
        return;
    try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    catch (error) {
        throw new AutoMovieDerivedArtifactGenerationError(code, `UTF-8 derived output is malformed: ${derivedArtifactErrorMessage(error)}`, { cause: error });
    }
};
