/**
 * Source-authored superficial-vein tint and relief with its own attenuation sample region; this is an exterior appearance proxy.
 *
 * @evidence contracts/common.md#principled-implementation A veins discriminator binds colour and optional normal relief, attenuated from declared rest-minus-lean sample vertices.
 * @evidence contracts/common.md#clear-and-simple-design The layer keeps its sample region and per-metre attenuation with its material binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The visible-vein tint remains an exterior proxy rather than internal vessel geometry.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish colour space, normal data and proxy thickness attenuation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The vein appearance overlay has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The vein appearance overlay schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The vein appearance overlay declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyVeinsOverlay {
  /** Closed layer kind. */
  kind: "veins";

  /** Existing skin material receiving the layer. */
  material: string;

  /** sRGB colour and alpha coverage PNG data URI. */
  color: string;

  /** Optional linear tangent-space normal PNG data URI. */
  normal?: string;

  /** Source vertices at which the existing layer owner reads rest-minus-lean thickness. */
  vertices: number[];

  /** Authored attenuation coefficient, per metre, retaining its proxy qualification. */
  attenuation: number;
}
