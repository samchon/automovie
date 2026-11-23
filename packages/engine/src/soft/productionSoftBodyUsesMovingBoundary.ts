import {
  IAutoMovieSoftAnchor,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftCollider,
} from "@automovie/interface";

/**
 * Identify whether a typed domain declares any moving anchor binding or
 * body-capsule collider. The declaration test does not resolve a pose, certify
 * samples or start a live solver.
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
