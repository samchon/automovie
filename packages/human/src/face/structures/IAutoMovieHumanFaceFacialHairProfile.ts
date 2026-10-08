import type { IAutoMovieHumanFaceAppearanceParameters } from "../parameters/IAutoMovieHumanFaceAppearanceParameters";

/**
 * Authored visible terminal shafts at one registered facial site.
 * Count and calibre are numerical production targets, separate from recorded
 * terminal density, follicular units and donor-zone measurements. No clinical
 * normal interval is inferred from those distinct quantities.
 *
 * @evidence contracts/common.md#principled-implementation Metric calibre, named-frame styling and finish are independently admitted before allocation.
 * @evidence contracts/common.md#clear-and-simple-design Each site has one scalar authority for count, length, calibre and sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No private groom or clinical density-derived default enters.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish units, authoring and biological observations.
 * @evidence contracts/modeling.md#parameter-channels Count, calibre, length, angle and sampling retain independent effects.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres, micrometres and degrees convert once to model metres and radians.
 * @evidence contracts/anatomy.md#anatomical-source Authored visible targets are distinct from donor-zone FU observations.
 * @evidence contracts/anatomy.md#parametric-authority Scalar site controls include no personal strands or coordinates.
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
