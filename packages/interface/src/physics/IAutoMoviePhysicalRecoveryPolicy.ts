import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";

/**
 * Same support pattern used by the authored step planner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies recovery-step geometry, timing, force limits, landing gates and optional bracing defaults.
 * @evidence contracts/development/design.md#principled-representation Metre reach/clearance, second durations and SI gains describe a controller policy; numeric bounds and pattern references require simulation admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface advancePhysicalBalance shares the authored footfall pattern while simulation admission supplies optional controller defaults.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bracing carries provider-declared height and shift limits; requested steps do not constitute measured landings.
 */
export interface IAutoMoviePhysicalRecoveryPolicy {
  /** Arbitrary endpoint bones and their timing. */ pattern: IAutoMovieFootfallPattern;
  /** Maximum recovery-step distance, metres. */ maximumStep: number;
  /** Support margin in metres. */ margin: number;
  /** Recovery swing duration, seconds. */ duration: number;
  /** Peak recovery clearance, metres. */ height: number;
  /** Endpoint motor stiffness, N/m. */ stiffness: number;
  /** Endpoint motor damping, N s/m. */ damping: number;
  /** Per-endpoint force cap, N. */ maximumForce: number;
  /** Tracking strength of recovery IK goals, [0,1]; defaults to full bounded tracking. */ jointStrength?: number;
  /** Recovery coordinate-descent budget, 1..64; defaults to 24. */ iterations?: number;
  /** Recovery target residual early-out, metres; defaults to 0.001. */ targetTolerance?: number;
  /** Maximum reach-derived root lowering, metres; defaults to 0.15. */ maximumRootDrop?: number;
  /** Maximum horizontal landing error, metres; defaults to 0.025. */ landingTolerance?: number;
  /** Maximum endpoint speed at accepted landing, m/s; defaults to 1. */ landingSpeed?: number;
  /** Seconds to await actual contact after swing, defaulting to duration. */ landingTimeout?: number;
  /** Sustained support loss before a recovery request, seconds; defaults to 0.1. */ reactionSeconds?: number;
  /** Retain bounded muscular effort after a missed step until measured recovery geometry is lost. */ bracing?: {
    /** Minimum actual COM height above the floor, metres; the provider declares its standing-recovery envelope. */ minimumCenterHeight: number;
    /** Maximum horizontal capture-point correction of the root motor target, metres. */ maximumRootShift: number;
  };
}
