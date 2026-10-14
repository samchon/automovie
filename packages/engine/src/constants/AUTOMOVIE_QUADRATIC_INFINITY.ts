/**
 * The interval endpoint the native quadratic kernel reads as unbounded.
 *
 * The Clarabel bridge in `vendor/clarabel/src/lib.rs` sets the solver's
 * infinity to this value and drops any row side at or beyond it, so the
 * TypeScript adapter writes it for a null endpoint and refuses every finite
 * coefficient or endpoint whose magnitude reaches it. Changing it needs the
 * bridge and the committed kernel bytes to change with it.
 */
export const AUTOMOVIE_QUADRATIC_INFINITY: number = 1e30;
