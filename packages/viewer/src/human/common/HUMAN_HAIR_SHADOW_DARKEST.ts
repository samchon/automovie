/**
 * Dimensionless albedo floor used before log color-to-absorption conversion.
 * Zero and darker positive values clamp here; the resulting transmission is
 * small but is not analytically zero. This numerical display convention is
 * shared by CPU and shader evaluators and retains no native resource.
 */
export const HUMAN_HAIR_SHADOW_DARKEST: number = 1e-4;
