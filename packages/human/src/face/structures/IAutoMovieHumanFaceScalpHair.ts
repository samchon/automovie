import type { IAutoMovieHumanFaceScalpHairLayer } from "./IAutoMovieHumanFaceScalpHairLayer";

/**
 * Named scalp populations authored without personal coordinates or curves.
 * Empty layers explicitly mean bald. Omission of this section preserves the
 * legacy hairstyle rather than selecting an unrelated population or source.
 * Each layer owns its traits; the shared basis retains source rights and growth
 * registration. Styling inputs do not certify a biological population fit.
 *
 * @evidence contracts/common.md#principled-implementation resolveHumanFaceAppearanceDocument expands a complete named style into the existing numerical hair owner while an explicit empty population requests no scalp locks.
 * @evidence contracts/common.md#clear-and-simple-design One ordered canonical layer array is alternative to a complete legacy hair document; later sparse hairTraits edit only the selected existing populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplying both complete styles refuses, expansion admits the actual numerical layer fields and registered domains, and source rights or biological population calibration do not follow from names/seeds.
 * @evidence contracts/common.md#meaningful-documentation Empty versus omitted styling, eight-layer envelope and shared basis ownership explain the actual authoring alternatives.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The schema performs no trait expansion or deterministic root sampling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared numerical consumption is an ownership contract, not hair geometry caching here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns layer records; no source assets or integrated locks are acquired.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceScalpHair {
  /** Ordered independent populations, at most eight. */
  layers: IAutoMovieHumanFaceScalpHairLayer[];
}
