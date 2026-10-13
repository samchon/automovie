import type { IAutoMovieDerivedArtifactProjectFileRead } from "./IAutoMovieDerivedArtifactProjectFileRead";
import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import type { IAutoMovieDerivedArtifactDependency, IAutoMovieDerivedArtifactSource } from "@automovie/interface";
import { digestAutoMovieBytes, normalizeAutoMovieSource } from "./contentIdentity";
import type { IAutoMovieDerivedArtifactInspection } from "./IAutoMovieDerivedArtifactInspection";
import type { IAutoMovieDerivedArtifactProblem } from "./IAutoMovieDerivedArtifactProblem";
import { derivedArtifactPhysicalProjectRoot } from "./derivedArtifactPhysicalProjectRoot";
import { derivedArtifactProblem } from "./derivedArtifactProblem";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";
import { derivedArtifactFingerprintField } from "./derivedArtifactFingerprintField";
import { AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH } from "./AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH";
import { derivedArtifactReadInspectionFile } from "./derivedArtifactReadInspectionFile";
import { derivedArtifactParseManifest } from "./derivedArtifactParseManifest";
import { derivedArtifactManifestInvariantFailure } from "./derivedArtifactManifestInvariantFailure";
import { AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT } from "./AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT";
import { derivedArtifactBasisDigest } from "./derivedArtifactBasisDigest";
import { derivedArtifactSourceArtifact } from "./derivedArtifactSourceArtifact";

/**
 * Inspect every declared derived artifact without executing a generator.
 *
 * Only records whose manifest, live basis, output digest, encoding, namespace, and external-asset separation all pass enter `artifacts`. Fingerprint fields retain present, absent, stale, and malformed bytes so guarded compilation can detect a race over the same closure.
 *
 * @evidence contracts/common.md#principled-implementation Strict manifest shape/invariants and physical reads authenticate generator, input and output identities; only records without per-record or namespace failures become source artifacts.
 * @evidence contracts/common.md#clear-and-simple-design One inspection produces admitted artifacts, problems and fingerprint fields for both compilation and currentness identity; no generator executes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent configuration intentionally yields an empty closure; unsafe reads become refusals, and path-based observations do not establish a hostile-writer-proof snapshot.
 * @evidence contracts/common.md#meaningful-documentation States admitted-record filtering, external-ledger collision refusal and fields preserving absent, unsafe or stale input states.
 * @evidence contracts/performance.md#efficient-algorithms For A artifacts with I total inputs and B bytes, visits all declarations and hashes live bytes plus canonical basis composition; repeated shared dependencies are reread per record and result storage scales with fields/problems/outputs.
 * @evidence contracts/performance.md#reuse-equivalent-work The same read supplies both admitted content and fingerprint fields within the attempt; there is no persistent cache keyed only by pathname or digest.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned artifacts/problems/fields belong to the caller and can retain closure bytes; synchronous readers retain no open descriptor or task here, and no byte-count cap is imposed.
 */
