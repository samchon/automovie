import type { IAutoMovieRecoverySlabObservation } from "../observation/IAutoMovieRecoverySlabObservation";
import type { IAutoMovieRecoverySourceLineage } from "../observation/IAutoMovieRecoverySourceLineage";
import type { IAutoMovieRecoverySections } from "./IAutoMovieRecoverySections";

/** Acquisition-only source topology with newly verified cut addresses and
 * caller-attested saved curve references. No coefficients, source positions,
 * source triangles or normal fields are returned. PL event qualification has
 * the existing source-topology meaning and does not qualify the saved curves.
 *
 * @evidence contracts/common.md#principled-implementation New raw-cut provenance supplies exact ports to the existing clipped-cell and PL critical observers; original saved publication identities remain separate from the independently observed source evidence.
 * @evidence contracts/common.md#clear-and-simple-design One result separates verified source cuts, externally bound symbolic publications and finite slab observations without duplicating or rewriting curve authorities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Raw address/closure agreement is not elevated to coefficient, physical-phase or jet correctness; failed and degenerate ports remain unsupported and no geometry fallback transfers.
 * @evidence contracts/common.md#meaningful-documentation Documents units, original direction/frame, caller identity scope, raw-cut verification, coefficient absence and source-only event qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result performs no fitting or observation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result owns no cache or source preparation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns copied source-address and event metadata; source arrays and saved coefficient buffers are absent.
 */
export interface IAutoMovieRecoverySlabs {
  /** New acquisition identity, independent of saved curve names. */
  name: string;

  /** Caller source identity; this operation does not compute its byte hash. */
  sourceIdentity: string;

  /** Caller registration/selection/original-ordinal identity, compared before cutting. */
  sourceSelectionIdentity: string;

  /** Original caller projection direction, before normalization. */
  axis: IAutoMovieRecoverySections["axis"];

  /** Original caller frame reference, before orthogonal projection. */
  reference: IAutoMovieRecoverySections["reference"];

  /** Actual zero-origin physical projection frame used by cuts and critical events. */
  frame: IAutoMovieRecoverySections["frame"];

  /** Scope of independently checked source-to-publication correspondence. */
  bindingAuthority: "raw-cut-addresses-and-closure-only";

  /** Byte hashing and saved coefficient/selection correctness remain caller obligations. */
  callerBindingRequired: true;

  /** No curve coefficient, degree, rational weight or physical phase was accessed. */
  curveCoefficientsRead: false;

  /** Same-order saved planes with newly recut exact source lineage. */
  sections: Array<{
    /** Original signed plane coordinate, millimetres. */
    coordinateMm: number;
    /** Caller-verified saved artifact identity, retained without hashing. */
    observationIdentity: string;
    /** Fresh broad/exact source addresses with unchanged symbolic publication fields. */
    sourceLineage: IAutoMovieRecoverySourceLineage[];
    /** Raw closure and sample count; failed saved fits have no closure claim to compare. */
    rawContours: Array<{
      contourIndex: number;
      closed: boolean;
      observationCount: number;
      savedClosureCompared: boolean;
    }>;
  }>;

  /** All source components, exact ports, measured PL events and unresolved issues for every requested pair. */
  slabs: IAutoMovieRecoverySlabObservation[];
}
