import type { IAutoMovieSoftBodyDomain } from "./IAutoMovieSoftBodyDomain";

/** Typed cloth or cord domain submitted for numerical and reference admission. */
export namespace IAutoMovieValidateSoftBodyDomain {
  /**
   * Domain for inspecting version/metre units, lattice and solver budgets,
   * finite rest coordinates, masses and accelerations, anchor/state references,
   * colliders, wind, compliance and contact. Right/down structural rest edges
   * must have nonzero computed length. The validator also rejects rest
   * particles strictly embedded in static colliders; actor-local body capsules
   * are deferred until primary motion resolves their world endpoints.
   *
   * Declared dt * referenceSpeed / shortest structural rest length must not
   * exceed one. Cord contact adds a declared travel-versus-radius comparison.
   * These are authoring heuristics, not enforced velocity limits,
   * numerical-stability proofs or continuous collision detection. Shear/bend
   * pairs and all derived arithmetic are not certified by structural-edge
   * checks.
   *
   * ValidateSoftBodyDomain reads without mutation and returns path-addressed
   * violations that can retain authored values. Structurally malformed
   * containers may throw; direct-square magnitude tests retain
   * overflow/underflow limitations. No integration runs as part of admission.
   */
  export type IProps = {
    /**
     * Structurally present world-space cloth/cord definition to inspect;
     * semantic failures become violations without changing authored values.
     */
    domain: IAutoMovieSoftBodyDomain;
  };
}
