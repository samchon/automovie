import type { IAutoMovieMotionHumanAudit } from "@automovie/interface";

/**
 * The audit's default limits, metres unless stated: 10 mm of self-penetration
 * (the skin's give where a hand rests on the body), 5 mm below the floor, 5 mm
 * of slip and of lift (the project's foot verdict bound), a 5 mm jump, a 50 mm
 * out-and-back, 30 m/s (above any human joint speed: a pitcher's hand peaks
 * near 40 m/s only at ball release, a punch's fist near 10 m/s) and no
 * departure of the extrapolated centre of mass from the feet.
 *
 * A leaf of its own, importing no check, so a law that keeps a motion within
 * one of these bounds (the lowering's soft reach) reads it without loading the
 * audit's checks and the posture modules they import.
 */
export const AutoMovieMotionHumanAuditLimits: Readonly<
  Record<IAutoMovieMotionHumanAudit.Check, number>
> = {
  tangle: 0.01,
  floor: 0.005,
  slip: 0.005,
  lift: 0.005,
  jump: 0.005,
  reversal: 0.05,
  speed: 30,
  balance: 0,
};
