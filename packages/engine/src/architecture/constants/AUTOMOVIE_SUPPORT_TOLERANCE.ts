/**
 * Default contact slack, in metres, for building support queries.
 *
 * `builtEnvironmentSupportStatus` and `builtEnvironmentSupportSweep` use it
 * when the caller states no tolerance. It equals the placement epsilon the prop
 * kernel judges its own contact with, so an unqualified building relation and
 * an unqualified prop relation call the same distance "touching".
 */
export const AUTOMOVIE_SUPPORT_TOLERANCE: number = 1e-9;
