/**
 * Source-authored superficial-vein tint and relief with its own attenuation sample region; this is an exterior appearance proxy.
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
