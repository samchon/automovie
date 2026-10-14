/**
 * Four-point Gauss-Legendre nodes and weights mapped to [0,1] for normalized
 * fibre impact offset. Decimal coefficients approximate the rule; exponential
 * chord transmission is not a polynomial for which four-point integration is
 * exact. CPU and shader generation reuse this fixed quadrature with no handles.
 */
export const HUMAN_HAIR_SHADOW_OFFSETS: readonly (readonly [number, number])[] = [
  [0.5 - 0.5 * 0.8611363116, 0.5 * 0.3478548451],
  [0.5 - 0.5 * 0.3399810436, 0.5 * 0.6521451549],
  [0.5 + 0.5 * 0.3399810436, 0.5 * 0.6521451549],
  [0.5 + 0.5 * 0.8611363116, 0.5 * 0.3478548451],
] as const;
