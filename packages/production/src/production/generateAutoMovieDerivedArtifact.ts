import type { IAutoMovieDerivedArtifactDependency, IAutoMovieDerivedArtifactManifest, IAutoMovieDerivedArtifactRecord } from "@automovie/interface";
import path from "node:path";
import { acquireCommitLock, releaseCommitLock } from "../project/commitLock";
import { compareCodeUnits, digestAutoMovieBytes, normalizeAutoMovieSource } from "./contentIdentity";
import type { IGenerateAutoMovieDerivedArtifactProps } from "./IGenerateAutoMovieDerivedArtifactProps";
import type { IGenerateAutoMovieDerivedArtifactOutput } from "./IGenerateAutoMovieDerivedArtifactOutput";
import { derivedArtifactPhysicalProjectRoot } from "./derivedArtifactPhysicalProjectRoot";
import { derivedArtifactAssertGenerationPath } from "./derivedArtifactAssertGenerationPath";
import { AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT } from "./AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT";
import { derivedArtifactGenerationFailure } from "./derivedArtifactGenerationFailure";
import { derivedArtifactCanonicalInputPaths } from "./derivedArtifactCanonicalInputPaths";
import { AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH } from "./AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH";
import { derivedArtifactResolveCanonical } from "./derivedArtifactResolveCanonical";
import { AUTOMOVIE_DERIVED_ARTIFACT_LOCK_PATH } from "./AUTOMOVIE_DERIVED_ARTIFACT_LOCK_PATH";
import { derivedArtifactEnsurePhysicalDirectory } from "./derivedArtifactEnsurePhysicalDirectory";
import { derivedArtifactReadGenerationManifest } from "./derivedArtifactReadGenerationManifest";
import { derivedArtifactReadGenerationFile } from "./derivedArtifactReadGenerationFile";
import { derivedArtifactInvokeGenerator } from "./derivedArtifactInvokeGenerator";
import { derivedArtifactAssertEncoding } from "./derivedArtifactAssertEncoding";
import { derivedArtifactBasisDigest } from "./derivedArtifactBasisDigest";
import { derivedArtifactSameResidentBytes } from "./derivedArtifactSameResidentBytes";
import { derivedArtifactWritePhysicalFileAtomic } from "./derivedArtifactWritePhysicalFileAtomic";
import { AutoMovieDerivedArtifactGenerationError } from "./AutoMovieDerivedArtifactGenerationError";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";

/**
 * Generate and atomically publish one deterministic project artifact.
 *
 * The callback runs twice against independent copies of the declared inputs. Publication begins only when both exact outputs agree and the live basis is still the one the attempt read. This standalone Node operation publishes declared derivation bytes independently of source compilation; neither operation runs authored code inside a runtime sandbox.
 *
 * @evidence contracts/common.md#principled-implementation Canonical declared paths, a physical root and a commit lock delimit an attempt; independent input copies feed two callback runs, whose outputs must agree before live basis rechecking.
 * @evidence contracts/common.md#clear-and-simple-design Generation owns declared derivation bytes independently of source compilation; output and manifest are each atomically replaced in that order, not committed as one pair transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Two equal outputs sample repeatability, not all-run determinism or undeclared dependency freedom; the callback is synchronous authored code without a sandbox, and external writes can race after basis checks.
 * @evidence contracts/common.md#meaningful-documentation States namespace, twice-invoked callback, copied operands, basis refusal and possible output publication before a later manifest failure.
 * @evidence contracts/performance.md#efficient-algorithms For I input paths and B input/output bytes, includes path sorting, repeated physical reads/hashes, two callback costs and manifest sorting/serialization; no byte or callback-time budget is enforced.
 * @evidence contracts/performance.md#reuse-equivalent-work Acquired input bytes feed independent callback copies; live rereads are required for the basis fence and cannot reuse the initial snapshot as current evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts matching lock release; the void release owner can swallow cleanup failures and retain a resident fence/local ownership. Per-file writers attempt descriptor close and unpublished-temporary removal, whose failures can mask an earlier refusal; a successfully renamed output is not rolled back by later failure. Attempt buffers scale with supplied bytes without a cap.
 */
