import type { IAutoMovieDerivedArtifactManifest } from "@automovie/interface";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";
import { derivedArtifactManifestShapeFailure } from "./derivedArtifactManifestShapeFailure";

/**
 * Duplicate-aware UTF-8 JSON parsing precedes exact version-one structural admission and a cast only after that shape check.
 *
 * @evidence contracts/common.md#principled-implementation Duplicate-aware UTF-8 JSON parsing precedes exact version-one structural admission and a cast only after that shape check.
 * @evidence contracts/common.md#clear-and-simple-design Shape admission stays separate from semantic path/order/digest invariants so generation and inspection report the correct refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parse errors become explicit reasons rather than empty ledgers; the later invariant owner must still run before records are admitted.
 * @evidence contracts/common.md#meaningful-documentation States nullable manifest, explanation meaning and the separation between shape and semantic admission.
 * @evidence contracts/performance.md#efficient-algorithms Parses B bytes and scans A records/I dependencies for shape; stores the parsed tree and first explanation.
 * @evidence contracts/performance.md#reuse-equivalent-work The parsed tree is reused by invariant checks; no second JSON materialization or retained parse cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the tree on success; failed partial parser state and byte views are released after the explanation returns.
 */
export const derivedArtifactParseManifest: (bytes: Uint8Array) => {

    /**
     * Parsed/admitted ledger returned by the owning operation; parsing alone does not authenticate live output bytes.
     */
    manifest: IAutoMovieDerivedArtifactManifest | null;

    /** First JSON or shape refusal explanation, or the empty string after successful parsing. */
    reason: string;
} = (bytes: Uint8Array): {

    /**
     * Parsed/admitted ledger returned by the owning operation; parsing alone does not authenticate live output bytes.
     */
    manifest: IAutoMovieDerivedArtifactManifest | null;

    /** First JSON or shape refusal explanation, or the empty string after successful parsing. */
    reason: string;
} => {
    let value: unknown;
    try {
        value = parseAutoMovieStructuredJson({
            record: "derived-artifact-manifest",
            bytes,
        });
    }
    catch (error) {
        return {
            manifest: null,
            reason: `Derived artifact manifest is not valid UTF-8 JSON: ${derivedArtifactErrorMessage(error)}.`,
        };
    }
    const shapeFailure: string | null = derivedArtifactManifestShapeFailure(value);
    if (shapeFailure !== null)
        return {
            manifest: null,
            reason: `Derived artifact manifest does not match version 1: ${shapeFailure}.`,
        };
    return {
        manifest: value as unknown as IAutoMovieDerivedArtifactManifest,
        reason: "",
    };
};
