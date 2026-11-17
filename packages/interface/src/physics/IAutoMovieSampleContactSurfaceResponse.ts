import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";

/**
 * Local accumulating appearance weight at an actual provider surface point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the sample clock/frame, transported contact centres, explicit impulse estimates and decay policy.
 * @evidence contracts/development/design.md#principled-representation World/provider metre coordinates share one current frame; weightPerImpulse is per N s and decaySeconds is positive seconds or Infinity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface sampleContactSurfaceResponse reads canonical contact events; the provider's center callback and appearance channels own surface transport and colour.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Geometry-only contacts require declared impulse estimates; a localized appearance weight is not a medical model or an invented solver impulse.
 */
export namespace IAutoMovieSampleContactSurfaceResponse {
  /**
   * Local accumulating appearance weight at an actual provider surface point.
   * Provider-owned colour/roughness channels consume this scalar. Each contact
   * centre is supplied in the same current provider frame as the sample, so skin
   * marks follow the struck region through later articulation. Engine does not
   * choose a whole-part tint or assert a medical bruise model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the sample clock/frame, transported contact centres, explicit impulse estimates and decay policy.
   * @evidence contracts/development/design.md#principled-representation World/provider metre coordinates share one current frame; weightPerImpulse is per N s and decaySeconds is positive seconds or Infinity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface sampleContactSurfaceResponse reads canonical contact events; the provider's center callback and appearance channels own surface transport and colour.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Geometry-only contacts require declared impulse estimates; a localized appearance weight is not a medical model or an invented solver impulse.
   */
  export type IInput = {
    /** Actual receipts for this provider body. */
    contacts: readonly IAutoMovieContactReceipt[];
    /** Film second being drawn. */
    seconds: number;
    /** Surface sample in the provider's selected metre frame. */
    point: IAutoMovieVector3;
    /**
     * Contact centre transported into that same frame.
     *
     * Synchronously transport the sampled contact event into the same current metre frame as point. Return a finite point without mutating the borrowed event; exceptions propagate. The returned point is read immediately and no callback or point is retained after sampling.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronously transport the sampled contact event into the same current metre frame as point. Return a finite point without mutating the borrowed event; exceptions propagate. The returned point is read immediately and no callback or point is retained after sampling.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; sampleContactSurfaceResponse and its provider owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; sampleContactSurfaceResponse and its provider owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in sampleContactSurfaceResponse and its provider.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; sampleContactSurfaceResponse and its provider owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; sampleContactSurfaceResponse and its provider owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; sampleContactSurfaceResponse and its provider and the documented reader/caller lifetime own retained data and release.
     */
    center: (receipt: IAutoMovieContactReceipt) => IAutoMovieVector3;
    /** Explicit appearance radius, metres. */
    radius: number;
    /** Accumulation weight per N s. */
    weightPerImpulse: number;
    /** Positive decay time, seconds; Infinity retains marks. */
    decaySeconds: number;
    /** Formula-derived N s for geometric contacts. */
    geometricImpulses: Readonly<Record<string, number>>;
  };
}
