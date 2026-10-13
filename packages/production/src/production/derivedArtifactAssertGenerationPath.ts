import { derivedArtifactIsCanonicalProjectPath } from "./derivedArtifactIsCanonicalProjectPath";
import { derivedArtifactGenerationFailure } from "./derivedArtifactGenerationFailure";

/**
 * The declared path-policy predicate is the sole admission rule; failure throws path-unsafe with the owning role.
 *
 * @evidence contracts/common.md#principled-implementation The declared path-policy predicate is the sole admission rule; failure throws path-unsafe with the owning role.
 * @evidence contracts/common.md#clear-and-simple-design Generation names generator, input and output refusals without duplicating platform path rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles only label the error and do not grant exceptions to the path contract.
 * @evidence contracts/common.md#meaningful-documentation States the synchronous void/throw boundary and role-attributed refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes O(L) path spelling/segment checks with proportional split storage.
 * @evidence contracts/performance.md#reuse-equivalent-work All generation roles share the same predicate; no previously accepted pathname bypasses current admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary segment strings expire on return or throw and no filesystem handle is opened.
 */
export const derivedArtifactAssertGenerationPath: (value: string, role: string) => void = (value: string, role: string): void => {
    if (derivedArtifactIsCanonicalProjectPath(value) === false)
        derivedArtifactGenerationFailure("path-unsafe", `Derived ${role} path "${value}" is not one canonical cross-platform project path.`);
};
