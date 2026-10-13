import path from "node:path";
import { AUTOMOVIE_DERIVED_ARTIFACT_WINDOWS_DRIVE } from "./AUTOMOVIE_DERIVED_ARTIFACT_WINDOWS_DRIVE";
import { AUTOMOVIE_DERIVED_ARTIFACT_WINDOWS_DEVICE } from "./AUTOMOVIE_DERIVED_ARTIFACT_WINDOWS_DEVICE";

/**
 * POSIX canonical relative spelling plus explicit Windows drive/device, separator, colon and trailing-dot/space checks admits the declared path-policy subset.
 *
 * @evidence contracts/common.md#principled-implementation POSIX canonical relative spelling plus explicit Windows drive/device, separator, colon and trailing-dot/space checks admits the declared path-policy subset.
 * @evidence contracts/common.md#clear-and-simple-design Generation, inspection and physical resolution share one spelling contract before filesystem observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Windows drive/device rules are supported differences, but this predicate does not reject all reserved filename characters such as asterisk, question mark or quotes; native file owners can still refuse admitted spellings.
 * @evidence contracts/common.md#meaningful-documentation States canonical relative path semantics including NUL, traversal and portable segment refusal.
 * @evidence contracts/performance.md#efficient-algorithms Normalizing and scanning L path units costs O(L) time with split/normalization text proportional to L.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared predicate prevents differing path policy across generation and inspection; no pathname result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; local path strings/segments are released and no file is opened.
 */
export const derivedArtifactIsCanonicalProjectPath: (value: string) => boolean = (value: string): boolean => value.length !== 0 &&
    value.includes("\0") === false &&
    value.includes("\\") === false &&
    AUTOMOVIE_DERIVED_ARTIFACT_WINDOWS_DRIVE.test(value) === false &&
    path.posix.isAbsolute(value) === false &&
    value !== "." &&
    path.posix.normalize(value) === value &&
    value
        .split("/")
        .every((segment: string) : boolean => segment.length !== 0 &&
        segment !== "." &&
        segment !== ".." &&
        segment.includes(":") === false &&
        segment.endsWith(".") === false &&
        segment.endsWith(" ") === false &&
        AUTOMOVIE_DERIVED_ARTIFACT_WINDOWS_DEVICE.test(segment) === false);
