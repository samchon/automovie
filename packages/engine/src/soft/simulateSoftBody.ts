import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftCollider,
} from "@automovie/interface";

import { simulateSoftBodyCore } from "./simulateSoftBodyCore";

/** Replay one admitted cloth domain without resolved moving samples to an absolute fixed-clock step. Body capsules are refused; moving anchor binding metadata is currently ignored in favor of static/rest targets. Domain admission is the caller's responsibility. No production/viewer consumer currently invokes this public solver, while portable unit cases exercise its numerical output.
 *
 * @evidence contracts/common.md#principled-implementation The shared position-based core starts from rest, predicts damped velocities, applies ordered Jacobi distance corrections and discrete contacts, then refuses nonfinite integrated arrays. Its finite-arithmetic and admitted-domain premises do not prove unconditional stability or continuous collision freedom.
 * @evidence contracts/common.md#clear-and-simple-design Static-boundary refusal belongs to this API; its core is shared with the complete moving-boundary API so the same stencil, fold and contact order define both trajectories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Body capsules are refused without samples, but anchor bindings alone still follow static/rest targets, an unresolved static-versus-live admission distinction. No adaptive step, cached fixture state or hidden self-collision solver changes the authored clock.
 * @evidence contracts/common.md#meaningful-documentation States absolute seeking, the static admission boundary, failure propagation and actual test-only runtime reach.
 * @evidence contracts/performance.md#efficient-algorithms For P particles, I sweeps, K steps and C static colliders, replay costs O(P*K*(I+C)+P+A+S+T), with O(P) working/result storage and state/anchor lookup costs A,S,T.
 * @evidence contracts/performance.md#reuse-equivalent-work Rest lengths and topology are prepared once per replay by the shared core; mutable domains and named states do not have a cross-call trajectory cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The core releases local buffers on return or throw; fresh plain arrays and scalar measurements belong to the caller, with no integration cursor or host task retained.
 *
 * @author Samchon
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
