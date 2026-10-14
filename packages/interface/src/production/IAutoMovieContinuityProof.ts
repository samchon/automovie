/**
 * Exact evidence owner and selector that alone may prove a continuity claim.
 *
 * @evidence contracts/common.md#principled-implementation The owner discriminator declares a named shot outcome or acceptance-scenario address while preserving its intended evidence family. The production continuity resolver is retired; this metadata performs no outcome lookup, currentness check or review admission.
 * @evidence contracts/common.md#clear-and-simple-design Geometry carries shot plus outcome kind and id, while review-owned arms carry their scenario id, so each proof exposes only selectors its verification owner can resolve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same state or event id in another shot is not interchangeable evidence, and a non-frame scenario cannot satisfy the frame-review arm merely because its scenario name matches.
 * @evidence contracts/common.md#meaningful-documentation Names geometry outcome families and exact shot ownership, and distinguishes actual-frame review from general required acceptance proof.
 * @author Samchon
 */
export type IAutoMovieContinuityProof =
  | {
      /** Compiler-measured named contract outcome. */
      owner: "geometry";

      /** Exact shot carrying the named outcome. */
      shot: string;

      /** Claim-specific realization selector. */
      outcome: {
        /** Compiler realization family with stable ids. */
        kind: "opening" | "closing" | "event" | "formation";

        /** Exact state, event, or formation id. */
        id: string;
      };
    }
  | {
      /** Actual-frame acceptance observed by a current shot/film review. */
      owner: "frame-review";

      /** Exact frame acceptance scenario. */
      scenario: string;
    }
  | {
      /** Current required acceptance outcome observed by shot/film review. */
      owner: "acceptance";

      /** Exact acceptance scenario. */
      scenario: string;
    };
