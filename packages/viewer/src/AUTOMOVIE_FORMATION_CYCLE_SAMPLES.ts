/**
 * Default 32 evenly spaced samples per baked rigid-part cycle. Each gait/tier table stores twelve Float32 components per part and sample, so its matrix array costs 48 * parts * samples bytes and is shared across members. The shader interpolates adjacent samples; this resolution is a display convention rather than a measured frame-time budget or a numerical error bound for arbitrary authored motion.
 */
export const AUTOMOVIE_FORMATION_CYCLE_SAMPLES = 32;
