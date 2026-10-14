import {
  IAutoMovieDesignAnalysis,
  IAutoMovieDesignIssue,
  IAutoMovieDesignPoint,
  IAutoMovieDesignReference,
  IAutoMovieDesignSourceFrame,
  IAutoMovieObservedCandidate,
  IAutoMovieObservedPrimitive,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { validateDeclaredReferences } from "../validation/validateDeclaredReferences";
import { AUTO_MOVIE_DESIGN_ISSUE_KINDS } from "./constants/AUTO_MOVIE_DESIGN_ISSUE_KINDS";
import { AUTO_MOVIE_DESIGN_REFERENCE_MEDIA } from "./constants/AUTO_MOVIE_DESIGN_REFERENCE_MEDIA";
import { isAutoMovieDesignReferenceMedia } from "./isAutoMovieDesignReferenceMedia";
import { validateDesignSourceFrame } from "./validateDesignSourceFrame";

/**
 * Every raw mark family an observation may record, and the point count each one
 * carries. This table is the only list of the families: a second exported array
 * would be a copy that drifts the first time a family is added. A `Map` rather
 * than an object literal, so a kind spelled like an inherited property such as
 * `toString` finds no entry.
 */
const PRIMITIVE_POINTS: ReadonlyMap<string, { min: number; max: number }> =
  new Map([
    ["line", { min: 2, max: 2 }],
    ["arc", { min: 3, max: 3 }],
    ["polyline", { min: 2, max: Infinity }],
    ["region", { min: 3, max: Infinity }],
    ["text", { min: 1, max: 1 }],
    ["level-marker", { min: 1, max: 1 }],
  ]);

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
 * So it refuses a candidate that cites a primitive nobody saw, an issue about nothing, an analysis that claims `observed` while producing no reading, and a non-observed analysis without a non-blank reason. Extra runtime properties on non-observed analysis objects are not inspected. It also refuses a settled scale that names no recorded candidate: an unknown scale is a fact about the drawing, and inventing one is how a plan image turns into metres nobody measured.
 *
 * The same principle binds an analysis to the one frame it says it read: a
 * candidate built from marks on another sheet was not produced by this reading,
 * and filing it here would let a section's geometry inherit a plan's scale.
 * Correlating two sheets is the authored building's job, through evidence that
 * may cite any candidate of any document.
 *
 * Observed points are in frame units and must lie within the frame's `bounds` (0 to width, 0 to height); each primitive family has its own point-count bounds, and only `text` and `level-marker` carry literal text. Frames are judged by {@link validateDesignSourceFrame}. Every id is unique and non-blank, the digest is a lowercase `sha256:` hex digest, and the media is a supported type. Findings are returned with `$input` paths and nothing throws; the asset bytes behind `digest` are not read here.
 *
 * @param props.reference Observed design reference to validate.
 * @returns Success, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Treats the reference as a graph of declared ids and checks each layer only against the layer it may cite, resolving references through id sets and frame ownership through a primitive-to-frame index; primitive families are looked up in a `Map`, so an inherited object property can never pass as a family.
 * @evidence contracts/common.md#clear-and-simple-design The reference owns its layered rules; the frame rules live in `validateDesignSourceFrame`, and id declaration, reference resolution, blank strings and ranges come from the shared validation helpers instead of private copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sheet, frame, kind or id is special-cased; an unknown scale stays null and a barren analysis stays `unsupported` or `not-run` rather than being filled in.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the four layers and why they are kept apart, every refusal class, the frame binding of an analysis, the point units and bounds, the text rule, the path root, that nothing throws, and that asset bytes are not read.
 * @evidence contracts/performance.md#efficient-algorithms Builds record/reference indexes and scans points, frame scale candidates, candidate/issue references and analysis citations. Each analysis citation walks its candidate's primitive references again for frame binding, adding their summed lengths even for repeated invalid citations; indexes do not make that repeated work linear in distinct records alone.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A validation of one reference per call that coordinates no shared work; `promoteDesignObservations` calls it once per promotion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The id sets, frame and candidate indexes and the producing-analysis map are local and released on return, each bounded by its record count; the returned validation holds the findings.
 */
export const validateDesignReference: (props: {
  /** Observed design reference to validate. */ reference: IAutoMovieDesignReference;
}) => IAutoMovieValidation = (props: {
  /** Observed design reference to validate. */
  reference: IAutoMovieDesignReference;
}): IAutoMovieValidation => {
  const reference: IAutoMovieDesignReference = props.reference;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  out.nonEmpty(`${root}.id`, reference.id, "design reference id");
  if (reference.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `design reference schema version must be 1, but was ${reference.version}`,
      reference.version,
    );
  out.nonEmpty(`${root}.asset`, reference.asset, "design reference asset");
  if (!SHA256_DIGEST_PATTERN.test(reference.digest))
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
  const frameIds: Set<string> = collectDeclaredIds(
    reference.frames,
    `${root}.frames`,
    "source frame",
    out,
  );
  reference.frames.forEach(
    (frame: IAutoMovieDesignSourceFrame, index: number): void =>
      validateDesignSourceFrame(frame, `${root}.frames[${index}]`, out),
  );

  const framesById: Map<string, IAutoMovieDesignSourceFrame> = new Map(
    reference.frames.map(
      (
        frame: IAutoMovieDesignSourceFrame,
      ): [string, IAutoMovieDesignSourceFrame] => [frame.id, frame],
    ),
  );
  const frameOfPrimitive: Map<string, string> = new Map(
    reference.primitives.map(
      (primitive: IAutoMovieObservedPrimitive): [string, string] => [
        primitive.id,
        primitive.frame,
      ],
    ),
  );
  const primitiveIds: Set<string> = collectDeclaredIds(
    reference.primitives,
    `${root}.primitives`,
    "observed primitive",
    out,
  );
  reference.primitives.forEach(
    (primitive: IAutoMovieObservedPrimitive, index: number): void =>
      validatePrimitive(
        primitive,
        framesById.get(primitive.frame),
        `${root}.primitives[${index}]`,
        out,
      ),
  );

  const issueIds: Set<string> = collectDeclaredIds(
    reference.issues,
    `${root}.issues`,
    "design issue",
    out,
  );
  const candidateIds: Set<string> = collectDeclaredIds(
    reference.candidates,
    `${root}.candidates`,
    "observed candidate",
    out,
  );
  const candidatesById: Map<string, IAutoMovieObservedCandidate> = new Map(
    reference.candidates.map(
      (
        candidate: IAutoMovieObservedCandidate,
      ): [string, IAutoMovieObservedCandidate] => [candidate.id, candidate],
    ),
  );

  reference.candidates.forEach(
    (candidate: IAutoMovieObservedCandidate, index: number): void => {
      const path: string = `${root}.candidates[${index}]`;
      out.nonEmpty(
        `${path}.semantic`,
        candidate.semantic,
        "candidate semantic",
      );
      if (candidate.primitives.length === 0)
        out.push(
          "range",
          `${path}.primitives`,
          "an observed candidate must read at least one primitive",
          candidate.primitives,
        );
      validateDeclaredReferences(
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
      const alternativesSeen: Set<string> = new Set();
      candidate.alternatives.forEach(
        (alternative: string, alternativeIndex: number): void => {
          const alternativePath: string = `${path}.alternatives[${alternativeIndex}]`;
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
          // A rival listed twice turns one disagreement into two. The list is
          // also read back verbatim when a promotion explains what it withheld,
          // so the repeat resurfaces as a refusal naming the same candidate
          // twice.
          if (alternativesSeen.has(alternative))
            out.push(
              "type",
              alternativePath,
              `alternative candidate "${alternative}" is duplicated`,
              alternative,
            );
          alternativesSeen.add(alternative);
        },
      );
      validateDeclaredReferences(
        candidate.issues,
        issueIds,
        `${path}.issues`,
        "design issue",
        out,
      );
    },
  );

  reference.issues.forEach(
    (issue: IAutoMovieDesignIssue, index: number): void =>
      validateIssue(
        issue,
        primitiveIds,
        candidateIds,
        `${root}.issues[${index}]`,
        out,
      ),
  );

  collectDeclaredIds(
    reference.analyses,
    `${root}.analyses`,
    "design analysis",
    out,
  );
  const claimed: Map<string, string> = new Map();
  reference.analyses.forEach(
    (analysis: IAutoMovieDesignAnalysis, index: number): void => {
      const path: string = `${root}.analyses[${index}]`;
      out.nonEmpty(`${path}.subject`, analysis.subject, "analysis subject");
      if (!frameIds.has(analysis.frame))
        out.push(
          "type",
          `${path}.frame`,
          `design analysis frame "${analysis.frame}" does not resolve`,
          analysis.frame,
        );
      const outcome: IAutoMovieDesignAnalysis["outcome"] = analysis.outcome;
      if (outcome.status === "observed") {
        if (outcome.candidates.length === 0)
          out.push(
            "range",
            `${path}.outcome.candidates`,
            'an "observed" analysis must carry at least one candidate; report an empty reading as "not-run" or "unsupported"',
            outcome.candidates,
          );
        outcome.candidates.forEach(
          (candidate: string, candidateIndex: number): void => {
            const candidatePath: string = `${path}.outcome.candidates[${candidateIndex}]`;
            if (!candidateIds.has(candidate))
              out.push(
                "type",
                candidatePath,
                `analysis candidate "${candidate}" does not resolve`,
                candidate,
              );
            // An analysis reads ONE frame, so a candidate it claims to have
            // produced cannot be built from marks on another sheet. Without
            // this, `frame` is decorative for an `observed` analysis, and a
            // reading taken off a section can be filed under the plan whose
            // scale it never had.
            const read: IAutoMovieObservedCandidate | undefined =
              candidatesById.get(candidate);
            if (read !== undefined && frameIds.has(analysis.frame)) {
              const foreign: Set<string> = new Set();
              for (const id of read.primitives) {
                const frame: string | undefined = frameOfPrimitive.get(id);
                if (frame !== undefined && frame !== analysis.frame)
                  foreign.add(frame);
              }
              if (foreign.size > 0)
                out.push(
                  "type",
                  candidatePath,
                  `analysis "${analysis.id}" read frame "${analysis.frame}", but candidate "${candidate}" is built from marks on ${[...foreign].join(", ")}; cite readings across sheets from the building source instead`,
                  candidate,
                );
            }
            const prior: string | undefined = claimed.get(candidate);
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
          },
        );
      } else if (
        outcome.status === "unsupported" ||
        outcome.status === "not-run"
      )
        out.nonEmpty(
          `${path}.outcome.reason`,
          outcome.reason,
          `a "${outcome.status}" analysis reason`,
        );
      else {
        const status: unknown = (outcome as { status: unknown }).status;
        out.push(
          "type",
          `${path}.outcome.status`,
          `unknown design analysis status "${String(status)}"`,
          status,
        );
      }
    },
  );

  return out.toValidation();
};

/** One primitive: its frame, family, point count, points and literal text. */
const validatePrimitive: (
  primitive: IAutoMovieObservedPrimitive,
  owner: IAutoMovieDesignSourceFrame | undefined,
  path: string,
  out: ViolationCollector,
) => void = (
  primitive: IAutoMovieObservedPrimitive,
  owner: IAutoMovieDesignSourceFrame | undefined,
  path: string,
  out: ViolationCollector,
): void => {
  if (owner === undefined)
    out.push(
      "type",
      `${path}.frame`,
      `observed primitive frame "${primitive.frame}" does not resolve`,
      primitive.frame,
    );
  const shape: { min: number; max: number } | undefined = PRIMITIVE_POINTS.get(
    primitive.kind,
  );
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
  primitive.points.forEach(
    (point: IAutoMovieDesignPoint, pointIndex: number): void => {
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
        const limit: number =
          axis === "x" ? owner.bounds.width : owner.bounds.height;
        if (point[axis] < 0 || point[axis] > limit)
          out.push(
            "range",
            `${path}.points[${pointIndex}].${axis}`,
            `observed point ${axis} must lie inside the ${owner.bounds.width}x${owner.bounds.height} extent of frame "${owner.id}", but was ${point[axis]}`,
            point[axis],
          );
      }
    },
  );
  const literal: boolean =
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
};

/** One issue: a known kind, a detail, and subjects that resolve once each. */
const validateIssue: (
  issue: IAutoMovieDesignIssue,
  primitiveIds: ReadonlySet<string>,
  candidateIds: ReadonlySet<string>,
  path: string,
  out: ViolationCollector,
) => void = (
  issue: IAutoMovieDesignIssue,
  primitiveIds: ReadonlySet<string>,
  candidateIds: ReadonlySet<string>,
  path: string,
  out: ViolationCollector,
): void => {
  if (
    !(AUTO_MOVIE_DESIGN_ISSUE_KINDS as readonly string[]).includes(issue.kind)
  )
    out.push(
      "type",
      `${path}.kind`,
      `unknown design issue kind "${String(issue.kind)}"`,
      issue.kind,
    );
  out.nonEmpty(`${path}.detail`, issue.detail, "design issue detail");
  if (issue.subjects.length === 0)
    out.push(
      "range",
      `${path}.subjects`,
      "a design issue must name at least one primitive or candidate",
      issue.subjects,
    );
  const subjectsSeen: Set<string> = new Set();
  issue.subjects.forEach((subject: string, subjectIndex: number): void => {
    const subjectPath: string = `${path}.subjects[${subjectIndex}]`;
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
};
