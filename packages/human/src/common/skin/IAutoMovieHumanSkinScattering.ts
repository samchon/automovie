/**
 * Renderer diffusion distances per linear RGB primary, in metres.
 * These radii are appearance parameters, not individually observed photon
 * paths or a calibrated measurement of personal tissue.
 *
 * @evidence contracts/common.md#principled-implementation One distance per primary is the form a renderer's diffusion profile and the material's `subsurfaceRadius` take.
 * @evidence contracts/common.md#clear-and-simple-design Three numbers with one unit.
 * @evidence contracts/common.md#meaningful-documentation States the quantity and its unit.
 * @evidence contracts/modeling.md#spatial-conventions Metres, linear sRGB primaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries three explicit renderer distances; it supplies no inferred personal tissue values.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Material diffusion coefficients introduce no anatomical part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries material appearance distances rather than a shape or motion channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The material renderer consumes these values; this record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanSkinFinish and its consumers own cross-surface finish agreement; this value record joins no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming face/body assembly owns optical appearance observation; these radii supply no observed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Generic renderer radius representation supplies no acquired anatomical quantity; HUMAN_SKIN_FINISH documents the shared default's source and derivation.
 * @evidenceExclude contracts/anatomy.md#permitted-range No clinical or population bounds are declared for these renderer distances.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Diffusion radii author appearance, not a reconstruction or measurement of tissue geometry.
 * @author Samchon
 */
export interface IAutoMovieHumanSkinScattering {
  /** Red primary, metres. */
  r: number;

  /** Green primary, metres. */
  g: number;

  /** Blue primary, metres. */
  b: number;
}
