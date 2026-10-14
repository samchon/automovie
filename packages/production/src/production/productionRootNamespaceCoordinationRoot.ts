import os from "node:os";
import path from "node:path";
import { AUTOMOVIE_COORDINATION_ROOT_VARIABLE } from "./AUTOMOVIE_COORDINATION_ROOT_VARIABLE";

let resolvedCoordinationRoot: string | null = null;

/**
 * Resolve and memoize the external coordination directory on first lease use. An absolute AUTOMOVIE_COORDINATION_ROOT override wins; otherwise homedir then userInfo supplies the account home. Failure to resolve either refuses rather than choosing a different fence root.
 *
 * @evidence contracts/common.md#principled-implementation Every process sharing a project must use the same directory; an absolute override avoids cwd-relative divergence and a lazily resolved home avoids making package import depend on account lookup.
 * @evidence contracts/common.md#clear-and-simple-design One module-local resolved path is the authority for coordinate naming, directory preparation and permission refusal; resolving it acquires no lease.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No temporary-path fallback weakens exclusion when home lookup fails; differing accounts or override values can still choose different fence roots and must be configured consistently.
 * @evidence contracts/common.md#meaningful-documentation States resolution order, absolute override, first-use memoization and cross-process agreement requirements; later environment changes do not invalidate the memo.
 * @evidence contracts/performance.md#efficient-algorithms One initial environment/home resolution and path join establish the result, followed by constant lookup work; native account-query latency is provider-dependent.
 * @evidence contracts/performance.md#reuse-equivalent-work The first successfully resolved path is reused for this module's lifetime, assuming the operator does not change coordination authority within the process.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one path string indefinitely and opens no descriptor; directory and coordinate-lock lifetimes belong to their later acquisition owners.
 */
export const productionRootNamespaceCoordinationRoot: () => string = (): string => {
  if (resolvedCoordinationRoot !== null) return resolvedCoordinationRoot;
  const configured: string | undefined = process.env[AUTOMOVIE_COORDINATION_ROOT_VARIABLE];
  if (configured !== undefined && configured.trim().length !== 0) {
    const value: string = configured.trim();
    if (path.isAbsolute(value) === false)
      throw new Error(
        `${AUTOMOVIE_COORDINATION_ROOT_VARIABLE} is "${value}", which is not an absolute path. A relative coordination root resolves against each process's own working directory, so two processes fencing one project would compute two directories and exclude nothing. State an absolute path both processes can reach, or unset the variable to use this account's home.`,
      );
    resolvedCoordinationRoot = value;
    return resolvedCoordinationRoot;
  }
  const home: string = ((): string => {
    for (const read of [
      (): string => os.homedir(),
      (): string => os.userInfo().homedir,
    ] as const)
      try {
        const value: string = read();
        if (typeof value === "string" && value.length !== 0) return value;
      } catch {
        continue;
      }
    throw new Error(
      "AutoMovie cannot resolve this account's home directory, so it cannot name the root-lock coordination path every process on this machine has to agree on. Neither os.homedir() nor os.userInfo() answered, which a sandbox that withholds the passwd database does. Grant that access or run outside the sandbox; a fallback path would let two processes fence against different roots, which is what these locks exist to prevent.",
    );
  })();
  resolvedCoordinationRoot = path.join(home, ".automovie-root-locks");
  return resolvedCoordinationRoot;
};
