/** Per-scene default and per-body override; exaggerated factors are explicit. */
export type AutoMoviePerformanceMode =
  | {
      /** Authored motion and geometric receipts, with no solver. */ kind: "kinematic";
    }
  | { /** Bounded tracking and solver contacts. */ kind: "simulated" }
  | {
      /** Solver behavior with reviewed departures. */ kind: "exaggerated";
      /** Positive multiplier on incoming impulses. */ impulse: number;
      /** Nonnegative multiplier on gravity. */ gravity: number;
      /** Positive multiplier on contact compliance. */ compliance: number;
      /** Screenplay/settings reason for the departure. */ reason: string;
    };
