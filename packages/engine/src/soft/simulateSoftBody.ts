import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftCollider,
} from "@automovie/interface";

import { simulateSoftBodyCore } from "./simulateSoftBodyCore";

/**
 * Replay one admitted cloth domain without resolved moving samples to an
 * absolute fixed-clock step. Body capsules are refused; moving anchor binding
 * metadata is currently ignored in favor of static/rest targets. Domain
 * admission is the caller's responsibility. No production/viewer consumer
 * currently invokes this public solver, while portable unit cases exercise its
 * numerical output.
 */
export const simulateSoftBody: (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state?: string | null,
) => IAutoMovieSoftBodyState = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  if (
    domain.colliders.some(
      (collider: IAutoMovieSoftCollider): boolean =>
        collider.kind === "body-capsule",
    )
  )
    throw new Error(
      `soft body "${domain.id}" needs resolved moving boundaries for body capsules`,
    );
  return simulateSoftBodyCore(domain, step, state, null);
};
