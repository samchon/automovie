import { IAutoMovieDesignPromotion, IAutoMovieDesignReference, IAutoMovieDesignWithholding } from "@automovie/interface";
import { designFrameScale } from "./designFrameScale";
import { designReferenceWorldPoint } from "./designReferenceWorldPoint";
import { validateDesignReference } from "./validateDesignReference";

/** Primitive families that carry promotable metric geometry. */
const GEOMETRIC_PRIMITIVES = new Set(["line", "polyline", "region"]);

/**
 * Ask one reference for metric geometry, and get back what it can honestly
 * give.
 *
 * This is the only path from an observation to metres, and it is deliberately
 * refusing by default. A candidate is promoted only when a settled frame scale
 * exists, an `observed` analysis actually produced it, no competing reading is
 * recorded, no issue about it is still open, its confidence clears the caller's
 * floor, and every primitive it reads carries geometry at all. Anything else
 * lands in `withheld` with the exact reason, and every analysis that produced
 * nothing lands in `skipped` carrying its own `unsupported` or `not-run` word.
 *
 * The result is therefore never a design. It is a proposal the authored
 * building source may accept, reject, or contradict; the source of truth stays
 * the TypeScript that a human and a coding agent wrote.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `promoteDesignObservations` promotes only settled reference candidates into metric geometry and reports why unresolved readings remain withheld. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `promoteDesignObservations` converts settled frame readings to metres while preserving diagnostics for ambiguous or unscaled candidates.
 * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-disagreement-and-resolution `promoteDesignObservations` withholds candidates that retain competing interpretations or open issues and reports the exact unresolved identities instead of selecting one silently.
 * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-disagreement-resolution The promotion boundary preserves unresolved disagreement as a refusal; authorized resolution history remains outside this Engine helper.
 */
export const promoteDesignObservations = (props: {
  reference: IAutoMovieDesignReference;
  /**
   * Inclusive confidence floor in `[0, 1]`. Defaults to `1`, so nothing but a
   * certain reading promotes unless the caller consciously lowers the bar.
   */
  minimumConfidence?: number;
}): IAutoMovieDesignPromotion => {
  const validated = validateDesignReference({ reference: props.reference });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design reference "${props.reference.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  const floor = props.minimumConfidence ?? 1;
  if (!Number.isFinite(floor) || floor < 0 || floor > 1)
    throw new Error(
      `design reference "${props.reference.id}" cannot be promoted at confidence floor ${floor}: a floor is a finite number within [0, 1].`,
    );

  const reference = props.reference;
  const frames = new Map(reference.frames.map((frame) => [frame.id, frame]));
  const primitives = new Map(
    reference.primitives.map((primitive) => [primitive.id, primitive]),
  );
  const openIssues = new Set(
    reference.issues.filter((issue) => issue.open).map((issue) => issue.id),
  );
  const producedBy = new Map<string, string>();
  const promotion: IAutoMovieDesignPromotion = {
    promoted: [],
    withheld: [],
    skipped: [],
  };
  reference.analyses.forEach((analysis) => {
    if (analysis.outcome.status === "observed")
      analysis.outcome.candidates.forEach((candidate) =>
        producedBy.set(candidate, analysis.id),
      );
    else
      promotion.skipped.push({
        analysis: analysis.id,
        status: analysis.outcome.status,
        reason: analysis.outcome.reason,
      });
  });

  reference.candidates.forEach((candidate) => {
    const withhold = (
      reason: IAutoMovieDesignWithholding["reason"],
      detail: string,
    ): void => {
      promotion.withheld.push({ candidate: candidate.id, reason, detail });
    };
    if (!producedBy.has(candidate.id)) {
      withhold(
        "unobserved",
        `Candidate "${candidate.id}" is produced by no analysis whose outcome is "observed".`,
      );
      return;
    }
    if (candidate.alternatives.length > 0) {
      withhold(
        "ambiguous-candidate",
        `Candidate "${candidate.id}" competes with ${candidate.alternatives.join(", ")}; settle the reading in the building source instead of promoting one arbitrarily.`,
      );
      return;
    }
    const blocking = candidate.issues.filter((issue) => openIssues.has(issue));
    if (blocking.length > 0) {
      withhold(
        "open-issue",
        `Candidate "${candidate.id}" is blocked by open issue ${blocking.join(", ")}.`,
      );
      return;
    }
    if (candidate.confidence < floor) {
      withhold(
        "low-confidence",
        `Candidate "${candidate.id}" reads at confidence ${candidate.confidence}, below the required ${floor}.`,
      );
      return;
    }
    const marks = candidate.primitives.map((id) => primitives.get(id)!);
    const ungeometric = marks.find(
      (primitive) => !GEOMETRIC_PRIMITIVES.has(primitive.kind),
    );
    if (ungeometric !== undefined) {
      withhold(
        "unsupported-geometry",
        `Candidate "${candidate.id}" reads "${ungeometric.kind}" primitive "${ungeometric.id}", which carries no metric outline.`,
      );
      return;
    }
    const unscaled = marks.find(
      (primitive) => designFrameScale(frames.get(primitive.frame)!) === null,
    );
    if (unscaled !== undefined) {
      withhold(
        "unknown-scale",
        `Frame "${unscaled.frame}" has no settled scale, so candidate "${candidate.id}" cannot become metres.`,
      );
      return;
    }
    promotion.promoted.push({
      candidate: candidate.id,
      semantic: candidate.semantic,
      outlines: marks.map((primitive) =>
        primitive.points.map((point) =>
          designReferenceWorldPoint(frames.get(primitive.frame)!, point),
        ),
      ),
    });
  });
  return promotion;
};
