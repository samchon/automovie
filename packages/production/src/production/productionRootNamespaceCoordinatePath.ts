import crypto from "node:crypto";
import path from "node:path";
import { productionRootNamespaceCoordinationRoot } from "./productionRootNamespaceCoordinationRoot";
import { productionRootNamespaceEnsureCoordinationRoot } from "./productionRootNamespaceEnsureCoordinationRoot";

/**
 * Name one external fence from its closed coordinate kind and normalized, case-folded namespace using SHA-256. Case folding can over-coordinate distinct POSIX paths but unifies Windows aliases.
 *
 * @evidence contracts/common.md#principled-implementation A NUL-delimited kind and namespace are hashed into one filename, so path, physical identity, creation and production reservations use distinct domains under the shared coordination root.
 * @evidence contracts/common.md#clear-and-simple-design One formatter prepares the shared directory and names every coordinate, leaving acquisition and release effects to the lock owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Case folding deliberately favors exclusion on Windows and may serialize unrelated POSIX paths; hashing names a coordinate and does not authenticate project bytes.
 * @evidence contracts/common.md#meaningful-documentation States domain separation, case folding, platform tradeoff and the prerequisite that processes agree on the coordination directory.
 * @evidence contracts/performance.md#efficient-algorithms Normalization, case folding and hashing follow N namespace characters with O(N) temporary strings, plus fixed directory suitability checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the resolved coordination root and canonical naming method, but does not cache current directory permissions or acquired lock tokens.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one path string and acquires no lock; directory creation may persist and actual coordinate leases are owned by the acquisition operation.
 */
export const productionRootNamespaceCoordinatePath: (kind: | "create-path"
    | "create-id"
    | "root-path"
    | "root-id"
    | "production-path"
    | "production-id", namespace: string) => string = (
  kind:
    | "create-path"
    | "create-id"
    | "root-path"
    | "root-id"
    | "production-path"
    | "production-id",
  namespace: string,
): string => {
  productionRootNamespaceEnsureCoordinationRoot();
  // Case-folding can only over-coordinate distinct POSIX paths; it also makes
  // aliases of one case-insensitive Windows namespace share the same fence.
  const canonical: string = path.normalize(namespace).toLowerCase();
  const digest: string = crypto
    .createHash("sha256")
    .update(`${kind}\0${canonical}`)
    .digest("hex");
  return path.join(productionRootNamespaceCoordinationRoot(), `${kind}-${digest}.lock`);
};
