import { derivedArtifactIsPlainRecord } from "./derivedArtifactIsPlainRecord";
import { derivedArtifactHasExactKeys } from "./derivedArtifactHasExactKeys";
import { derivedArtifactDependencyShapeFailure } from "./derivedArtifactDependencyShapeFailure";

/**
 * Exact root/record keys, version, encoding and dependency member types admit only the declared version-one structural representation.
 *
 * @evidence contracts/common.md#principled-implementation Exact root/record keys, version, encoding and dependency member types admit only the declared version-one structural representation.
 * @evidence contracts/common.md#clear-and-simple-design This first-failure shape pass precedes manifest semantic invariants and source materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Array containers are refused as records, but the helper does not check object prototypes beyond object/non-array; persistent JSON supplies ordinary materialized objects.
 * @evidence contracts/common.md#meaningful-documentation States first structural reason or null, without claiming paths, ordering or digest consistency are validated here.
 * @evidence contracts/performance.md#efficient-algorithms Visits A artifact records and I dependencies with an own-key sort at each admitted object boundary; malformed unknown objects can contain K unexpected keys, adding O(K log K) comparisons and K key references before refusal. No full output clone is made.
 * @evidence contracts/performance.md#reuse-equivalent-work Calls the shared dependency shape and key-set helpers; the parent reuses the admitted tree for semantic checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a reason string escapes; all per-record key lists are temporary and no handle is acquired.
 */
export const derivedArtifactManifestShapeFailure: (value: unknown) => string | null = (value: unknown): string | null => {
    if (derivedArtifactIsPlainRecord(value) === false)
        return "the root must be an object";
    if (derivedArtifactHasExactKeys(value, ["artifacts", "version"]) === false)
        return "the root must contain only version and artifacts";
    if (value.version !== 1)
        return "version must equal 1";
    if (Array.isArray(value.artifacts) === false)
        return "artifacts must be an array";
    for (const artifact of value.artifacts) {
        if (derivedArtifactIsPlainRecord(artifact) === false)
            return "each artifact must be an object";
        if (derivedArtifactHasExactKeys(artifact, [
            "basisDigest",
            "encoding",
            "generator",
            "inputs",
            "outputDigest",
            "path",
        ]) === false)
            return "each artifact must contain only the version-one record fields";
        if (typeof artifact.path !== "string")
            return "artifact path must be a string";
        if (artifact.encoding !== "utf8" && artifact.encoding !== "base64")
            return "artifact encoding must be utf8 or base64";
        const generatorFailure: string | null = derivedArtifactDependencyShapeFailure(artifact.generator);
        if (generatorFailure !== null)
            return `artifact generator ${generatorFailure}`;
        if (Array.isArray(artifact.inputs) === false)
            return "artifact inputs must be an array";
        for (const input of artifact.inputs) {
            const inputFailure: string | null = derivedArtifactDependencyShapeFailure(input);
            if (inputFailure !== null)
                return `artifact input ${inputFailure}`;
        }
        if (typeof artifact.basisDigest !== "string")
            return "artifact basisDigest must be a string";
        if (typeof artifact.outputDigest !== "string")
            return "artifact outputDigest must be a string";
    }
    return null;
};
