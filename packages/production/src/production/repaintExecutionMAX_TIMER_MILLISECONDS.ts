/**
 * The original 2^31-1 millisecond ceiling is the host-safe timeout/backoff contract checked before scheduling. A module-owned numeric binding shares that same ceiling across envelope checks with constant arithmetic and no per-call allocation. It does not cap maximum elapsed time or settlement of injected callbacks; no buffer, handle, task or fixture-specific policy is retained.
 */
export const repaintExecutionMAX_TIMER_MILLISECONDS: number = 2_147_483_647;
