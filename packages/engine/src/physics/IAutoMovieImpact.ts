import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieImpactKind } from "./AutoMovieImpactKind";

/**
 * The abstracted result of one collision: the contact normal, the impulse
 * delivered, the closing speed, both bodies' post-impact velocities, and a
 * qualitative {@link AutoMovieImpactKind}. One value serves both consumers: an
 * AI hint ("recoil this hard, this way; it embeds") and a deterministic driver
 * for auto-played aftermath.
 */
export interface IAutoMovieImpact {
  /** Unit contact normal, from `a` toward `b`. */
  normal: IAutoMovieVector3;
  /** Closing speed along the normal at contact (0 if not approaching). */
  speed: number;
  /** Impulse delivered to `b` (the equal and opposite acts on `a`). */
  impulse: IAutoMovieVector3;
  /** `a`'s velocity after the impact. */
  velocityA: IAutoMovieVector3;
  /** `b`'s velocity after the impact. */
  velocityB: IAutoMovieVector3;
  /** What happened. */
  kind: AutoMovieImpactKind;
}
