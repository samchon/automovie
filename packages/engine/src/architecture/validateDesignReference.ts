import { IAutoMovieDesignReference, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { AUTO_MOVIE_DESIGN_ISSUE_KINDS } from "./AUTO_MOVIE_DESIGN_ISSUE_KINDS";
import { AUTO_MOVIE_DESIGN_REFERENCE_MEDIA } from "./AUTO_MOVIE_DESIGN_REFERENCE_MEDIA";
import { isAutoMovieDesignReferenceMedia } from "./isAutoMovieDesignReferenceMedia";

/**
 * Validate one observed design reference as evidence.
 *
 * The record is checked as a self-consistent observation, never as a design: a
 * frame states how its own units are read, a primitive states what was on the
 * sheet, a candidate states one proposed meaning, and an issue states what is
 * still undecided. The validator's whole job is to keep those four layers from
 * collapsing into each other, because the moment an observation is allowed to
 * carry a conclusion, the design source of truth has been silently replaced.
 *
 * So it refuses a candidate that cites a primitive nobody saw, an issue about
 * nothing, an analysis that claims `observed` while producing no reading, and
 * an analysis that claims `unsupported` or `not-run` while carrying one. It
 * also refuses a settled scale that names no recorded candidate: an unknown
 * scale is a fact about the drawing, and inventing one is how a plan image
 * turns into metres nobody measured.
 *
 * The same principle binds an analysis to the one frame it says it read: a
 * candidate built from marks on another sheet was not produced by this reading,
 * and filing it here would let a section's geometry inherit a plan's scale.
 * Correlating two sheets is the authored building's job, through evidence that
 * may cite any candidate of any document.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-manifest-closure `validateDesignReference` rejects a reference whose source asset, digest, frames, or observed readings do not form a self-consistent manifest.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-closure `validateDesignReference` checks the source identity, content digest, declared frames, and frame-local observations needed to reconstruct an adopted reference.
 * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-observation-conditions `validateDesignReference` binds each observed primitive and analysis to a declared source frame, its bounds, scale state, and exact candidate outputs.
 * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-observation-record-contract The design-reference validator enforces the Engine's frame-local observation inputs and observed, unsupported, or not-run outputs without turning them into design facts.
 * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-claim-basis `validateDesignReference` requires each candidate interpretation to cite observed primitives and retain confidence, alternatives, and unresolved issue identities.
 * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-claim-evaluation-contract The candidate record preserves the Engine's concrete observation basis and uncertainty fields; it does not claim human approval or a general claim ledger.
 * @evidence requirements/interior/existing-conditions-phases-and-alternatives.md#interior-existing-survey-uncertainty `validateDesignReference` preserves source frames, scale state, confidence, alternative readings, unresolved issues, and observed, unsupported, or not-run outcomes without promoting them to design facts.
 * @evidence specifications/interior-space/construction-phases-and-alternatives.md#interior-space-existing-condition-uncertainty The validator implements the recorded-observation and unsettled-reading subset without claiming surveyed confirmation or building phase authority.
 */
export const validateDesignReference = (props: {
  reference: IAutoMovieDesignReference;
}): IAutoMovieValidation => {
  const { reference } = props;
  const out = new ViolationCollector();
  const root = "$input";

  nonEmpty(reference.id, `${root}.id`, "design reference id", out);
  if (reference.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `design reference schema version must be 1, but was ${reference.version}`,
      reference.version,
    );
  nonEmpty(reference.asset, `${root}.asset`, "design reference asset", out);
  if (!DIGEST_PATTERN.test(reference.digest))
    out.push(
      "type",
      `${root}.digest`,
      `design reference digest must be a lowercase "sha256:" hex digest, but was ${String(reference.digest)}`,
      reference.digest,
    );
  if (!isAutoMovieDesignReferenceMedia(reference.media))
    out.push(
      "type",
      `${root}.media`,
      `design reference media must be one of ${AUTO_MOVIE_DESIGN_REFERENCE_MEDIA.join(", ")}, but was ${String(reference.media)}`,
      reference.media,
    );

  if (reference.frames.length === 0)
    out.push(
      "range",
      `${root}.frames`,
      "a design reference must read at least one frame",
      reference.frames,
    );
  const frameIds = collectIds(
    reference.frames,
    `${root}.frames`,
    "source frame",
    out,
  );
  reference.frames.forEach((frame, index) =>
    validateFrame(frame, `${root}.frames[${index}]`, out),
  );

  const framesById = new Map(
    reference.frames.map((frame) => [frame.id, frame]),
  );
  const frameOfPrimitive = new Map(
    reference.primitives.map((primitive) => [primitive.id, primitive.frame]),
  );
  const primitiveIds = collectIds(
    reference.primitives,
    `${root}.primitives`,
    "observed primitive",
    out,
  );
  reference.primitives.forEach((primitive, index) => {
    const path = `${root}.primitives[${index}]`;
    const owner = framesById.get(primitive.frame);
    if (owner === undefined)
      out.push(
        "type",
        `${path}.frame`,
        `observed primitive frame "${primitive.frame}" does not resolve`,
        primitive.frame,
      );
    const shape = PRIMITIVE_POINTS[primitive.kind];
    if (shape === undefined)
      out.push(
        "type",
        `${path}.kind`,
        `unknown observed primitive kind "${String(primitive.kind)}"`,
        primitive.kind,
      );
    else if (
      primitive.points.length < shape.min ||
      primitive.points.length > shape.max
    )
      out.push(
        "range",
        `${path}.points`,
        `a "${primitive.kind}" primitive carries ${shape.min === shape.max ? `exactly ${shape.min}` : `at least ${shape.min}`} points, but had ${primitive.points.length}`,
        primitive.points.length,
      );
    primitive.points.forEach((point, pointIndex) => {
      for (const axis of ["x", "y"] as const) {
        if (!Number.isFinite(point[axis])) {
          out.push(
            "range",
            `${path}.points[${pointIndex}].${axis}`,
            `observed point ${axis} must be finite, but was ${point[axis]}`,
            point[axis],
          );
          continue;
        }
        // A mark outside the sheet it was read from was not on the sheet. The
        // check is here rather than in the frame because the frame states its
        // own extent honestly; it is the reading that has to stay inside it.
        if (owner === undefined) continue;
        const limit = axis === "x" ? owner.bounds.width : owner.bounds.height;
        if (point[axis] < 0 || point[axis] > limit)
          out.push(
            "range",
            `${path}.points[${pointIndex}].${axis}`,
            `observed point ${axis} must lie inside the ${owner.bounds.width}x${owner.bounds.height} extent of frame "${owner.id}", but was ${point[axis]}`,
            point[axis],
          );
      }
    });
    const literal =
      primitive.kind === "text" || primitive.kind === "level-marker";
    if (literal && (primitive.text === null || primitive.text.trim() === ""))
      out.push(
        "type",
        `${path}.text`,
        `a "${primitive.kind}" primitive must carry the literal text it read`,
        primitive.text,
      );
    if (!literal && primitive.text !== null)
      out.push(
        "type",
        `${path}.text`,
        `a "${String(primitive.kind)}" primitive carries no literal text`,
        primitive.text,
      );
  });

  const issueIds = collectIds(
    reference.issues,
    `${root}.issues`,
    "design issue",
    out,
  );
  const candidateIds = collectIds(
    reference.candidates,
    `${root}.candidates`,
    "observed candidate",
    out,
  );
  const candidatesById = new Map(
    reference.candidates.map((candidate) => [candidate.id, candidate]),
  );

  reference.candidates.forEach((candidate, index) => {
    const path = `${root}.candidates[${index}]`;
    nonEmpty(candidate.semantic, `${path}.semantic`, "candidate semantic", out);
    if (candidate.primitives.length === 0)
      out.push(
        "range",
        `${path}.primitives`,
        "an observed candidate must read at least one primitive",
        candidate.primitives,
      );
    validateReferences(
      candidate.primitives,
      primitiveIds,
      `${path}.primitives`,
      "observed primitive",
      out,
    );
    out.range(
      `${path}.confidence`,
      candidate.confidence,
      0,
      1,
      "candidate confidence",
    );
    const alternativesSeen = new Set<string>();
    candidate.alternatives.forEach((alternative, alternativeIndex) => {
      const alternativePath = `${path}.alternatives[${alternativeIndex}]`;
      if (!candidateIds.has(alternative))
        out.push(
          "type",
          alternativePath,
          `alternative candidate "${alternative}" does not resolve`,
          alternative,
        );
      if (alternative === candidate.id)
        out.push(
          "type",
          alternativePath,
          `candidate "${candidate.id}" cannot be its own alternative`,
          alternative,
        );
      // A rival listed twice turns one disagreement into two. The list is also
      // read back verbatim when a promotion explains what it withheld, so the
      // repeat resurfaces as a refusal naming the same candidate twice.
      if (alternativesSeen.has(alternative))
        out.push(
          "type",
          alternativePath,
          `alternative candidate "${alternative}" is duplicated`,
          alternative,
        );
      alternativesSeen.add(alternative);
    });
    validateReferences(
      candidate.issues,
      issueIds,
      `${path}.issues`,
      "design issue",
      out,
    );
  });

  reference.issues.forEach((issue, index) => {
    const path = `${root}.issues[${index}]`;
    if (
      !(AUTO_MOVIE_DESIGN_ISSUE_KINDS as readonly string[]).includes(issue.kind)
    )
      out.push(
        "type",
        `${path}.kind`,
        `unknown design issue kind "${String(issue.kind)}"`,
        issue.kind,
      );
    nonEmpty(issue.detail, `${path}.detail`, "design issue detail", out);
    if (issue.subjects.length === 0)
      out.push(
        "range",
        `${path}.subjects`,
        "a design issue must name at least one primitive or candidate",
        issue.subjects,
      );
    const subjectsSeen = new Set<string>();
    issue.subjects.forEach((subject, subjectIndex) => {
      const subjectPath = `${path}.subjects[${subjectIndex}]`;
      if (!primitiveIds.has(subject) && !candidateIds.has(subject))
        out.push(
          "type",
          subjectPath,
          `design issue subject "${subject}" resolves to no primitive or candidate`,
          subject,
        );
      if (subjectsSeen.has(subject))
        out.push(
          "type",
          subjectPath,
          `design issue subject "${subject}" is duplicated`,
          subject,
        );
      subjectsSeen.add(subject);
    });
  });

  collectIds(reference.analyses, `${root}.analyses`, "design analysis", out);
  const claimed = new Map<string, string>();
  reference.analyses.forEach((analysis, index) => {
    const path = `${root}.analyses[${index}]`;
    nonEmpty(analysis.subject, `${path}.subject`, "analysis subject", out);
    if (!frameIds.has(analysis.frame))
      out.push(
        "type",
        `${path}.frame`,
        `design analysis frame "${analysis.frame}" does not resolve`,
        analysis.frame,
      );
    const outcome = analysis.outcome;
    if (outcome.status === "observed") {
      if (outcome.candidates.length === 0)
        out.push(
          "range",
          `${path}.outcome.candidates`,
          'an "observed" analysis must carry at least one candidate; report an empty reading as "not-run" or "unsupported"',
          outcome.candidates,
        );
      outcome.candidates.forEach((candidate, candidateIndex) => {
        const candidatePath = `${path}.outcome.candidates[${candidateIndex}]`;
        if (!candidateIds.has(candidate))
          out.push(
            "type",
            candidatePath,
            `analysis candidate "${candidate}" does not resolve`,
            candidate,
          );
        // An analysis reads ONE frame, so a candidate it claims to have
        // produced cannot be built from marks on another sheet. Without this,
        // `frame` is decorative for an `observed` analysis, and a reading taken
        // off a section can be filed under the plan whose scale it never had.
        const read = candidatesById.get(candidate);
        if (read !== undefined && frameIds.has(analysis.frame)) {
          const foreign = [
            ...new Set(
              read.primitives
                .map((id) => frameOfPrimitive.get(id))
                .filter(
                  (frame): frame is string =>
                    frame !== undefined && frame !== analysis.frame,
                ),
            ),
          ];
          if (foreign.length > 0)
            out.push(
              "type",
              candidatePath,
              `analysis "${analysis.id}" read frame "${analysis.frame}", but candidate "${candidate}" is built from marks on ${foreign.join(", ")}; cite readings across sheets from the building source instead`,
              candidate,
            );
        }
        const prior = claimed.get(candidate);
        if (prior === analysis.id)
          out.push(
            "type",
            candidatePath,
            `analysis "${analysis.id}" names candidate "${candidate}" more than once`,
            candidate,
          );
        else if (prior !== undefined)
          out.push(
            "type",
            candidatePath,
            `candidate "${candidate}" is already produced by analysis "${prior}"`,
            candidate,
          );
        else claimed.set(candidate, analysis.id);
      });
    } else if (outcome.status === "unsupported" || outcome.status === "not-run")
      nonEmpty(
        outcome.reason,
        `${path}.outcome.reason`,
        `a "${outcome.status}" analysis reason`,
        out,
      );
    else
      out.push(
        "type",
        `${path}.outcome.status`,
        `unknown design analysis status "${String((outcome as { status: unknown }).status)}"`,
        (outcome as { status: unknown }).status,
      );
  });

  return out.toValidation();
};
