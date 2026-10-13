import type { IAutoMovieDerivedArtifactDependency } from "@automovie/interface";
import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import type { IAutoMovieDerivedArtifactManifest } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";
import { derivedArtifactFirstUnsafePath } from "./derivedArtifactFirstUnsafePath";
import { AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT } from "./AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT";
import { AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH } from "./AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH";
import { derivedArtifactBasisDigest } from "./derivedArtifactBasisDigest";

/**
 * Ordered scans enforce declared canonical path-policy checks, derived namespace, case-folded uniqueness, per-record dependency separation and self-consistent SHA-256 basis identities.
 *
 * @evidence contracts/common.md#principled-implementation Ordered scans enforce declared canonical path-policy checks, derived namespace, case-folded uniqueness, per-record dependency separation and self-consistent SHA-256 basis identities.
 * @evidence contracts/common.md#clear-and-simple-design Generation and inspection share this first semantic refusal owner after strict shape admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The acyclicity check separates each record's inputs from its generator/output/manifest; it does not traverse a global cross-record dependency DAG.
 * @evidence contracts/common.md#meaningful-documentation States first refusal address/category and the limited per-record cycle/collision checks.
 * @evidence contracts/performance.md#efficient-algorithms Visits A records/I inputs plus path-text and basis-hash bytes; sets scale with output and current-record input populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the same basis composer as generation; digest checks do not reuse an earlier resident-file observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a nullable refusal record escapes; local uniqueness sets are released after the pass and no files are opened.
 */
export const derivedArtifactManifestInvariantFailure: (manifest: IAutoMovieDerivedArtifactManifest) => {

    /**
     * Caller-owned explanation naming the observed refusal and correction context.
     */
    message: string;

    /** Supplied path named by this observation; unsafe candidate spellings remain visible rather than normalized. */
    path: string;

    /**
     * Whether the first failure belongs to path admission rather than record consistency.
     */
    pathUnsafe: boolean;

    /**
     * Logical artifact or manifest address named by this refusal.
     */
    target: string;
} | null = (manifest: IAutoMovieDerivedArtifactManifest): {

    /**
     * Caller-owned explanation naming the observed refusal and correction context.
     */
    message: string;

    /** Supplied path named by this observation; unsafe candidate spellings remain visible rather than normalized. */
    path: string;

    /**
     * Whether the first failure belongs to path admission rather than record consistency.
     */
    pathUnsafe: boolean;

    /**
     * Logical artifact or manifest address named by this refusal.
     */
    target: string;
} | null => {
    const outputs: Set<string> = new Set<string>();
    let previous: string | null = null;
    for (const record of manifest.artifacts) {
        const target: string = `derived-artifact:${record.path}`;
        const unsafe: { label: string;
        path: string } | null = derivedArtifactFirstUnsafePath([
            { label: "output", path: record.path },
            { label: "generator", path: record.generator.path },
            ...record.inputs.map((input: IAutoMovieDerivedArtifactDependency) : { label: string;
            path: string } => ({ label: "input", path: input.path })),
        ]);
        if (unsafe !== null)
            return {
                message: `${unsafe.label} path "${unsafe.path}" is not one canonical cross-platform project path.`,
                path: unsafe.path,
                pathUnsafe: true,
                target,
            };
        if (record.path.startsWith(AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT) === false)
            return {
                message: `Output "${record.path}" must live below "${AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT}".`,
                path: record.path,
                pathUnsafe: true,
                target,
            };
        const foldedOutput: string = record.path.toLowerCase();
        if (outputs.has(foldedOutput) ||
            (previous !== null && compareCodeUnits(previous, record.path) >= 0))
            return {
                message: `Artifact outputs must be unique and sorted by code unit; "${record.path}" is repeated or out of order.`,
                path: record.path,
                pathUnsafe: false,
                target,
            };
        outputs.add(foldedOutput);
        previous = record.path;
        let previousInput: string | null = null;
        const inputSpellings: Set<string> = new Set<string>();
        for (const input of record.inputs) {
            const folded: string = input.path.toLowerCase();
            if (inputSpellings.has(folded) ||
                (previousInput !== null &&
                    compareCodeUnits(previousInput, input.path) >= 0))
                return {
                    message: `Inputs of "${record.path}" must be unique and sorted by code unit; "${input.path}" is repeated or out of order.`,
                    path: input.path,
                    pathUnsafe: false,
                    target,
                };
            inputSpellings.add(folded);
            previousInput = input.path;
        }
        const occupied: Set<string> = new Set([
            record.path.toLowerCase(),
            record.generator.path.toLowerCase(),
            AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH.toLowerCase(),
        ]);
        const cyclic: IAutoMovieDerivedArtifactDependency | undefined = record.inputs.find((input: IAutoMovieDerivedArtifactDependency) : boolean => {
            const folded: string = input.path.toLowerCase();
            if (occupied.has(folded))
                return true;
            occupied.add(folded);
            return false;
        });
        if (cyclic !== undefined)
            return {
                message: `Input "${cyclic.path}" collides with the generator, output, manifest, or another input.`,
                path: cyclic.path,
                pathUnsafe: false,
                target,
            };
        if (SHA256_DIGEST_PATTERN.test(record.generator.digest) === false ||
            record.inputs.some((input: IAutoMovieDerivedArtifactDependency) : boolean => SHA256_DIGEST_PATTERN.test(input.digest) === false) ||
            SHA256_DIGEST_PATTERN.test(record.basisDigest) === false ||
            SHA256_DIGEST_PATTERN.test(record.outputDigest) === false ||
            derivedArtifactBasisDigest(record.generator, record.inputs) !== record.basisDigest)
            return {
                message: `Artifact "${record.path}" has an invalid or self-inconsistent digest record.`,
                path: record.path,
                pathUnsafe: false,
                target,
            };
    }
    return null;
};
