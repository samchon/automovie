import {
  IAutoMovieSoftAnchor,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftCollider,
} from "@automovie/interface";

/** Identify whether a typed domain declares any moving anchor binding or body-capsule collider. The declaration test does not resolve a pose, certify samples or start a live solver.
 *
 * @evidence contracts/common.md#principled-implementation Short-circuit some scans distinguish the authored moving-boundary encodings; valid anchors/colliders arrays are the typed input premise, and empty arrays return false.
 * @evidence contracts/common.md#clear-and-simple-design The live-selection gate shares this declaration predicate so both missing-selection and wrongly-selected static-domain cases use the same definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A declaration is not proof that required actors/nodes exist; no actor heuristic or inferred collider makes a static domain live.
 * @evidence contracts/common.md#meaningful-documentation States the two moving encodings and declaration-versus-execution distinction.
 * @evidence contracts/performance.md#efficient-algorithms At most A anchors plus C colliders are scanned, with early exit and constant extra storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Both selection decisions reuse the same predicate; mutable arrays are evaluated rather than retained behind an identity cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean survives; domain arrays are unmodified and unretained.
 */
export const productionSoftBodyUsesMovingBoundary: (
  domain: Pick<IAutoMovieSoftBodyDomain, "anchors" | "colliders">,
) => boolean = (
  domain: Pick<IAutoMovieSoftBodyDomain, "anchors" | "colliders">,
): boolean =>
  domain.anchors.some(
    (anchor: IAutoMovieSoftAnchor): boolean => anchor.binding !== undefined,
  ) ||
  domain.colliders.some(
    (collider: IAutoMovieSoftCollider): boolean =>
      collider.kind === "body-capsule",
  );
