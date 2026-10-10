/**
 * Coarse source-tongue identity in millimetres, independently of its performed
 * motion. Source width, length and height scale its shared closed mesh. Dorsal
 * relief retains the source root and tip and is not an MRI tissue reconstruction.
 * The source's modelled root extent remains distinct from a measured vallecula.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralTongue {
  /** Source transverse body span, positive finite mm. */
  widthMm?: number;

  /** Source anterior-posterior span, positive finite mm. */
  lengthMm?: number;

  /** Source vertical body span, positive finite mm. */
  heightMm?: number;

  /** Additional mid-dorsal superior relief, finite mm, fading to source endpoints. */
  dorsumRiseMm?: number;
}
