import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import { fingerprintAutoMovieFields } from "./fingerprintAutoMovieFields";
import type { IAutoMovieDerivedArtifactDependency } from "@automovie/interface";
import { AUTOMOVIE_DERIVED_ARTIFACT_BASIS_PROTOCOL } from "./AUTOMOVIE_DERIVED_ARTIFACT_BASIS_PROTOCOL";

/**
 * Ordered framed fields bind protocol, normalized generator digest and each declared input path/byte digest to SHA-256.
 *
 * @evidence contracts/common.md#principled-implementation Ordered framed fields bind protocol, normalized generator digest and each declared input path/byte digest to SHA-256.
 * @evidence contracts/common.md#clear-and-simple-design Generation and invariant checks use the same derivation-specific composer over the shared fingerprint encoder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callers supply canonical sorted input paths; this composer does not silently reorder, reread files or prove supplied digests are authentic.
 * @evidence contracts/common.md#meaningful-documentation States source-normalized generator versus exact-byte inputs and order-sensitive field composition.
 * @evidence contracts/performance.md#efficient-algorithms Builds I field records/header bytes and hashes their total bytes through fingerprintAutoMovieFields.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses already derived dependency digests rather than hashing file contents again at composition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary field arrays/buffers expire after hashing; only the digest string escapes and no file is opened.
 */
export const derivedArtifactBasisDigest: (generator: IAutoMovieDerivedArtifactDependency, inputs: readonly IAutoMovieDerivedArtifactDependency[]) => string = (generator: IAutoMovieDerivedArtifactDependency, inputs: readonly IAutoMovieDerivedArtifactDependency[]): string => fingerprintAutoMovieFields([
    {
        role: "protocol",
        kind: "derived-artifact-basis",
        payload: Buffer.from(AUTOMOVIE_DERIVED_ARTIFACT_BASIS_PROTOCOL),
    },
    {
        role: `generator:${generator.path}`,
        kind: "normalized-typescript-digest",
        payload: Buffer.from(generator.digest),
    },
    ...inputs.map((input: IAutoMovieDerivedArtifactDependency) : IAutoMovieFingerprintField => ({
        role: `input:${input.path}`,
        kind: "byte-digest",
        payload: Buffer.from(input.digest),
    })),
]);
