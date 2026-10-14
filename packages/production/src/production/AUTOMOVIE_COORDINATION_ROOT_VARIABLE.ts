

/**
 * Environment key selecting one absolute external root-lock directory for all cooperating processes. The first resolved value is memoized; changing the environment afterward does not move existing coordination authority.
 */
export const AUTOMOVIE_COORDINATION_ROOT_VARIABLE: ReturnType<() => "AUTOMOVIE_COORDINATION_ROOT"> =
  "AUTOMOVIE_COORDINATION_ROOT";
