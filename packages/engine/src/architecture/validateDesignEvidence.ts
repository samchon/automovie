import { IAutoMovieDesignEvidence, IAutoMovieDesignReference, IAutoMovieValidation } from "@automovie/interface";
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
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-manifest-closure `validateDesignEvidence` rejects consumer citations whose reference document or observed candidates do not resolve in the adopted manifest.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-closure `validateDesignEvidence` closes each design consumer relation by resolving its document and candidate ids against the recorded references.
 * @evidence requirements/asset-authoring/era-and-style.md#asset-style-reference-role `validateDesignEvidence` binds each authored consumer to explicit reference candidates and a non-blank rationale, preserving the declared reference role without treating the observation as geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-era-style-inputs The evidence relation supplies the explicit consumer, selected observations, and rationale subset for applying a style reference without inferring scope from proximity.
 */
export const validateDesignEvidence = (props: {
  references: readonly IAutoMovieDesignReference[];
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
