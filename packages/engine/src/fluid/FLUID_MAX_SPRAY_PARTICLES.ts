/**
 * Simultaneously live particles one emitter may hold.
 *
 * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-refusal Refuses an emitter whose live population exceeds the bounded tier.
 * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-fire-refusal-and-claim-boundary Defines the maximum supported decorative spray population.
 */
export const FLUID_MAX_SPRAY_PARTICLES = 4_096;

const BOUNDARY_KINDS = new Set(["wall", "open"]);
const EDGES = ["xMin", "xMax", "zMin", "zMax"] as const;
