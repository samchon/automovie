import {
  IAutoMovieDesignEvidence,
  type IAutoMovieValidateDesignEvidence,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";

/**
 * Validate authored citations from a normalized design to its evidence.
 *
 * A citation may point at an unsettled reading on purpose: recording that a
 * wall was drawn where two centreline candidates disagree is exactly the
 * accountability this graph exists for. What it may not do is point at nothing.
 * A dangling document, a dangling candidate, or a blank rationale each turn the
 * citation into a decoration that survives the evidence it claims to rest on.
 *
 * A citation also needs at least one candidate, and may cite each (subject,
 * document, candidate) once. A citation whose document does not resolve skips
 * candidate checks, while rationale blank checks still report findings.
 * Findings use `$input.evidence[i]` paths and nothing throws. Two references
 * sharing an id are merged into one candidate set here rather than refused; the
 * production builder reports that collision as `design-reference-duplicate`.
 *
 * @param props.references Observed documents the citations may point at.
 * @param props.evidence Authored citations to judge.
 * @returns Success, or every violation found.
 */
export function validateDesignEvidence(
  props: IAutoMovieValidateDesignEvidence.IProps,
): IAutoMovieValidation {
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const root: string = "$input";
  const byDocument: Map<string, Set<string>> = new Map();
  for (const reference of props.references) {
    let ids: Set<string> | undefined = byDocument.get(reference.id);
    if (ids === undefined) {
      ids = new Set();
      byDocument.set(reference.id, ids);
    }
    for (const candidate of reference.candidates) ids.add(candidate.id);
  }
  const seen: Set<string> = new Set();
  props.evidence.forEach(
    (evidence: IAutoMovieDesignEvidence, index: number): void => {
      const path: string = `${root}.evidence[${index}]`;
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
}
