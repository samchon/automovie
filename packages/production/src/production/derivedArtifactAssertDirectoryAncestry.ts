import { derivedArtifactDirectoryIdentity } from "./derivedArtifactDirectoryIdentity";

/**
 * Ordered identity rereads throw at the first directory whose device/inode string differs from the recorded attempt identity.
 *
 * @evidence contracts/common.md#principled-implementation Ordered identity rereads throw at the first directory whose device/inode string differs from the recorded attempt identity.
 * @evidence contracts/common.md#clear-and-simple-design The atomic writer uses the same fence before and after rename.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity equality is an observed metadata comparison, not proof that no replacement occurred between observations or that inodes cannot be reused.
 * @evidence contracts/common.md#meaningful-documentation States first mismatched-path refusal and native metadata errors.
 * @evidence contracts/performance.md#efficient-algorithms Rechecks at most D recorded directories and their path text with constant find state.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the acquired ancestry list without rebuilding it, but identity values are freshly read for each fence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The supplied list remains caller-owned and no descriptor or new retained state is created.
 */
export const derivedArtifactAssertDirectoryAncestry: (ancestry: readonly {

    /** Absolute observed directory pathname whose recorded identity is checked during this write attempt. */
    path: string;

    /**
     * Observed bigint device/inode key used for the attempt's ancestry comparison.
     */
    identity: string;
}[]) => void = (ancestry: readonly {

    /** Absolute observed directory pathname whose recorded identity is checked during this write attempt. */
    path: string;

    /**
     * Observed bigint device/inode key used for the attempt's ancestry comparison.
     */
    identity: string;
}[]): void => {
    const changed: {
    path: string; identity: string } | undefined = ancestry.find((entry: {
    path: string; identity: string }) : boolean => derivedArtifactDirectoryIdentity(entry.path) !== entry.identity);
    if (changed !== undefined)
        throw new Error(`Owned directory "${changed.path}" changed physical identity during publication.`);
};
