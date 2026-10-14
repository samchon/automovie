import type { IAutoMovieHumanFaceLidSectionDisplacement } from "./IAutoMovieHumanFaceLidSectionDisplacement";

/**
 * Independent persistent identity of upper and lower lid sections on one eye.
 *
 * @evidence contracts/common.md#principled-implementation Named optional sections map to registered pretarsal/crease/hood/preseptal cage stations; lowerSubtarsal uses the lower crease station and source identity precedes blink/squint/gaze pose residuals.
 * @evidence contracts/common.md#clear-and-simple-design Independent section records expose superior/anterior displacement without conflating upper identity, lower identity or a global fold grade.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A supplied section requires its complete source row and valid aliases; omitted sections receive no authored offset, and fixed outer/wet attachments do not imply global contact success.
 * @evidence contracts/common.md#meaningful-documentation Each section names its actual cage owner, including the subtarsal representation and independent hood/crease controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no station lookup or displacement pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Persistent identity is declared input, not an evaluated-pose cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional displacement records allocate no resident source or posed mesh buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLidSections {
  /** Margin-to-crease skin section; no global fold-grade to millimetre inference. */
  upperPretarsal?: IAutoMovieHumanFaceLidSectionDisplacement;

  /** Upper crease bank on the actual host cage. */
  upperCrease?: IAutoMovieHumanFaceLidSectionDisplacement;

  /** Overlying upper hood, independent of crease elevation and projection. */
  upperHood?: IAutoMovieHumanFaceLidSectionDisplacement;

  /** Upper preseptal section, with the outer orbital attachment held. */
  upperPreseptal?: IAutoMovieHumanFaceLidSectionDisplacement;

  /** Lower pretarsal section, independent of upper identity. */
  lowerPretarsal?: IAutoMovieHumanFaceLidSectionDisplacement;

  /** Lower subtarsal transition represented by the lower crease station. */
  lowerSubtarsal?: IAutoMovieHumanFaceLidSectionDisplacement;

  /** Lower preseptal section, with the outer orbital attachment held. */
  lowerPreseptal?: IAutoMovieHumanFaceLidSectionDisplacement;
}
