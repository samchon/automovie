import type { IAutoMovieDerivedArtifactProjectFileRead } from "./IAutoMovieDerivedArtifactProjectFileRead";
import { derivedArtifactResolveCanonical } from "./derivedArtifactResolveCanonical";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { derivedArtifactProblem } from "./derivedArtifactProblem";
import { derivedArtifactReadPhysicalFile } from "./derivedArtifactReadPhysicalFile";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";

/**
 * Canonical physical reads return bytes or a problem; missing paths use the requested missing category and caught unsafe failures use path-unsafe.
 *
 * @evidence contracts/common.md#principled-implementation Canonical physical reads return bytes or a problem; missing paths use the requested missing category and caught unsafe failures use path-unsafe.
 * @evidence contracts/common.md#clear-and-simple-design Inspection preserves failures as closure observations so compilation can fingerprint and report them together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No catch returns plausible replacement bytes or silently removes a declared dependency.
 * @evidence contracts/common.md#meaningful-documentation States nullable bytes, matching problem ownership and the limited three missing-code choices.
 * @evidence contracts/performance.md#efficient-algorithms Path checks and reading B bytes dominate work; failed reads retain one explanation object whose text has no fixed size bound.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned read observation supplies digest checks and fingerprint fields together; no observation survives as a cross-attempt cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains successful bytes or the refusal record; no reader handle or background task is retained.
 */
export const derivedArtifactReadInspectionFile: (props: {

    /** Physical root already admitted by the inspection caller; this read does not independently pin it. */
    root: string;

    /**
     * Supplied project-relative candidate admitted before physical reading.
     */
    relative: string;

    /**
     * Category used only when this required manifest, basis or output member is absent.
     */
    missingCode: "derived-artifact-basis-missing" | "derived-artifact-manifest-missing" | "derived-artifact-output-missing";

    /**
     * Logical artifact or manifest address named by this refusal.
     */
    target: string;
}) => IAutoMovieDerivedArtifactProjectFileRead = (props: {

    /** Physical root already admitted by the inspection caller; this read does not independently pin it. */
    root: string;

    /**
     * Supplied project-relative candidate admitted before physical reading.
     */
    relative: string;

    /**
     * Category used only when this required manifest, basis or output member is absent.
     */
    missingCode: "derived-artifact-basis-missing" | "derived-artifact-manifest-missing" | "derived-artifact-output-missing";

    /**
     * Logical artifact or manifest address named by this refusal.
     */
    target: string;
}): IAutoMovieDerivedArtifactProjectFileRead => {
    try {
        const file: string = derivedArtifactResolveCanonical(props.root, props.relative);
        if (derivedArtifactLstatOrNull(file) === null)
            return {
                bytes: null,
                problem: derivedArtifactProblem(props.missingCode, props.target, props.relative, `Required derived-artifact file "${props.relative}" is missing. Run the explicit generation command before compiling.`),
            };
        return { bytes: derivedArtifactReadPhysicalFile(props.root, file), problem: null };
    }
    catch (error) {
        return {
            bytes: null,
            problem: derivedArtifactProblem("derived-artifact-path-unsafe", props.target, props.relative, `${derivedArtifactErrorMessage(error)} Replace symlinks or escaped paths with physical project files, then regenerate.`),
        };
    }
};
