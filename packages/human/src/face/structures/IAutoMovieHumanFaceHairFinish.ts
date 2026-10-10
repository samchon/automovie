/**
 * Numerical fibre appearance for one generated population. These authored linear RGB and coverage controls are shared procedural texture inputs. They supply no measured hair pigmentation, clinical density, private bitmap or rights to a person's reference; the external basis retains its own source rights.
 *
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
