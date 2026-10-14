import type { IAutoMovieProjectManifest } from "./IAutoMovieProjectManifest";
import { autoMovieProjectValidateManifest } from "./autoMovieProjectValidateManifest";
import { autoMovieProjectReadJson } from "./autoMovieProjectReadJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation Owned JSON acquisition precedes disappeared-manifest refusal and version/assets admission.
 * @evidence contracts/common.md#clear-and-simple-design Resident refresh and asset registration share this authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown fields are preserved; disappearance never creates a fresh empty existing-store manifest.
 * @evidence contracts/common.md#meaningful-documentation States admitted record ownership and malformed/missing refusal.
 * @evidence contracts/performance.md#efficient-algorithms Reads B bytes and validates A paths using an A-entry uniqueness set.
 * @evidence contracts/performance.md#reuse-equivalent-work Current bytes replace stale retained mirrors as admission evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed records transfer to callers; file readers close descriptors.
 */
export function autoMovieProjectReadManifest(_project: IAutoMovieProjectState): IAutoMovieProjectManifest {
    const value: unknown = autoMovieProjectReadJson<unknown>(_project.root, _project.manifestPath);
    if (value === null)
        throw new Error(`AutoMovie project manifest "${_project.manifestPath}" disappeared from the resident project.`);
    return autoMovieProjectValidateManifest(_project.manifestPath, value);
}
