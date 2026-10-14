/**
 * Independent coarse lingual performance, separate from tongue identity and
 * the source jaw channels. Tip offsets fade to zero at the source tongue's
 * posterior extent; tongue identity can still scale the underlying source.
 * The oral assembly judges passage and neighboring enclosure on the actual
 * performed surface. The optional ventral attachment record is not currently
 * consumed by the oral generator.
 * These targets do not simulate muscular recruitment or guarantee volume.
 *
 * @evidence contracts/common.md#principled-implementation applyHumanFaceOralIdentity adds independent superior/anterior/left tip offsets with squared normalized source longitudinal progress, separate from persistent source-tongue scaling and jaw articulation.
 * @evidence contracts/common.md#clear-and-simple-design Three signed tip offsets express coarse performance without duplicating tongue dimensions or supplying private points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite mm offsets and finite Float32 results are required, but the kinematic field does not preserve volume, simulate muscles or validate the currently unconsumed ventral attachment support.
 * @evidence contracts/common.md#meaningful-documentation Anatomical axes, mm units and posterior-source fade identify the actual contribution rather than claiming every anatomical insertion remains anchored.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The performance schema implements no source traversal or passage measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shape-only/performed evaluation belongs to the pose owner, not a cache in the record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three optional offsets acquire no tongue arrays or contact queries.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralPerformance {
  /** Superior tongue-tip lift from source pose, finite mm. */
  tongueTipLiftMm?: number;

  /** Anterior tongue-tip advance from source pose, finite mm. */
  tongueTipAdvanceMm?: number;

  /** Anatomical-left tongue-tip excursion from source pose, finite mm. */
  tongueTipLateralMm?: number;
}