export const generateAutoMovieDerivedArtifact: (props: IGenerateAutoMovieDerivedArtifactProps) => IGenerateAutoMovieDerivedArtifactOutput = (props: IGenerateAutoMovieDerivedArtifactProps): IGenerateAutoMovieDerivedArtifactOutput => {
    const root: string = derivedArtifactPhysicalProjectRoot(props.root, "path-unsafe");
    derivedArtifactAssertGenerationPath(props.generator, "generator");
    derivedArtifactAssertGenerationPath(props.output, "output");
    if (props.output.startsWith(AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT) === false)
        derivedArtifactGenerationFailure("path-unsafe", `Derived output "${props.output}" must live below "${AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT}".`);
    const inputs: string[] = derivedArtifactCanonicalInputPaths(props.inputs);
    const occupied: Set<string> = new Set([
        props.generator.toLowerCase(),
        AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH.toLowerCase(),
        props.output.toLowerCase(),
    ]);
    for (const input of inputs)
        if (occupied.has(input.toLowerCase()))
            derivedArtifactGenerationFailure("path-unsafe", `Derived input "${input}" collides with its generator, output, or manifest. Keep the dependency graph acyclic.`);
        else
            occupied.add(input.toLowerCase());
    const lockFile: string = derivedArtifactResolveCanonical(root, AUTOMOVIE_DERIVED_ARTIFACT_LOCK_PATH);
    let token: string | null = null;
    try {
        derivedArtifactEnsurePhysicalDirectory(root, path.join(root, "automovie"));
        token = acquireCommitLock(lockFile);
        const manifest: IAutoMovieDerivedArtifactManifest = derivedArtifactReadGenerationManifest(root);
        const generatorBytes: Uint8Array = derivedArtifactReadGenerationFile(root, props.generator, true);
        const generator: IAutoMovieDerivedArtifactDependency = {
            path: props.generator,
            digest: digestAutoMovieBytes(normalizeAutoMovieSource(generatorBytes)),
        };
        const inputBytes: Record<string, Uint8Array> = Object.fromEntries(inputs.map((input: string) : [string, Uint8Array] => [input, derivedArtifactReadGenerationFile(root, input, false)]));
        const dependencies: IAutoMovieDerivedArtifactDependency[] = inputs.map((input: string): IAutoMovieDerivedArtifactDependency => ({
            path: input,
            digest: digestAutoMovieBytes(inputBytes[input]!),
        }));
        const first: Uint8Array = derivedArtifactInvokeGenerator(props.generate, inputBytes);
        const second: Uint8Array = derivedArtifactInvokeGenerator(props.generate, inputBytes);
        if (Buffer.from(first).equals(Buffer.from(second)) === false)
            derivedArtifactGenerationFailure("nondeterministic-output", `Generator "${props.generator}" returned different bytes for the same declared inputs. No artifact was published.`);
        derivedArtifactAssertEncoding(first, props.encoding, "output-malformed");
        const liveGenerator: string = digestAutoMovieBytes(normalizeAutoMovieSource(derivedArtifactReadGenerationFile(root, props.generator, true)));
        const liveInputs: IAutoMovieDerivedArtifactDependency[] = dependencies.map((input: IAutoMovieDerivedArtifactDependency) : IAutoMovieDerivedArtifactDependency => ({
            path: input.path,
            digest: digestAutoMovieBytes(derivedArtifactReadGenerationFile(root, input.path, false)),
        }));
        if (liveGenerator !== generator.digest ||
            JSON.stringify(liveInputs) !== JSON.stringify(dependencies))
            derivedArtifactGenerationFailure("basis-changed", "Generator or declared input bytes changed during generation. Run the explicit generation command again against one stable snapshot.");
        const record: IAutoMovieDerivedArtifactRecord = {
            path: props.output,
            encoding: props.encoding,
            generator,
            inputs: dependencies,
            basisDigest: derivedArtifactBasisDigest(generator, dependencies),
            outputDigest: digestAutoMovieBytes(first),
        };
        const artifacts: IAutoMovieDerivedArtifactRecord[] = manifest.artifacts
            .filter((artifact: IAutoMovieDerivedArtifactRecord) : boolean => artifact.path !== props.output)
            .concat(record)
            .sort((left: IAutoMovieDerivedArtifactRecord, right: IAutoMovieDerivedArtifactRecord) : number => compareCodeUnits(left.path, right.path));
        const next: IAutoMovieDerivedArtifactManifest = {
            version: 1,
            artifacts,
        };
        const artifactPath: string = derivedArtifactResolveCanonical(root, props.output);
        const manifestPath: string = derivedArtifactResolveCanonical(root, AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH);
        const artifactChanged: boolean = derivedArtifactSameResidentBytes(root, artifactPath, first) === false;
        const manifestBytes: Buffer = Buffer.from(`${JSON.stringify(next, null, 2)}\n`);
        const manifestChanged: boolean = derivedArtifactSameResidentBytes(root, manifestPath, manifestBytes) === false;
        if (artifactChanged)
            derivedArtifactWritePhysicalFileAtomic(root, artifactPath, first);
        if (manifestChanged)
            derivedArtifactWritePhysicalFileAtomic(root, manifestPath, manifestBytes);
        return {
            changed: artifactChanged || manifestChanged,
            manifest: next,
            record,
        };
    }
    catch (error) {
        if (error instanceof AutoMovieDerivedArtifactGenerationError)
            throw error;
        throw new AutoMovieDerivedArtifactGenerationError("publication-failed", `Derived artifact publication failed: ${derivedArtifactErrorMessage(error)}`, { cause: error });
    }
    finally {
        if (token !== null)
            releaseCommitLock(lockFile, token);
    }
};
