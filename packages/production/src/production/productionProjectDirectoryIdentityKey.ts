import type { IAutoMovieProductionProjectDirectoryIdentity as IPhysicalDirectoryIdentity } from "./IAutoMovieProductionProjectDirectoryIdentity";

/**
 * Encode a captured physical-directory pair in the native identity key form.
 *
 * @evidence contracts/common.md#principled-implementation NUL-delimited decimal device/inode strings match the BigInt-stat key representation for admitted observation records.
 * @evidence contracts/common.md#clear-and-simple-design The directory assertion compares this shared pair representation without deriving identity from path names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This encoder neither validates arbitrary strings nor establishes currentness; its callers supply captured native identities.
 * @evidence contracts/common.md#meaningful-documentation Gives observation-record premise, delimiter and separate validation/currentness obligations.
 * @evidence contracts/performance.md#efficient-algorithms Concatenation costs the component text lengths and allocates one key, without filesystem work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied-pair encoding coordinates no retained cross-request result or filesystem observation cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The new key is caller-owned; input records and path populations are not retained.
 */
export function productionProjectDirectoryIdentityKey(identity: IPhysicalDirectoryIdentity): string {
    return `${identity.device}\0${identity.inode}`;
}
