/**
 * Coarse source-tongue identity in millimetres, independently of its performed
 * motion. Source width, length and height scale its shared closed mesh. Dorsal
 * relief retains the source root and tip and is not an MRI tissue reconstruction.
 * The source's modelled root extent remains distinct from a measured vallecula.
 *
 * @evidence contracts/common.md#principled-implementation Named source extents retain an authored closed body without accepting personal sections or vertices.
 * @evidence contracts/common.md#clear-and-simple-design Three extents and one dorsal relief.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source extents and authored relief are not presented as MRI volume or hidden muscular roots.
 * @evidence contracts/common.md#meaningful-documentation States identity, source extent and acquisition limits.
 * @evidence contracts/modeling.md#parameter-channels Width, anterior-posterior length, height and dorsal relief are independent authored traits.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the source-neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The tongue producer owns its part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The source tongue supplies the mesh population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The oral assembly admits its neighboring space and contacts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the performed tongue and enclosure.
 * @evidence contracts/anatomy.md#anatomical-source The licensed source's visible closed tongue body supplies the form; the root and dorsal relief remain authored conventions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The oral producer and contact owner admit combinations.
 * @evidence contracts/anatomy.md#parametric-authority Only named lingual dimensions enter, never a free section or mesh.
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
