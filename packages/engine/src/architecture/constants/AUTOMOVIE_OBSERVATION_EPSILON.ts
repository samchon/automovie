/**
 * Slack below which two derived quantities are treated as one.
 *
 * Observation routines use this fixed numeric tolerance both for metre-scale proximity and dimensionless normal/determinant tests. Each caller states its comparison; sharing the number does not equate those units or prove a universal roundoff/error bound for every scale or conditioning.
 */
export const AUTOMOVIE_OBSERVATION_EPSILON: number = 1e-6;
