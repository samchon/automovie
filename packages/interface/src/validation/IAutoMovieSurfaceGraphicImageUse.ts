/**
 * One image a compiled shot's surface graphic shows, with the model of the prop
 * it is shown on.
 *
 * Texture closure resolves `asset` against that model's carried images first;
 * any other id must be a registered project image whose ledger authorizes the
 * `surface-graphic` consumer for `shot`.
 */
export interface IAutoMovieSurfaceGraphicImageUse {
  /** Exact shot id whose surface graphics name the image. */
  shot: string;

  /** Id of the registered model of the prop the graphic is shown on. */
  model: string;

  /** Image id the model carries, or a project asset path. */
  asset: string;
}
