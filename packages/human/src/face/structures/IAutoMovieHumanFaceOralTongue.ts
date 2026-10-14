/**
 * Coarse source-tongue identity in millimetres, independently of its performed
 * motion. Source width, length and height scale its shared closed mesh. Dorsal
 * relief retains the source root and tip and is not an MRI tissue reconstruction.
 * The source's modelled root extent remains distinct from a measured vallecula.
 *
 * @evidence contracts/common.md#principled-implementation applyHumanFaceOralIdentity scales the existing source tongue about its centroid along head X/Y/Z and adds a squared-sine dorsal rise over original longitudinal progress before articulation.
 * @evidence contracts/common.md#clear-and-simple-design Three independent source extents and one dorsal relief belong to persistent identity; separate tip-performance fields add current displacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied extents need positive finite representable mm and output must remain Float32-finite; centroid scaling does not preserve volume or fixed anatomical insertion, and source posterior extent is not measured vallecula.
 * @evidence contracts/common.md#meaningful-documentation Source-local span axes, relief endpoint fade and MRI/clinical limitations distinguish the coarse authored mesh from internal anatomical reconstruction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The identity record performs no source extent measurement or vertex scaling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Rest/performed sharing is owned by the source pose evaluator, not this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional scalars retain no tongue buffers or muscular simulation state.
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
