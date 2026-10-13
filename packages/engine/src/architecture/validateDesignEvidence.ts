import {
  IAutoMovieDesignEvidence,
  IAutoMovieDesignReference,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Validate authored citations from a normalized design to its evidence.
 *
 * A citation may point at an unsettled reading on purpose: recording that a
 * wall was drawn where two centreline candidates disagree is exactly the
 * accountability this graph exists for. What it may not do is point at nothing.
 * A dangling document, a dangling candidate, or a blank rationale each turn the
 * citation into a decoration that survives the evidence it claims to rest on.
 *
 * A citation also needs a non-blank subject and at least one candidate, and
 * may cite each (subject, document, candidate) once. A citation whose document
 * does not resolve gets only that finding, since its candidates have nothing to
 * resolve against. Findings are returned with `$input.evidence[i]` paths and
 * nothing throws. Two references sharing an id are merged into one candidate
 * set here rather than refused; the production builder reports that collision
 * as `design-reference-duplicate`.
 *
 * @param props.references Observed documents the citations may point at.
 * @param props.evidence Authored citations to judge.
 * @returns Success, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Resolves each citation through a document-to-candidate-set index, and detects repeats by a key serialized as a JSON array, which cannot collide for distinct (subject, document, candidate) triples whatever characters the ids contain.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the citation contract between the building source and observed references; blank strings use the collector's shared rule, and duplicate reference ids are left to the production builder that owns the document set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document, subject or candidate is special-cased; competing readings may be cited together by design, and merging same-id references is a documented choice whose collision another layer reports.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what a citation may and may not point at and why, every rule, what an unresolved document suppresses, the path root, that nothing throws, and how duplicate reference ids are treated.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the total candidates of all references plus the total cited candidates: one index build and one set lookup per citation entry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A validation of one citation list per call that coordinates no shared work across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The document index and the seen-key set are local and released on return, bounded by the candidate and citation counts; the returned validation holds the findings.
 */
export const validateDesignEvidence = (props: {
  /** Observed documents the citations may point at, keyed by their `id`. */
  references: readonly IAutoMovieDesignReference[];

  /** Authored citations from building subjects to observed candidates. */
  evidence: readonly IAutoMovieDesignEvidence[];
}): IAutoMovieValidation => {
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";
  const byDocument: Map<string, Set<string>> = new Map();
  for (const reference of props.references) {
    let ids: Set<string> | undefined = byDocument.get(reference.id);
    if (ids === undefined) {
      ids = new Set();
      byDocument.set(reference.id, ids);
    }
    for (const candidate of reference.candidates)
      ids.add(candidate.id);
  }
  const seen: Set<string> = new Set();
  props.evidence.forEach(
    (evidence: IAutoMovieDesignEvidence, index: number): void => {
      const path: string = `${root}.evidence[${index}]`;
      out.nonEmpty(`${path}.subject`, evidence.subject, "evidence subject");
      out.nonEmpty(
        `${path}.rationale`,
        evidence.rationale,
        "evidence rationale",
      );
      const candidates: Set<string> | undefined = byDocument.get(
        evidence.document,
      );
      if (candidates === undefined) {
        out.push(
          "type",
          `${path}.document`,
          `evidence document "${evidence.document}" does not resolve`,
          evidence.document,
        );
        return;
      }
      if (evidence.candidates.length === 0)
        out.push(
          "range",
          `${path}.candidates`,
          "an evidence citation must name at least one observed candidate",
          evidence.candidates,
        );
      evidence.candidates.forEach(
        (candidate: string, candidateIndex: number): void => {
          const candidatePath: string = `${path}.candidates[${candidateIndex}]`;
          if (!candidates.has(candidate))
            out.push(
              "type",
              candidatePath,
              `evidence candidate "${candidate}" does not resolve in document "${evidence.document}"`,
              candidate,
            );
          // Serialized as an array rather than joined with a separator: any
          // separator character an id could itself contain would let two
          // distinct citations collide on one key.
          const key: string = JSON.stringify([
            evidence.subject,
            evidence.document,
            candidate,
          ]);
          if (seen.has(key))
            out.push(
              "type",
              candidatePath,
              `evidence for "${evidence.subject}" repeats candidate "${candidate}"`,
              candidate,
            );
          seen.add(key);
        },
      );
    },
  );
  return out.toValidation();
};
