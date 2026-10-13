/**
 * Numerical instructions for generating scalp locks on a shared facial basis.
 * The basis owns anatomical growth regions and neutral correspondence. This
 * document owns lengths, fields and appearance; it contains no strand positions,
 * images or identity-dependent resource key. Empty layers mean no scalp hair.
 * Coordinates are metres in the neutral head frame: +Y superior, +Z anterior,
 * and +X anatomical left. Fields describe static styling, not follicle biology,
 * elastic-rod dynamics, hair-to-hair contact or a biological density calibration.
 *
 * Existing qualified member names are declared beside this owner and refer
 * to independently owned canonical interfaces.
 * The aliases add no runtime value or second field definition.
 *
 * @evidence contracts/common.md#principled-implementation Shared-basis growth correspondence and authored layer fields separate native scalp identity from static styling; an empty population expresses absence without importing an image or hairstyle asset.
 * @evidence contracts/common.md#clear-and-simple-design One layers array delegates each numerical population to the canonical Layer record and each root envelope to Region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts assertHumanFaceHair checks the numerical population and integration budgets; the record does not imply calibrated follicle density, mechanics or collision-free rendering.
 * @evidence contracts/common.md#meaningful-documentation Neutral head axes, metre units, eight-layer envelope and styling limitations are stated without treating authored fields as biological measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no root sampling or integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares source fields, not evaluated-pose or guide equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Layer arrays are caller data; no runtime cache or GPU resource is created here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHair {
  /** Independently generated named populations, at most eight. */
  layers: IAutoMovieHumanFaceHair.Layer[];
}

/** Qualified compatibility names share the canonical records and emit no runtime values. */
export namespace IAutoMovieHumanFaceHair {
  /**
   * Retain IAutoMovieHumanFaceHair.Layer as the qualified name of its canonical record.
   *
   * @evidence contracts/common.md#principled-implementation The qualified name resolves directly to the canonical numerical Layer so consumers share the same fields and units.
   * @evidence contracts/common.md#clear-and-simple-design A type-only alias preserves the established namespace address without another layer implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No default population, copied schema or runtime conversion is introduced by this alias.
   * @evidence contracts/common.md#meaningful-documentation The canonical module is explicit and owns the complete layer contract.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The alias emits no integration or sampling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Type identity shares a declaration rather than caching runtime work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No runtime value or resource is emitted.
   */
  export type Layer = import("./IAutoMovieHumanFaceHair/Layer").Layer;

  /**
   * Retain IAutoMovieHumanFaceHair.Region as the qualified name of its canonical record.
   *
   * @evidence contracts/common.md#principled-implementation Root and part envelopes use the same canonical neutral-head Gaussian Region through this qualified name.
   * @evidence contracts/common.md#clear-and-simple-design The alias delegates centre and spread ownership to one module.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It neither fabricates a growth domain nor turns Gaussian weights into anatomical admission.
   * @evidence contracts/common.md#meaningful-documentation The referenced Region declaration owns metre coordinates and positive spreads.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No Gaussian evaluation executes in this alias.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared type identity introduces no runtime memoization.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias retains no sampled roots or buffers.
   */
  export type Region = import("./IAutoMovieHumanFaceHair/Region").Region;
}
