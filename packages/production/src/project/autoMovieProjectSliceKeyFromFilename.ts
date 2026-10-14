import { AutoMovieProjectKeyError } from "./AutoMovieProjectKeyError";

/**
 * Remove the caller-admitted .json suffix and URI-decode the remaining filename key. Invalid escapes become a file-attributed AutoMovieProjectKeyError; this helper neither checks the suffix nor opens or admits file contents.
 *
 * @evidence contracts/common.md#principled-implementation Removing the known .json suffix then native percent-decoding recovers the stored key.
 * @evidence contracts/common.md#clear-and-simple-design Shares keyed correspondence and sibling collision decoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only actual .json callers supply the suffix premise; malformed escapes become the established key Error.
 * @evidence contracts/common.md#meaningful-documentation States filename premise and URIError attribution.
 * @evidence contracts/performance.md#efficient-algorithms Slices/decodes L filename units with proportional text.
 * @evidence contracts/performance.md#reuse-equivalent-work Current spelling is decoded directly without a key cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only text/Error escapes; no file opens.
 */
export const autoMovieProjectSliceKeyFromFilename: (file: string, name: string) => string = (file: string, name: string): string => {
    try {
        return decodeURIComponent(name.slice(0, -".json".length));
    }
    catch (error) {
        const reason: string = (error as URIError).message;
        throw new AutoMovieProjectKeyError(file, "filename key", "a URI-encoded key", `${name} (${reason})`);
    }
};