export const inspectAutoMovieDerivedArtifacts: (props: {

    /**
     * Physical project root the operation admits; path text alone is not a root identity lease.
     */
    root: string;

    /**
     * Undefined disables inspection; a supplied path must equal the fixed owned ledger path.
     */
    manifestPath?: string;

    /**
     * Current external-ledger paths used to refuse a conflicting derived namespace.
     */
    externalAssetPaths?: readonly string[];
}) => IAutoMovieDerivedArtifactInspection = (props: {

    /**
     * Physical project root the operation admits; path text alone is not a root identity lease.
     */
    root: string;

    /**
     * Undefined disables inspection; a supplied path must equal the fixed owned ledger path.
     */
    manifestPath?: string;

    /**
     * Current external-ledger paths used to refuse a conflicting derived namespace.
     */
    externalAssetPaths?: readonly string[];
}): IAutoMovieDerivedArtifactInspection => {
    if (props.manifestPath === undefined)
        return {
            manifest: null,
            artifacts: {},
            problems: [],
            fingerprintFields: [],
        };
    const problems: IAutoMovieDerivedArtifactProblem[] = [];
    const fingerprintFields: IAutoMovieFingerprintField[] = [];
    let root: string;
    try {
        root = derivedArtifactPhysicalProjectRoot(props.root, "path-unsafe");
    }
    catch (error) {
        return {
            manifest: null,
            artifacts: {},
            problems: [
                derivedArtifactProblem("derived-artifact-path-unsafe", "derived-artifact-manifest", props.manifestPath, `${derivedArtifactErrorMessage(error)} Restore one physical project root and run generation again.`),
            ],
            fingerprintFields: [
                derivedArtifactFingerprintField("manifest", props.manifestPath, "unsafe", null),
            ],
        };
    }
    if (props.manifestPath !== AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH) {
        problems.push(derivedArtifactProblem("derived-artifact-path-unsafe", "derived-artifact-manifest", props.manifestPath, `Derived artifact manifest must be "${AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH}". Correct automovie/manifest.json.`));
        fingerprintFields.push(derivedArtifactFingerprintField("manifest", props.manifestPath, "unsafe", null));
        return { manifest: null, artifacts: {}, problems, fingerprintFields };
    }
    const manifestRead: IAutoMovieDerivedArtifactProjectFileRead = derivedArtifactReadInspectionFile({
        root,
        relative: props.manifestPath,
        missingCode: "derived-artifact-manifest-missing",
        target: "derived-artifact-manifest",
    });
    fingerprintFields.push(derivedArtifactFingerprintField("manifest", props.manifestPath, manifestRead.problem === null ? "file" : "absent-or-unsafe", manifestRead.bytes));
    if (manifestRead.problem !== null) {
        problems.push(manifestRead.problem);
        return { manifest: null, artifacts: {}, problems, fingerprintFields };
    }
    const parsed: ReturnType<typeof derivedArtifactParseManifest> = derivedArtifactParseManifest(manifestRead.bytes!);
    if (parsed.manifest === null) {
        problems.push(derivedArtifactProblem("derived-artifact-manifest-malformed", "derived-artifact-manifest", props.manifestPath, `${parsed.reason} Regenerate the derived artifact manifest instead of editing it.`));
        return { manifest: null, artifacts: {}, problems, fingerprintFields };
    }
    const manifestReason: ReturnType<typeof derivedArtifactManifestInvariantFailure> = derivedArtifactManifestInvariantFailure(parsed.manifest);
    if (manifestReason !== null) {
        problems.push(derivedArtifactProblem(manifestReason.pathUnsafe
            ? "derived-artifact-path-unsafe"
            : "derived-artifact-manifest-malformed", manifestReason.target, manifestReason.path, `${manifestReason.message} Run the explicit generation command to rebuild the canonical ledger.`));
        return {
            manifest: parsed.manifest,
            artifacts: {},
            problems,
            fingerprintFields,
        };
    }
    const external: Set<string> = new Set((props.externalAssetPaths ?? []).map((entry: string) : string => entry.toLowerCase()));
    const externalCollision: string | undefined = [...external].find((entry: string) : boolean => entry === AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT.slice(0, -1) || entry.startsWith(AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT));
    if (externalCollision !== undefined)
        problems.push(derivedArtifactProblem("derived-artifact-external-collision", "derived-artifact-manifest", externalCollision, `Derived namespace "${AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT}" is also claimed by the external asset ledger. Remove external registration "${externalCollision}"; deterministic project derivation has a separate owner.`));
    const artifacts: Record<string, IAutoMovieDerivedArtifactSource> = {};
    for (const record of parsed.manifest.artifacts) {
        const problemStart: number = problems.length;
        const target: string = `derived-artifact:${record.path}`;
        const generator: IAutoMovieDerivedArtifactProjectFileRead = derivedArtifactReadInspectionFile({
            root,
            relative: record.generator.path,
            missingCode: "derived-artifact-basis-missing",
            target,
        });
        fingerprintFields.push(derivedArtifactFingerprintField(`${record.path}:generator`, record.generator.path, generator.problem === null ? "typescript" : "absent-or-unsafe", generator.bytes === null
            ? null
            : normalizeAutoMovieSource(generator.bytes)));
        if (generator.problem !== null)
            problems.push(generator.problem);
        const inputs: Array<{ declared: IAutoMovieDerivedArtifactDependency; read: IAutoMovieDerivedArtifactProjectFileRead }> = record.inputs.map((input: IAutoMovieDerivedArtifactDependency) : { declared: IAutoMovieDerivedArtifactDependency; read: IAutoMovieDerivedArtifactProjectFileRead } => {
            const read: IAutoMovieDerivedArtifactProjectFileRead = derivedArtifactReadInspectionFile({
                root,
                relative: input.path,
                missingCode: "derived-artifact-basis-missing",
                target,
            });
            fingerprintFields.push(derivedArtifactFingerprintField(`${record.path}:input`, input.path, read.problem === null ? "file" : "absent-or-unsafe", read.bytes));
            if (read.problem !== null)
                problems.push(read.problem);
            return { declared: input, read };
        });
        const output: IAutoMovieDerivedArtifactProjectFileRead = derivedArtifactReadInspectionFile({
            root,
            relative: record.path,
            missingCode: "derived-artifact-output-missing",
            target,
        });
        fingerprintFields.push(derivedArtifactFingerprintField(`${record.path}:output`, record.path, output.problem === null ? "file" : "absent-or-unsafe", output.bytes));
        if (output.problem !== null)
            problems.push(output.problem);
        if (generator.bytes !== null &&
            inputs.every((input: { declared: IAutoMovieDerivedArtifactDependency; read: IAutoMovieDerivedArtifactProjectFileRead }) : boolean => input.read.bytes !== null)) {
            const liveGenerator: IAutoMovieDerivedArtifactDependency = {
                path: record.generator.path,
                digest: digestAutoMovieBytes(normalizeAutoMovieSource(generator.bytes)),
            };
            const liveInputs: IAutoMovieDerivedArtifactDependency[] = inputs.map((input: { declared: IAutoMovieDerivedArtifactDependency; read: IAutoMovieDerivedArtifactProjectFileRead }): IAutoMovieDerivedArtifactDependency => ({
                path: input.declared.path,
                digest: digestAutoMovieBytes(input.read.bytes!),
            }));
            if (liveGenerator.digest !== record.generator.digest ||
                JSON.stringify(liveInputs) !== JSON.stringify(record.inputs) ||
                derivedArtifactBasisDigest(liveGenerator, liveInputs) !== record.basisDigest)
                problems.push(derivedArtifactProblem("derived-artifact-basis-stale", target, record.generator.path, `Generator or declared input bytes no longer match basis ${record.basisDigest}. Run the explicit generation command before compiling.`));
        }
        if (output.bytes !== null &&
            digestAutoMovieBytes(output.bytes) !== record.outputDigest)
            problems.push(derivedArtifactProblem("derived-artifact-output-stale", target, record.path, `Resident output bytes do not match ${record.outputDigest}. Run the explicit generation command; do not edit derived bytes.`));
        let source: IAutoMovieDerivedArtifactSource | null = null;
        if (output.bytes !== null)
            try {
                source = derivedArtifactSourceArtifact(record, output.bytes);
            }
            catch (error) {
                problems.push(derivedArtifactProblem("derived-artifact-output-malformed", target, record.path, `${derivedArtifactErrorMessage(error)} Regenerate bytes matching the declared encoding.`));
            }
        if (problems.length === problemStart &&
            externalCollision === undefined &&
            source !== null)
            Object.defineProperty(artifacts, record.path, {
                enumerable: true,
                value: source,
            });
    }
    return { manifest: parsed.manifest, artifacts, problems, fingerprintFields };
};
