/**
 * ValidateFluidDomain admits at most this many sources and separately this many
 * drains per domain. The fixed population limit bounds each replay step's flow
 * walk, not flow-rate magnitude or accumulated volume.
 */
export const AutoMovieEngineFluidMaxFlows: 256 = 256 as const;
