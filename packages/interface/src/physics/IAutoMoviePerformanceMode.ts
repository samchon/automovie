/**
 * A scene's physical performance policy or an explicit body override.
 *
 * resolvePhysicalPerformanceMode selects the body override when present, otherwise the scene policy, and returns an owned copy. It rejects unknown modes and exaggerated factors outside their finite ranges or a blank reason. Kinematic mode uses authored motion and geometric receipts; simulated modes use bounded tracking and solver contacts. Multipliers are dimensionless.
 *
 * @evidence contracts/development/design.md#principled-representation A kind discriminator isolates explicit exaggeration factors from ordinary kinematic and simulated policies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Scene and body policy resolution use the same three alternatives; only exaggeration carries factors and an explanation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolver supplies no content-name default or hidden factor and refuses invalid exaggeration instead of clamping it.
 * @evidence contracts/development/common.md#meaningful-documentation Defines override precedence, factor units, admission and the distinction between geometric and solved receipts.
 */
export type IAutoMoviePerformanceMode =
  | {
      /** Authored motion and geometric receipts, with no solver. */ kind: "kinematic";
    }
  | {
      /** Bounded tracking and solver contacts. */
      kind: "simulated";
    }
  | {
      /** Solver behavior with reviewed departures. */ kind: "exaggerated";
      /** Positive multiplier on incoming impulses. */ impulse: number;
      /** Nonnegative multiplier on gravity. */ gravity: number;
      /** Positive multiplier on contact compliance. */ compliance: number;
      /** Screenplay/settings reason for the departure. */ reason: string;
    };
