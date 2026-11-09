import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieImpactKind } from "./AutoMovieImpactKind";

/**
 * resolveImpact's normal impulse advice: normalized a-to-b direction, nonnegative closing speed, impulse delivered to b, both post-impact velocities and a qualitative outcome. Separating-contact velocity values may be borrowed inputs.
 *
 * @evidence contracts/development/design.md#principled-representation The representation exposes the normal-component restitution calculation for positive finite masses and admitted material traits; embed/through outcomes remain the producer's deterministic heuristics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One impact result feeds both agent advice and recoil mapping without storing full rigid-body geometry or a simulation world.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No friction, angular velocity or multi-contact constraint solve is implied; heuristic labels do not prove a physically exact aftermath.
 * @evidence contracts/development/common.md#meaningful-documentation Members state direction, metres/second, impulse receiver, N-second units and qualitative outcome meaning.
 */
export interface IAutoMovieImpact {
  /** Normalized world contact direction from a toward b. */
  normal: IAutoMovieVector3;

  /** Closing metres/second along the normal, zero for non-approaching bodies. */
  speed: number;

  /** World N-second impulse delivered to b; a receives its opposite. */
  impulse: IAutoMovieVector3;

  /** Post-impact world metres/second for a; separating-contact output may borrow its input vector. */
  velocityA: IAutoMovieVector3;

  /** Post-impact world metres/second for b; separating-contact output may borrow its input vector. */
  velocityB: IAutoMovieVector3;

  /** Deterministic heuristic outcome rather than a full fracture/contact simulation result. */
  kind: AutoMovieImpactKind;
}
