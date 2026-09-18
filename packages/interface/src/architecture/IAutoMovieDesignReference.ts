import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { AutoMovieDesignReferenceMedia } from "./AutoMovieDesignReferenceMedia";
import { IAutoMovieDesignAnalysis } from "./IAutoMovieDesignAnalysis";
import { IAutoMovieDesignIssue } from "./IAutoMovieDesignIssue";
import { IAutoMovieDesignSourceFrame } from "./IAutoMovieDesignSourceFrame";
import { IAutoMovieObservedCandidate } from "./IAutoMovieObservedCandidate";
import { IAutoMovieObservedPrimitive } from "./IAutoMovieObservedPrimitive";

/**
 * One observed design reference: the bytes, how they are read, what was seen,
 * what was proposed, and what remains undecided.
 *
 * This record is evidence and only evidence. The design source of truth stays
 * the TypeScript building source; a reference is cited by it through
 * {@link IAutoMovieDesignEvidence} and never merged into it. A plan image
 * therefore cannot quietly become a wall, because nothing here is a wall.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignReference` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignReference` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignReference {
  /**
   * Schema version.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `version` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `version` for the narrative intent reference lineage system contract.
   */
  version: 1;

  /**
   * Stable document identity within the production.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;

  /**
   * Project-relative manifest asset holding the exact observed bytes.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `asset` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `asset` for the narrative intent reference lineage system contract.
   */
  asset: string;

  /**
   * SHA-256 of those bytes at the moment the observation was made.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `digest` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `digest` for the narrative intent reference lineage system contract.
   */
  digest: AutoMovieContentDigest;

  /**
   * Container family the asset bytes are declared to be.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `media` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `media` for the narrative intent reference lineage system contract.
   */
  media: AutoMovieDesignReferenceMedia;

  /**
   * Pages, sheets, or images read from the asset; at least one.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `frames` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `frames` for the narrative intent reference lineage system contract.
   */
  frames: IAutoMovieDesignSourceFrame[];

  /**
   * Raw marks read from those frames.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `primitives` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `primitives` for the narrative intent reference lineage system contract.
   */
  primitives: IAutoMovieObservedPrimitive[];

  /**
   * Every attempted reading, including the ones that produced nothing.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `analyses` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `analyses` for the narrative intent reference lineage system contract.
   */
  analyses: IAutoMovieDesignAnalysis[];

  /**
   * Semantic proposals over the raw marks.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `candidates` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `candidates` for the narrative intent reference lineage system contract.
   */
  candidates: IAutoMovieObservedCandidate[];

  /**
   * Everything still undecided.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `issues` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `issues` for the narrative intent reference lineage system contract.
   */
  issues: IAutoMovieDesignIssue[];
}
