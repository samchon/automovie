/**
 * The table a body's skin colour by anatomical site is read through: per site
 * and linear RGB channel, the albedo `exp(a) · cheek^b` as `[a, b]`, and the
 * weights that assign each vertex of the skin to the sites.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Types the site relations a user can read to see how the body's colour follows the face's.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Declares the table form: the coloured material, the per-site channel fits, the site assignment's facing ramps, exposure, sweeps and collar.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinSites {
  /** The material whose regions take the per-vertex colour. */
  material: string;

  /** Per site, `[a, b]` for red, green and blue: `albedo = exp(a) · cheek^b`. */
  sites: Record<
    "protected" | "exposed" | "neck" | "dorsal" | "palmar",
    [number, number][]
  >;

  /** The share of a shank, and of the back of a foot, that is exposed skin. */
  shankExposure: number;

  /**
   * Where a hand vertex's normal, along its bones' flexion direction, turns
   * from the back of the hand (at or below the first value) to the palm (at
   * or above the second), smoothly between.
   */
  palmarFacing: [number, number];

  /** The same for a foot vertex's normal against up: the back of the foot to the sole. */
  soleFacing: [number, number];

  /** Sweeps over which the site weights diffuse, so sites meet softly. */
  sweeps: number;

  /**
   * The band below the open boundary (the neck's cut, where the head joins)
   * over which the colour goes from the cheek's, which the face wears, to the
   * sites', metres.
   */
  collarMetres: number;
}
