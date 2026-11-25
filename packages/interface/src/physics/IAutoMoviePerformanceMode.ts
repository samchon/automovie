/**
 * A scene's physical performance policy or an explicit body override.
 *
 * ResolvePhysicalPerformanceMode selects the body override when present,
 * otherwise the scene policy, and returns an owned copy. It rejects unknown
 * modes and exaggerated factors outside their finite ranges or a blank reason.
 * Kinematic mode uses authored motion and geometric receipts; simulated modes
 * use bounded tracking and solver contacts. Multipliers are dimensionless.
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
