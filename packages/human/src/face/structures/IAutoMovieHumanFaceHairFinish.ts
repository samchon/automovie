/**
 * Numerical fibre appearance for one generated population. These authored linear RGB and coverage controls are shared procedural texture inputs. They supply no measured hair pigmentation, clinical density, private bitmap or rights to a person's reference; the external basis retains its own source rights.
 *
 * @evidence contracts/common.md#principled-implementation createPortraitHairTexture passes explicit colour, painted-fibre count, coverage, shade, normal and unpigmented mixture to the shared procedural fibre texture rather than loading a personal bitmap.
 * @evidence contracts/common.md#clear-and-simple-design Optical appearance remains separate from layer root count, calibre and integration fields; coverage alters painted fibres rather than ribbon geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts assertHumanFaceHair checks the declared colour/roughness/coverage envelopes; the painted mixture is an authored appearance model, not clinical density, source-rights admission or measured greying progression.
 * @evidence contracts/common.md#meaningful-documentation Linear channels, integral painted-fibre count and optional-zero grey fraction prevent confusion with follicles or geometric strands.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no pixel painting or material construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Procedural texture reuse belongs to its consumer, not this appearance schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record creates no images or GPU textures and owns only caller data.
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
