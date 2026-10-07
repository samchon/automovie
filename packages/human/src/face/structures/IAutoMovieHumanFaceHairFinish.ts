/**
 * Numerical fibre appearance for one generated population. These authored linear RGB and coverage controls are shared procedural texture inputs. They supply no measured hair pigmentation, clinical density, private bitmap or rights to a person's reference; the external basis retains its own source rights.
 *
 * @evidence contracts/common.md#principled-implementation Named traits retain their independent units and neutral meaning without per-strand coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One record owns one styling responsibility and the expander owns its unit conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person, clinical reconstruction or private geometry is selected.
 * @evidence contracts/common.md#meaningful-documentation Each trait states its units and the description states the scientific limitation.
 * @evidence contracts/modeling.md#parameter-channels Independent traits preserve their stated neutral or absolute styling meaning.
 * @evidence contracts/modeling.md#spatial-conventions Lengths use millimetres, angles use degrees and appearance uses dimensionless linear RGB fractions; the expander converts once.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The population layer owns the hair part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The hair builder emits the population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Shared growth-domain registration owns attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair assembly observes the realised styling.
 * @evidence contracts/anatomy.md#anatomical-source Values are authored styling targets without a measured biological population or acquisition protocol; clinical calibration is unknown.
 * @evidenceExclude contracts/anatomy.md#permitted-range Runtime admission checks numerical styling constraints, not physiological bounds.
 * @evidence contracts/anatomy.md#parametric-authority Only named lengths, angles, closed choices and appearance scalars enter; no personal curve or vertex enters.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairFinish {
  /** Linear RGB fibre albedo, each channel in [0,1]. */
  color: [number, number, number];

  /** Surface roughness in [0,1]. */
  roughness: number;

  /** Painted fibres per ribbon, integral in [1,32]; independent of root count. */
  fibres: number;

  /** Painted coverage fraction in [0.1,1]; does not alter ribbon geometry. */
  coverage: number;

  /** Procedural fibre normal strength in [0,1]. */
  normal: number;

  /** Procedural fibre shade strength in [0,1]. */
  shade: number;

  /** Unpigmented fraction in [0,1]; omitted means zero. */
  grey?: number;

}
