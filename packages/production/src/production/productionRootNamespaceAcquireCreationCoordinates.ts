import type { BigIntStats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionRootNamespaceAcquireCoordinates } from "./productionRootNamespaceAcquireCoordinates";
import { productionRootNamespaceReleaseCoordinates } from "./productionRootNamespaceReleaseCoordinates";
import { productionRootNamespaceCreationCoordinates } from "./productionRootNamespaceCreationCoordinates";
import { productionRootNamespacePhysicalDirectoryIdentityOrNull } from "./productionRootNamespacePhysicalDirectoryIdentityOrNull";

/**
 * Fence one child creation under the current physical parent identity, then recheck that identity before returning the acquired path/token levels. Identity drift refuses and attempts reverse retirement of those levels.
 *
 * @evidence contracts/common.md#principled-implementation A bigint parent stat supplies the identity coordinate and a later physical-directory observation must match dev/ino before mutation authority is returned.
 * @evidence contracts/common.md#clear-and-simple-design Owns the parent witness and post-acquisition admission around the shared two-coordinate set acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A replaced or linked parent refuses instead of creating into a newly observed namespace; cleanup uses only acquired tokens.
 * @evidence contracts/common.md#meaningful-documentation States parent identity matching, acquired-level ownership and that finite rechecks do not establish an atomic future filesystem namespace.
 * @evidence contracts/performance.md#efficient-algorithms Two-coordinate acquisition and fixed parent stats drive application work; contention and token/process-survey costs remain with the commit-lock owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the observed parent identity within this attempt, and repeats the identity check after lock acquisition rather than caching a pathname's suitability.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Success transfers two acquired levels to its caller; failure attempts their reverse release, and the operation retains no descriptor after its native stats.
 */
export const productionRootNamespaceAcquireCreationCoordinates: (parentReal: string, childName: string) => Array<{ path: string; token: string }> = (
  parentReal: string,
  childName: string,
): Array<{ path: string; token: string }> => {
  const parentIdentity: BigIntStats = fileSystem.statSync(parentReal, { bigint: true });
  const locks: { path: string; token: string; }[] = productionRootNamespaceAcquireCoordinates(
    productionRootNamespaceCreationCoordinates(parentReal, childName, parentIdentity),
  );
  try {
    const current: BigIntStats | null = productionRootNamespacePhysicalDirectoryIdentityOrNull(parentReal);
    if (
      current === null ||
      current.dev !== parentIdentity.dev ||
      current.ino !== parentIdentity.ino
    )
      throw new Error(
        `Production project parent "${parentReal}" changed physical identity during namespace acquisition. No child was created.`,
      );
    return locks;
  } catch (error) {
    productionRootNamespaceReleaseCoordinates(locks);
    throw error;
  }
};
