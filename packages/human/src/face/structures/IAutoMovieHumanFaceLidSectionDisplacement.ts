/**
 * Independent authored displacement of one registered lid section.
 *
 * @evidence contracts/common.md#principled-implementation applyHumanFaceLidSections converts superior/anterior mm offsets once to source metres and applies its normalized sine row envelope before articulation.
 * @evidence contracts/common.md#clear-and-simple-design Two signed independent centre offsets express persistent section identity without a fold-grade-to-distance conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer requires finite values, complete registered cage rows and Float32-representable output; actual assembled admission still judges the displaced geometry.
 * @evidence contracts/common.md#meaningful-documentation Anatomical axes, millimetre units and fixed canthal joins state the intended coarse source-section control rather than a clinical measurement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The displacement record does not traverse cage rows or alter positions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source aliases and pose reuse are consumer-owned; this interface caches no geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two caller scalars acquire no skin buffer or articulation state.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLidSectionDisplacement {
  /** Signed superior displacement at the section centre, mm; joins remain exact. */
  elevationMm: number;

  /** Signed anterior displacement at the section centre, mm; joins remain exact. */
  projectionMm: number;
}
