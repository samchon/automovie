import type { IAutoMovieSoftBodyDomain, IAutoMovieVector3 } from "@automovie/interface";

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

/**
 * {@link softBodyRestConfiguration} as the solver's own working buffer.
 *
 * The exported form hands back a plain array, which is what a validator and a
 * consumer want; the solve integrates in place and would otherwise copy the
 * whole panel twice per seek for nothing.
 */
const restConfiguration = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
): Float64Array => {
  const position = Float64Array.from(domain.rest);
  const poses = resolveState(domain, state);
  for (const anchor of domain.anchors) {
    const moved = poses.get(anchor.id);
    const target = moved ??
      anchor.position ?? {
        x: domain.rest[anchor.particle * 3],
        y: domain.rest[anchor.particle * 3 + 1],
        z: domain.rest[anchor.particle * 3 + 2],
      };
    position[anchor.particle * 3] = target.x;
    position[anchor.particle * 3 + 1] = target.y;
    position[anchor.particle * 3 + 2] = target.z;
  }
  return position;
};

/** The anchor poses one named state applies, or an empty map for the default. */
const resolveState = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
): Map<string, IAutoMovieVector3> => {
  const poses = new Map<string, IAutoMovieVector3>();
  if (state === null) return poses;
  const named = domain.states.find((candidate) => candidate.id === state);
  if (named === undefined)
    throw new Error(
      `soft body "${domain.id}" does not declare a named state "${state}"`,
    );
  for (const pose of named.anchors) poses.set(pose.anchor, pose.position);
  return poses;
};
