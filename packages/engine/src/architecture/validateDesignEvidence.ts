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
 * may cite each (subject, document, candidate) once. Findings are returned
 * with `$input.evidence[i]` paths and nothing throws. Two references sharing
 * an id are merged into one candidate set here rather than refused; the
 * production builder reports that collision as `design-reference-duplicate`.
 *
 * @evidence contracts/common.md#principled-implementation Indexes candidate ids by document id, then checks each citation's text fields, document, candidate list and candidate resolution; repeats are keyed by `JSON.stringify` of the (subject, document, candidate) triple, so no character inside an id can forge a collision.
 * @evidence contracts/common.md#clear-and-simple-design Judges citations only and leaves each reference's internal consistency to `validateDesignReference`, which the production gate runs on every document beside this call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Citing an unsettled or ambiguous candidate is allowed by contract, because recording a disputed reading is the point; once a citation's document fails to resolve its candidates are not checked, so one dangling document yields one finding.
 * @evidence contracts/common.md#meaningful-documentation States why an unsettled citation is allowed, every refusal, the returned paths, and how duplicate reference ids are treated here and where they are reported.
 * @evidence contracts/performance.md#cost-and-resources Linear in the total candidates over all references plus the candidates over all citations, with set lookups and one JSON key per cited candidate; nothing is cached across calls, and the index and key set are released when the violations are returned.
 */
export const validateDesignEvidence = (props: {
  /** Observed documents the citations may point at, keyed by their `id`. */
  references: readonly IAutoMovieDesignReference[];

  /** Authored citations from building subjects to observed candidates. */
  evidence: readonly IAutoMovieDesignEvidence[];
}): IAutoMovieValidation => {
  const out = new ViolationCollector();
  const root = "$input";
  const byDocument = new Map<string, Set<string>>();
  props.references.forEach((reference) => {
    const ids = byDocument.get(reference.id);
    const candidates = new Set(
      reference.candidates.map((candidate) => candidate.id),
    );
    if (ids === undefined) byDocument.set(reference.id, candidates);
    else for (const id of candidates) ids.add(id);
  });
  const seen = new Set<string>();
  props.evidence.forEach((evidence, index) => {
    const path = `${root}.evidence[${index}]`;
    nonEmpty(evidence.subject, `${path}.subject`, "evidence subject", out);
    nonEmpty(
      evidence.rationale,
      `${path}.rationale`,
      "evidence rationale",
      out,
    );
    const candidates = byDocument.get(evidence.document);
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
    evidence.candidates.forEach((candidate, candidateIndex) => {
      const candidatePath = `${path}.candidates[${candidateIndex}]`;
      if (!candidates.has(candidate))
        out.push(
          "type",
          candidatePath,
          `evidence candidate "${candidate}" does not resolve in document "${evidence.document}"`,
          candidate,
        );
      // Serialized as an array rather than joined with a separator: any
      // separator character an id could itself contain would let two distinct
      // citations collide on one key.
      const key = JSON.stringify([
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
    });
  });
  return out.toValidation();
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    out.push("type", path, `${label} must be non-empty`, value);
};
