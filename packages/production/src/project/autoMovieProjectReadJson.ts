import path from "node:path";
import { parseAutoMovieStructuredJson } from "../production/duplicateAwareJson";
import { readAutoMovieProductionOwnedFile } from "../production/productionRenderJob";
import { AutoMovieProjectJsonError } from "./AutoMovieProjectJsonError";

/**
 * Read an optional project-owned file and parse strict duplicate-aware UTF-8 JSON. Missing bytes and a JSON null value both return null; acquisition and parser failures are wrapped as a file-attributed AutoMovieProjectJsonError. The generic T is an unchecked return cast, with field admission left to callers.
 *
 * @evidence contracts/common.md#principled-implementation Optional physical owned-file bytes undergo strict duplicate-aware JSON materialization.
 * @evidence contracts/common.md#clear-and-simple-design Separates exact acquisition from per-slice semantic admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parsed JSON null and actual absence both return null under this historical API; T is a cast rather than schema validation.
 * @evidence contracts/common.md#meaningful-documentation States nullable result and attributed parser/filesystem errors.
 * @evidence contracts/performance.md#efficient-algorithms Reads/parses B bytes with ancestry/descriptor admission and parser allocation/copy costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One byte observation supplies one parsed tree; no file-path parse cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readers close descriptors; returned tree/Error transfers to the caller.
 */
export const autoMovieProjectReadJson: <T>(root: string, file: string) => T | null = <T>(root: string, file: string): T | null => {
    try {
        const bytes: Uint8Array<ArrayBufferLike> | null = readAutoMovieProductionOwnedFile({
            root,
            directory: path.dirname(file),
            relative: path.basename(file),
            optional: true,
        });
        if (bytes === null)
            return null;
        return parseAutoMovieStructuredJson({
            record: path.basename(file),
            bytes,
        }) as T;
    }
    catch (error) {
        const reason: string = (error as Error).message;
        throw new AutoMovieProjectJsonError(file, reason);
    }
};
