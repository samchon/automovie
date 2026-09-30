/**
 * The table a body's skin colour by anatomical site is read through: per site
 * and linear RGB channel, the albedo `exp(a) · cheek^b` as `[a, b]`, and the
 * weights that assign each vertex of the skin to the sites.
 *
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

  /**
   * The skin over a joint's extension side, darker and redder than the skin
   * around it where it lies wrinkled over the bone with the joint straight,
   * and nearer the skin around it as flexion stretches it: the olecranon
   * over the elbow and the patella over the knee. Each multiplies the site
   * albedo there, per linear RGB channel, by its `extended` ratio with the
   * joint at zero flexion, turning linearly to its `folded` ratio by
   * `foldedAtDegrees` and held past it. The region is a Gaussian of the
   * axial distance from the joint centre over `sigmaMetres`, within
   * `reachMetres` of the bone's axis, on the side the extension faces,
   * diffused with the site weights.
   */
  prominences: IAutoMovieHumanBodySkinSites.IProminence[];

  /** Sweeps over which the site weights diffuse, so sites meet softly. */
  sweeps: number;

  /**
   * The band below the open boundary (the neck's cut, where the head joins)
   * over which the colour goes from the cheek's, which the face wears, to the
   * sites', metres.
   */
  collarMetres: number;
}
export namespace IAutoMovieHumanBodySkinSites {
  /** One joint's extension-side skin. */
  export interface IProminence {
    /** The distal bone of the joint without its side, on both sides: `LowerArm` is the elbow. */
    bone: string;

    /** Width along the bone, metres. */
    sigmaMetres: number;

    /** Distance from the bone's axis within which skin is the joint's, metres. */
    reachMetres: number;

    /** Linear RGB albedo ratio to the surrounding site with the joint straight. */
    extended: [number, number, number];

    /** The ratio with the joint folded. */
    folded: [number, number, number];

    /** Flexion at which the skin reads as folded, degrees. */
    foldedAtDegrees: number;
  }
}
