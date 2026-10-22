import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoverySavedSection } from "./IAutoMovieRecoverySavedSection";
import type { IAutoMovieRecoverySlabPair } from "./IAutoMovieRecoverySlabPair";

/** Reobserve source slabs while referring to existing coefficient publications.
 * Every supplied saved plane is recut once without fitting, and all requested
 * slab components remain present. Source identities are caller assertions: the
 * caller verifies original bytes, registration and selection before this call.
 * Raw-cut equality cannot establish a named curve's geometric correctness.
 *
 * @evidence contracts/common.md#principled-implementation Borrowed registered triangles, a fixed physical projection and saved exact contour addresses define the same deterministic cutter and source-cell problem. Saved section frames and alias policies must match before source work.
 * @evidence contracts/common.md#clear-and-simple-design The input contains source observation and symbolic publication data only; no coefficient payload, basis selector, fit policy, surface recipe or retry capability is present.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source arrays remain private to observation. No source mesh/normal fallback, component selection, arbitrary curve trust, resampling or regenerated normal curve is introduced.
 * @evidence contracts/common.md#meaningful-documentation States coordinate units, original ordinal lifetime, caller provenance responsibility, endpoint coverage and absence of coefficient evaluation or failed-fit resume.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no cutting or fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparation reuse belongs to the observer rather than the type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source arrays remain borrowed and must stay unchanged during the synchronous call.
 */
export interface IAutoMovieRecoverySlabsInput extends Pick<
  IAutoMovieRecoveryInput,
  "verticesMm" | "triangles" | "axis" | "reference" | "exactCoordinateAliases"
> {
  /** Identity of this new acquisition-only observation, not a replacement curve collection. */
  name: string;

  /** Caller-verified original source identity, compared with every saved section. */
  sourceIdentity: string;

  /** Caller-verified registration/selection/original-ordinal identity. */
  sourceSelectionIdentity: string;

  /** Distinct finite saved planes in their preserved section-index order; every supplied plane is recut, including empty and unsupported contours. */
  savedSections: readonly IAutoMovieRecoverySavedSection[];

  /** Nonempty finite increasing pairs whose endpoints both name supplied saved sections. */
  slabPairs: readonly IAutoMovieRecoverySlabPair[];
}
