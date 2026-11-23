/**
 * Why a metric carries no measured number.
 *
 * - `unsupported`: this repository has no analysis for the quantity the design
 *   declares. A water body without a fluid solver is unsupported, and saying so
 *   is the whole point: an absent analysis reported as a passing budget is a
 *   false capability claim.
 * - `not-run`: the analysis exists but its input was not supplied, so it did not
 *   execute. Texture bytes without texture dimensions is the canonical case.
 *
 * Neither is ever collapsed into zero, and neither is ever collapsed into
 * `within`.
 */
export type AutoMovieRenderAnalysisStatus = "unsupported" | "not-run";
