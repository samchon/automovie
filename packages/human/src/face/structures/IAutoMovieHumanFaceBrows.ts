import type { IAutoMovieHumanFaceBrowPopulation } from "./IAutoMovieHumanFaceBrowPopulation";

/**
 * Independent numerical populations for the registered left and right brow bands.
 *
 * Omission of the whole document section selects the population owner's
 * defaults for registered sides through resolveHumanFaceBrows. An explicit
 * sparse section retains its selection; an omitted side requests no numerical
 * replacement of that side's source cards.
 *
 * @evidence contracts/common.md#principled-implementation Independent source-registered left/right numerical populations preserve whole-section omission's conventional defaults versus explicit sparse selection's unchanged supplied values.
 * @evidence contracts/common.md#clear-and-simple-design Two optional side owners reuse BrowPopulation; resolveHumanFaceBrows owns the single omission/default decision and cloning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted side of an explicit section gets no contralateral/default reconstruction and registered bands do not establish clinical shaft measurements.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes whole omission from sparse section presence and members identify anatomical side and source-card retention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This grouping performs no default resolution or brow generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared population type defines no geometry cache; conventional defaults are cloned by the resolver.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The personal document owns each selected population and the type opens no source or fibre resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBrows {
  /** Anatomical left population; omission in an explicit section retains source cards. */
  left?: IAutoMovieHumanFaceBrowPopulation;

  /** Anatomical right population, independent of the left request. */
  right?: IAutoMovieHumanFaceBrowPopulation;
}
