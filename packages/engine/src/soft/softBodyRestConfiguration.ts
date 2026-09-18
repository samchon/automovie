import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * The configuration a panel is in before a single step is integrated: the
 * authored rest mesh with every anchor's own target written in, and one named
 * state's poses written over that.
 *
 * The rest mesh alone is not where the panel hangs. An anchor may hold its
 * particle somewhere else entirely, a named state moves it again, and both are
 * boundary conditions no sweep ever relaxes. Anything that must know where the
 * cloth actually starts — a containment check against the room a furnishing
 * binds it to, a bounding volume drawn before the first frame — reads this
 * rather than {@link IAutoMovieSoftBodyDomain.rest}, or it answers for a shape
 * the panel is never in.
 *
 * An anchor whose particle index falls outside the lattice writes nothing, the
 * same way the solver drops it: an out-of-range anchor is refused on its own
 * path by {@link validateSoftBodyDomain}, and inventing a particle for it here
 * would lengthen the very array whose length is the record's contract.
 *
 * Throws when `state` names a state the domain does not declare, exactly as
 * {@link simulateSoftBody} does.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Applies the declared anchor constraints to the selected rest configuration.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Resolves the step-zero state from static anchor inputs.
 * @author Samchon
 */
export const softBodyRestConfiguration = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null = null,
): number[] => Array.from(restConfiguration(domain, state));
