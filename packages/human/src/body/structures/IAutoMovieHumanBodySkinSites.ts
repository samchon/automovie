import type { IAutoMovieHumanBodySkinSiteProminence } from "./IAutoMovieHumanBodySkinSiteProminence";

/**
 * The table a body's skin colour by anatomical site is read through: per site
 * and linear RGB channel, the albedo `exp(a) · cheek^b` as `[a, b]`, and the
 * weights that assign each vertex of the skin to the sites.
 *
 * @evidence contracts/common.md#principled-implementation Named anatomical site transforms and geometric weights map a shared cheek reference to linear per-vertex colour.
 * @evidence contracts/common.md#clear-and-simple-design The table groups site coefficients, pose prominence factors and boundary blending parameters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Site and prominence transforms are authored appearance relations, not a photographed individual's skin measurements.
 * @evidence contracts/common.md#meaningful-documentation Members give the exponential albedo equation, facing transitions, metre scales and pose interpolation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The anatomical skin site table is a data type with no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The anatomical skin site table declaration performs no request coordination or result sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The anatomical skin site table schema owns no runtime resource acquisition or release.
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
  prominences: IAutoMovieHumanBodySkinSiteProminence[];

  /** Sweeps over which the site weights diffuse, so sites meet softly. */
  sweeps: number;

  /**
   * The band below the open boundary (the neck's cut, where the head joins)
   * over which the colour goes from the cheek's, which the face wears, to the
   * sites', metres.
   */
  collarMetres: number;
}
