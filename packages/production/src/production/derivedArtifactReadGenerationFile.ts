import { derivedArtifactResolveCanonical } from "./derivedArtifactResolveCanonical";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { derivedArtifactGenerationFailure } from "./derivedArtifactGenerationFailure";
import { derivedArtifactReadPhysicalFile } from "./derivedArtifactReadPhysicalFile";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";

/**
 * Canonical containment and physical file admission precede synchronous reading; actual absence is input-missing and unsafe read failures become path-unsafe.
 *
 * @evidence contracts/common.md#principled-implementation Canonical containment and physical file admission precede synchronous reading; actual absence is input-missing and unsafe read failures become path-unsafe.
 * @evidence contracts/common.md#clear-and-simple-design One reader labels generator and input failures without changing their byte domain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generator labels affect error context only; no missing input is substituted with an empty byte array.
 * @evidence contracts/common.md#meaningful-documentation States generator/input attribution and exact returned byte ownership.
 * @evidence contracts/performance.md#efficient-algorithms Includes path-depth physical observations and reading B file bytes with proportional output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Generation deliberately rereads live basis members after callback execution; earlier bytes cannot prove current filesystem equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned byte array transfers to the attempt; this wrapper retains no file or task after its synchronous read.
 */
export const derivedArtifactReadGenerationFile: (root: string, relative: string, generator: boolean) => Uint8Array = (root: string, relative: string, generator: boolean): Uint8Array => {
    const file: string = derivedArtifactResolveCanonical(root, relative);
    if (derivedArtifactLstatOrNull(file) === null)
        derivedArtifactGenerationFailure("input-missing", `${generator ? "Generator" : "Declared input"} "${relative}" is missing.`);
    try {
        return derivedArtifactReadPhysicalFile(root, file);
    }
    catch (error) {
        return derivedArtifactGenerationFailure("path-unsafe", `${generator ? "Generator" : "Declared input"} "${relative}" is unsafe: ${derivedArtifactErrorMessage(error)}`);
    }
};
