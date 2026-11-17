/**
 * Admission result for resolving an authored articulation input to its independent coordinate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admission result for resolving an authored articulation input to its independent coordinate. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation The Input union distinguishes usable independent travel from a failed coordinate and its reason.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Articulation input admission serves archetype posing and motion coordinate lookup.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Failure context is not a partial successful coordinate or permission to drive a follower.
 */
export namespace IAutoMovieAffordanceArticulation {
  /**
   * Fresh result of AffordanceArticulation.input, which follows an acyclic articulation chain, checks each coordinate's range and inverts only explicitly reversible couplings. Input maps/affordances are borrowed and unchanged. Callers admitting an entire state must separately refuse multiple inputs to the same independent degree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes independent success from the first failed coordinate, its units and optional upstream context.
   * @evidence contracts/development/design.md#principled-representation The success discriminant separates usable coordinates from reference/range/follower/inverse failures; travel always uses the named joint's unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Archetype posing and motion coordinate lookup consume the same result of the engine's chain admission, without an exception class crossing the boundary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No request is clamped and no duplicate independent input is selected here; optional leader is diagnostic context only after a coupling has resolved.
   */
  export type Input =
    | {
        /** This input reached an independent articulation through valid ranges and permitted inverses. */
        success: true;

        /** Stable affordance id of the terminal independent articulation, not necessarily the originally authored id. */
        id: string;

        /** Resolved independent travel: degrees for hinge/knob/crank/wheel, metres for slider/button/pedal/trigger. */
        travel: number;
      }
    | {
        /** Admission failed; id/travel describe a rejected coordinate, not a usable output. */
        success: false;

        /** Original requested id for reference failure; otherwise the articulation where range or coupling admission first failed. */
        id: string;

        /** Rejected travel in this id's articulation units; reference failure retains the original value and range failure may carry NaN or infinity. */
        travel: number;

        /** reference: absent/nonarticulating/cyclic chain; range: nonfinite or out of bounds; follower: reverse input not permitted; inverse: no unique legal upstream inverse. */
        kind: "reference" | "range" | "follower" | "inverse";

        /** Immediate upstream follows.id for follower/inverse failures; absent for reference and range failures. */
        leader?: string;
      };
}
