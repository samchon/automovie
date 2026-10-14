/**
 * Format a finite hair-shadow model constant as a GLSL floating literal.
 * Callers supply finite fitted coefficients, quadrature values and RGB weights.
 * Ten significant decimal digits exceed ordinary Float32 precision, but values
 * at a Float32 rounding threshold can still round differently after formatting.
 *
 * @evidence contracts/common.md#principled-implementation Number.toPrecision emits decimal or scientific floating syntax with ten significant digits for current finite optical constants and quadrature factors. This exceeds ordinary binary32 precision but does not promise identical Float32 rounding for a Float64 value exactly at a rounding threshold.
 * @evidence contracts/common.md#clear-and-simple-design One numeric formatter serves all generated hair-shadow shader constants instead of mixing arbitrary decimal truncation policies in the GLSL template.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Formatting treats every supplied coefficient alike and does not replace coefficients or tune digits to a captured frame.
 * @evidence contracts/common.md#meaningful-documentation States finite-input premises, GLSL literal purpose, decimal precision and the limitation at Float32 rounding thresholds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Formatting one bounded-width scalar string selects no traversal or allocation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shader source is generated once by its module owner; this scalar formatting helper coordinates no repeated request cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a short string and retains no coefficient, shader program or GPU resource.
 */
export const formatHumanHairShadowGlsl: (value: number) => string = (value: number): string => value.toPrecision(10);
