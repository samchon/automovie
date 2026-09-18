import { IAutoMovieDesignPoint } from "./IAutoMovieDesignPoint";

/**
 * One raw mark read from a frame, before any interpretation.
 *
 * A primitive says what is on the sheet, never what it means. Two readers who
 * disagree about a wall still agree about the two lines they both saw, which is
 * what keeps the disagreement recoverable.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieObservedPrimitive` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieObservedPrimitive` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieObservedPrimitive {
  /**
   * Stable primitive identity within the document.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;
  /**
   * Frame this mark was read from.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `frame` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `frame` for the narrative intent reference lineage system contract.
   */
  frame: string;
  /**
   * Raw geometry family exactly as read.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `kind` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `kind` for the narrative intent reference lineage system contract.
   */
  kind: "line" | "arc" | "polyline" | "region" | "text" | "level-marker";
  /**
   * Source-space points. A `line` carries exactly two, an `arc` carries start,
   * through and end, a `polyline` at least two, a closed `region` at least
   * three, and a `text` or `level-marker` exactly one anchor.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `points` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `points` for the narrative intent reference lineage system contract.
   */
  points: IAutoMovieDesignPoint[];
  /**
   * Literal text for `text` and `level-marker`, otherwise null.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `text` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `text` for the narrative intent reference lineage system contract.
   */
  text: string | null;
}
