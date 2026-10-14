import type { IAutoMovieHumanFaceAppearanceParameters } from "../parameters/IAutoMovieHumanFaceAppearanceParameters";

/**
 * Authored visible terminal shafts at one registered facial site.
 * Count and calibre are numerical production targets, separate from recorded
 * terminal density, follicular units and donor-zone measurements. No clinical
 * normal interval is inferred from those distinct quantities.
 *
 * @evidence contracts/common.md#principled-implementation Explicit emitted count, visible length/calibre, authored tangent emergence/frontal flow, integration step, seed and linear finish resolve into the same registered hair layer, with millimetre/micrometre conversion at that boundary.
 * @evidence contracts/common.md#clear-and-simple-design Biological observations stay outside the profile; independent population, geometry, sampling, deterministic replay and finish values retain their actual producer roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical follicle units/donor density supply no emitted count or angle preset, zero length emits no visible layer, and unsupported rooted geometry refuses without rewriting its elevation.
 * @evidence contracts/common.md#meaningful-documentation Members state visible versus clinical scope, metric units, named styling frame/sign, tangent elevation, sampling and reflected finish.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema computes no direction transport or curve integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Seed/profile identity supplies deterministic inputs, not a cached shaft population or sampling result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The document owns scalar authoring values; the allocator enforces actual resource budgets and this type creates no buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceFacialHairProfile {
  /** Number of independently generated visible shafts; the existing hair allocation budget applies. */
  count: number;

  /** Visible root-to-tip length in millimetres; zero records a shaved visible layer. */
  lengthMm: number;

  /** Physical visible shaft diameter in micrometres, converted once to model metres. */
  diameterMicrometres: number;

  /**
   * Authored emergence elevation above the skin tangent plane, in (0,90] degrees.
   * This geometric target is not a clinical follicle-angle interval. Unsupported
   * rooted transitions refuse without changing the requested elevation.
   */
  emergenceAngleDegrees: number;

  /**
   * Authored flow angle in canonical [-180,180] degrees in the neutral head frontal plane.
   * Zero points anatomical inferior; positive rotation points toward anatomical
   * left. The existing reference hair field transports this named-frame direction
   * to the registered surface. This is styling, not measured follicle orientation.
   */
  flowAngleDegrees: number;

  /** Positive curve integration step in millimetres, separate from shaft count and calibre. */
  samplingStepMm: number;

  /** Unsigned deterministic root-population seed. */
  seed: number;

  /** Linear reflected colour and microsurface response of the emitted shafts. */
  finish: IAutoMovieHumanFaceAppearanceParameters.Finish;
}
