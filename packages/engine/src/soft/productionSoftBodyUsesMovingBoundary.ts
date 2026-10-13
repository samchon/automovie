import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * Whether a domain requires primary-motion boundary samples at every step.
 *
 * An anchor bound to a node or bone, or a body capsule collider, moves with the
 * primary performance, so the domain can only be solved live against that
 * performance. A domain with neither stays on the static path.
 */
export const productionSoftBodyUsesMovingBoundary = (
  domain: Pick<IAutoMovieSoftBodyDomain, "anchors" | "colliders">,
): boolean =>
  domain.anchors.some((anchor) => anchor.binding !== undefined) ||
  domain.colliders.some((collider) => collider.kind === "body-capsule");
