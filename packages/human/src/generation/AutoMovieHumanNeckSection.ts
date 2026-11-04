/**
 * A neck-box estimate from the reference set's least-girth sections.
 * Applying it to Human's infrathyroid `neckCircumference` is a site-transfer
 * assumption: the reading did not locate that public tape's landmarks.
 *
 * Estimated from the private reference set; no published source found. The
 * reading `test_human_estimate_sites` takes, on four people, the section of
 * least taut girth between the neck's lowest skin above cervicale's height
 * and the menton: breadth over depth {@link BREADTH_OVER_DEPTH} (SD 0.104)
 * and fullness in its box {@link FULLNESS} (SD 0.043; 0 the rhombus, 1 the
 * box, `AutoMovieHumanBodyBox`).
 *
 * The box follows from the girth G with breadth W = rD and fullness f, since
 * a convex section's taut girth runs from the rhombus 2 sqrt(W^2 + D^2) to the
 * box 2(W + D): G = D (2 sqrt(r^2 + 1) (1 - f) + 2 f (1 + r)).
 *
 * Limits: four people; no production consumer currently imports this law.
 * It supplies neither a neck-base box nor the neck's height or placement.
 * ANSUR II's infrathyroid and base courses are separate measurements
 * (`docs/sources/ansur-ii-handbook-foot-neck.md`).
 *
 * @evidence contracts/common.md#principled-implementation Separates the observed least-girth shape from an unverified transfer to the public tape; the box follows the stated dimensionless interpolation.
 * @evidence contracts/common.md#clear-and-simple-design Keeps two estimate constants and their algebraic box conversion together, without owning a neck builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains the original four-reference estimates and adds no person branch, new fit or compensating coefficient.
 * @evidence contracts/common.md#meaningful-documentation States the source reader, population, spread, site-transfer assumption and absent base/placement laws.
 * @evidence contracts/performance.md#efficient-algorithms A box conversion uses constant arithmetic and creates one result object.
 * @evidence contracts/performance.md#reuse-equivalent-work Both dimensions share the same ratio and computed depth; no cross-request cache is needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two module constants persist; result objects belong to callers and retain no source geometry.
 */
export namespace AutoMovieHumanNeckSection {
  /**
   * Breadth over depth at the observed least girth, four-reference mean.
   *
   * @evidence contracts/common.md#principled-implementation Retains the dimensionless estimate and SD stated on the namespace, without asserting the infrathyroid site was measured.
   * @evidence contracts/common.md#clear-and-simple-design One named ratio supplies the box conversion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture branch or newly fitted value is introduced.
   * @evidence contracts/common.md#meaningful-documentation Names the ratio's site, provenance and dimensionless units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A numeric data declaration chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A primitive constant coordinates no effectful or cached work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One immutable module number has a fixed lifetime and size.
   */
  export const BREADTH_OVER_DEPTH: number = 0.983;

  /**
   * Fullness between rhombus and box perimeter bounds at the observed site.
   *
   * @evidence contracts/common.md#principled-implementation Retains the four-reference mean in the declared perimeter-interpolation convention.
   * @evidence contracts/common.md#clear-and-simple-design One scalar supplies the conversion, separate from geometry realization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not relabel an estimate as a published anatomical coefficient.
   * @evidence contracts/common.md#meaningful-documentation Names the endpoints of the dimensionless fullness and its observed site.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A numeric data declaration chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A primitive constant coordinates no effectful or cached work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One immutable module number has a fixed lifetime and size.
   */
  export const FULLNESS: number = 0.245;

  /**
   * Convert a positive finite girth to the estimated least-girth box shape.
   * Transferring that shape to another tape site is the caller's assumption;
   * this arithmetic does not validate the input or produce a 3D tape curve.
   *
   * @param girth Positive finite circumference, mm.
   * @returns Breadth (side to side) and depth (front to back), mm.
   *
   * @evidence contracts/common.md#principled-implementation Solves the stated perimeter interpolation algebraically for depth, then multiplies by the fixed breadth/depth estimate; positive finite girth is the premise.
   * @evidence contracts/common.md#clear-and-simple-design Returns the two box dimensions directly; a consumer owns tape-site transfer and curve realization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no clamp, person-specific compensation or inferred base/height/placement output.
   * @evidence contracts/common.md#meaningful-documentation States positive input, millimetres, output dimensions and the absence of validation or a realized tape guarantee.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic uses one square root and one returned object, with no scan or solve.
   * @evidence contracts/performance.md#reuse-equivalent-work The computed depth is shared by both output dimensions within the call.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All intermediate numbers are call-local; the caller owns the returned object and no state grows between calls.
   */
  export function box(girth: number): { breadth: number; depth: number } {
    const r: number = BREADTH_OVER_DEPTH;
    const f: number = FULLNESS;
    const depth: number = girth / (2 * Math.sqrt(r * r + 1) * (1 - f) + 2 * f * (1 + r));
    return { breadth: r * depth, depth };
  }
}
