import { compareCodeUnits } from "./contentIdentity";
import { derivedArtifactAssertGenerationPath } from "./derivedArtifactAssertGenerationPath";
import { derivedArtifactGenerationFailure } from "./derivedArtifactGenerationFailure";

/**
 * A copied code-unit sort followed by canonical path and case-folded uniqueness admission defines deterministic declared-input order.
 *
 * @evidence contracts/common.md#principled-implementation A copied code-unit sort followed by canonical path and case-folded uniqueness admission defines deterministic declared-input order.
 * @evidence contracts/common.md#clear-and-simple-design Generation keeps input ordering policy in one helper before reading bytes or invoking the callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Portable case collisions are refused even on case-sensitive hosts; no fixture-specific input reorder is used.
 * @evidence contracts/common.md#meaningful-documentation States copied output ownership, sorted order and path-unsafe duplicate refusals.
 * @evidence contracts/performance.md#efficient-algorithms For I paths, sorting costs O(I log I) comparisons plus path validation/folding text work and O(I) references.
 * @evidence contracts/performance.md#reuse-equivalent-work The sorted admitted list is reused throughout generation; no cache assumes a caller's mutable input list is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned paths transfer to the attempt and the local spelling set expires; the original array is not mutated.
 */
export const derivedArtifactCanonicalInputPaths: (inputs: readonly string[]) => string[] = (inputs: readonly string[]): string[] => {
    const output: string[] = [...inputs].sort(compareCodeUnits);
    const spellings: Set<string> = new Set<string>();
    for (const input of output) {
        derivedArtifactAssertGenerationPath(input, "input");
        const folded: string = input.toLowerCase();
        if (spellings.has(folded))
            derivedArtifactGenerationFailure("path-unsafe", `Derived inputs repeat portable path "${input}". Keep each input once with one case spelling.`);
        spellings.add(folded);
    }
    return output;
};
