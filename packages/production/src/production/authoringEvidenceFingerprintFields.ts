import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";

/**
 * Encode the graph-selected source-owner bindings as one build dependency field.
 *
 * Undefined evidence contributes no field; defined evidence with absent sourceOwners encodes an empty array. Only sourceOwners participates, so root, language, declaration prose and other evidence metadata do not become this field's identity.
 *
 * @evidence contracts/common.md#principled-implementation Canonical JSON binds the supplied owner-edge records and array order, with ordinary domain refusals propagated. Graph/evidence admission occurs before this projection; the field does not verify current source bytes or authoring-stage completeness.
 * @evidence contracts/common.md#clear-and-simple-design The single owner-bindings field is shared by timed compile and currentness, leaving broader evidence obligations with their graph and gate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing owner list uses the existing optional-field empty-array contract, not inferred owner registration. No lexical prose grade or checkout-root salt is added.
 * @evidence contracts/common.md#meaningful-documentation Documents undefined-versus-defined empty evidence, included and omitted dependencies, ordering and prior-admission ownership.
 * @evidence contracts/performance.md#efficient-algorithms Canonical traversal/key sorting and output bytes scale with all selected owner fields and strings; at most one field record is allocated but its payload is not constant-size.
 * @evidence contracts/performance.md#reuse-equivalent-work The current owner array is serialized once for this projection; no retained result assumes graph-selected bindings remain unchanged across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned canonical payload until hashing completes; evidence objects are borrowed and no handle or task is acquired.
 */
export function authoringEvidenceFingerprintFields(
  evidence: IAutoMovieProductionEvidence | undefined
): IAutoMovieFingerprintField[] { return evidence === undefined
    ? []
    : [
        {
          role: "source:owner-bindings",
          kind: "application/json",
          payload: canonicalAutoMovieJsonBytes(evidence.sourceOwners ?? []),
        },
      ]; }
