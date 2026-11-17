import type { IAutoMovieSoftBodyDomain } from "./IAutoMovieSoftBodyDomain";

/**
 * Typed cloth or cord domain submitted for numerical and reference admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies field/reference gates, static embedding, moving-capsule deferral, violation ownership and travel-heuristic limits.
 * @evidence contracts/development/design.md#principled-representation Canonical world-metre cloth, kilogram masses and second-based solver fields retain their semantic owner; validateSoftBodyDomain supplies range and cross-record checks absent from number types.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One domain request serves furnishing validation and lowering; moving actor poses remain with boundary resolution rather than this static gate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Typed input does not imply complete schema parsing or universally stable dynamics; no input is repaired into an admitted substitute.
 */
export namespace IAutoMovieValidateSoftBodyDomain {
  /**
   * Domain for inspecting version/metre units, lattice and solver budgets, finite rest coordinates, masses and accelerations, anchor/state references, colliders, wind, compliance and contact. Right/down structural rest edges must have nonzero computed length. The validator also rejects rest particles strictly embedded in static colliders; actor-local body capsules are deferred until primary motion resolves their world endpoints.
   *
   * Declared dt * referenceSpeed / shortest structural rest length must not exceed one. Cord contact adds a declared travel-versus-radius comparison. These are authoring heuristics, not enforced velocity limits, numerical-stability proofs or continuous collision detection. Shear/bend pairs and all derived arithmetic are not certified by structural-edge checks.
   *
   * validateSoftBodyDomain reads without mutation and returns path-addressed violations that can retain authored values. Structurally malformed containers may throw; direct-square magnitude tests retain overflow/underflow limitations. No integration runs as part of admission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies field/reference gates, static embedding, moving-capsule deferral, violation ownership and travel-heuristic limits.
   * @evidence contracts/development/design.md#principled-representation Canonical world-metre cloth, kilogram masses and second-based solver fields retain their semantic owner; validateSoftBodyDomain supplies range and cross-record checks absent from number types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One domain request serves furnishing validation and lowering; moving actor poses remain with boundary resolution rather than this static gate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Typed input does not imply complete schema parsing or universally stable dynamics; no input is repaired into an admitted substitute.
   */
  export type IProps = {
    /** Structurally present world-space cloth/cord definition to inspect; semantic failures become violations without changing authored values. */
    domain: IAutoMovieSoftBodyDomain;
  };
}
