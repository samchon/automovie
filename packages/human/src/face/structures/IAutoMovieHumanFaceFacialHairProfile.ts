import type { IAutoMovieHumanFaceAppearanceParameters } from "../parameters/IAutoMovieHumanFaceAppearanceParameters";

/**
 * Authored visible terminal shafts at one registered facial site.
 * Count and calibre are numerical production targets, separate from recorded
 * terminal density, follicular units and donor-zone measurements. No clinical
 * normal interval is inferred from those distinct quantities.
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
