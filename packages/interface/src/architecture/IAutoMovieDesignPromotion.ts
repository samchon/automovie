import { IAutoMovieDesignPromotedReading } from "./IAutoMovieDesignPromotedReading";
import { IAutoMovieDesignSkippedAnalysis } from "./IAutoMovieDesignSkippedAnalysis";
import { IAutoMovieDesignWithholding } from "./IAutoMovieDesignWithholding";

/**
 * The complete, deterministic outcome of asking a reference for metric
 * geometry.
 *
 * Every candidate lands in exactly one of {@link promoted} or {@link withheld},
 * and every analysis that produced nothing is named in {@link skipped}. There is
 * no fourth pile, so a caller cannot mistake silence for agreement.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignPromotion` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignPromotion` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignPromotion {
  /**
   * Readings settled enough to become metric geometry.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `promoted` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `promoted` for the narrative intent reference lineage system contract.
   */
  promoted: IAutoMovieDesignPromotedReading[];

  /**
   * Readings left as observation, each with its blocking reason.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `withheld` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `withheld` for the narrative intent reference lineage system contract.
   */
  withheld: IAutoMovieDesignWithholding[];

  /**
   * Analyses that were unsupported or never run.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `skipped` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `skipped` for the narrative intent reference lineage system contract.
   */
  skipped: IAutoMovieDesignSkippedAnalysis[];
}
