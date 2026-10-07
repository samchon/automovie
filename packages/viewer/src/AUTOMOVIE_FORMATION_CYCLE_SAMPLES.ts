/**
 * Even samples baked across one anonymous cycle.
 *
 * The bake is a table of rigid part matrices, not of vertices, so its size
 * follows the part count rather than the mesh: doubling the samples of a
 * thirteen-bone figure costs tens of kilobytes once per LOD tier and nothing
 * per member. Thirty-two steps put a full cycle inside a frame budget of about
 * 30 ms per step at a walking cadence, and the shader mixes the two
 * neighbouring steps, so the sampling rate bounds interpolation error rather
 * than the visible frame rate.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Fixes the temporal resolution of the shared gait matrix table that travel-driven cycle interpolation reads.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Fixes the temporal resolution of the shared gait matrix table that travel-driven cycle interpolation reads.
 */
export const AUTOMOVIE_FORMATION_CYCLE_SAMPLES = 32;
