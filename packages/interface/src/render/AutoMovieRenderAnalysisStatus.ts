/**
 * Why a metric carries no measured number.
 *
 * - `unsupported`: this repository has no analysis for the quantity the design declares. A water body without a fluid solver is unsupported, and saying so is the whole point: an absent analysis reported as a passing budget is a false capability claim.
 * - `not-run`: the analysis exists but its input was not supplied, so it did not execute. Texture bytes without texture dimensions is the canonical case.
 *
 * Neither is ever collapsed into zero, and neither is ever collapsed into `within`.
 *
 * @evidence contracts/common.md#principled-implementation Render inventory distinguishes an unimplemented quantity from an available analysis lacking required input, and budget evaluation carries either gap into an incomplete report instead of a numeric total.
 * @evidence contracts/common.md#clear-and-simple-design Two closed gap states separate capability absence from execution absence without mixing either with measured budget outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither state is coerced to zero or within, so absent texture dimensions or unsupported physical rendering cannot produce a false clearance.
 * @evidence contracts/common.md#meaningful-documentation Defines unsupported versus not-run and their nonnumeric, nonpassing effect on budget reporting.
 * @author Samchon
 */
export type AutoMovieRenderAnalysisStatus = "unsupported" | "not-run";
