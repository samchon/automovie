
/**
 * Exact deterministic or selected-repaint member of one sequence observation.
 *
 * @evidence contracts/common.md#principled-implementation The lane union identifies each ordered timeline occurrence by shot and exact deterministic source or selected repaint lineage; canonical member hashing and readback compare every field with the current visual population.
 * @evidence contracts/common.md#clear-and-simple-design Deterministic members need only source identity while repainted members carry request, attempt, output, receipt and active selection identities, avoiding optional fields shared across incompatible lanes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A repeated shot is distinguished by occurrence, and an unselected or obsolete candidate cannot replace the active member merely by retaining its output on disk.
 * @evidence contracts/common.md#meaningful-documentation Defines ordered occurrence membership and the lane-specific source and immutable selection lineage identities used by aggregate review.
 * @author Samchon
 */
export type IAutoMovieRepaintObservationMember =
  | {
      /** Exact position-derived film occurrence identity. */
      occurrence: string;

      /** Current compiled shot at that occurrence. */
      shot: string;

      /** Deterministic source selected independently of repaint candidates. */
      lane: "deterministic";

      /** Current deterministic visual-source identity. */
      sourceDigest: string;
    }
  | {
      /** Exact position-derived film occurrence identity. */
      occurrence: string;

      /** Current compiled shot at that occurrence. */
      shot: string;

      /** Explicit selected-repaint source class. */
      lane: "repainted";

      /** Immutable generation request identity. */
      requestId: string;

      /** Immutable successful attempt identity. */
      attemptId: string;

      /** Exact selected candidate output-byte digest. */
      outputDigest: string;

      /** Canonical immutable candidate receipt digest. */
      candidateReceiptDigest: string;

      /** Active selection record identity. */
      selectionId: string;

      /** Canonical active selection record digest. */
      selectionDigest: string;
    };
