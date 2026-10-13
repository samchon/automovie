import {
  IAutoMovieConstraintViolation,
  IAutoMovieDesignIssue,
  IAutoMovieDesignPoint,
  IAutoMovieDesignPromotion,
  IAutoMovieDesignReference,
  IAutoMovieDesignSourceFrame,
  IAutoMovieDesignWithholding,
  IAutoMovieObservedPrimitive,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { designFrameScale } from "./designFrameScale";
import { designReferenceWorldPoint } from "./designReferenceWorldPoint";
import { validateDesignReference } from "./validateDesignReference";

/** Primitive families that carry promotable metric geometry. */
const GEOMETRIC_PRIMITIVES: ReadonlySet<string> = new Set([
  "line",
  "polyline",
  "region",
]);

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
 * Gates run in a fixed order and the first failing one names the withholding:
 * `unobserved`, `ambiguous-candidate`, `open-issue`, `low-confidence`,
 * `unsupported-geometry` (only line, polyline and region carry an outline),
 * then `unknown-scale`. A promoted candidate carries one world-metre outline
 * per primitive it reads, in the candidate's primitive order. Candidates,
 * withholdings and skips keep the reference's declaration order. An invalid
 * reference, refused by {@link validateDesignReference}, or a floor outside
 * [0, 1] throws an `Error` naming the first defect.
 *
 * @param props.reference Observed reference whose candidates are judged.
 * @param props.minimumConfidence Inclusive confidence floor, default `1`.
 * @returns The promoted, withheld and skipped readings.
 *
 * @evidence contracts/common.md#principled-implementation Promotion is a fixed sequence of gates over facts the validated reference records, so the first failing gate is a deterministic reason; metres come only from the frame's settled scale through `designReferenceWorldPoint`, and the reference is validated first, which is what lets every id lookup assume a resolved target.
 * @evidence contracts/common.md#clear-and-simple-design The one path from observation to metres; scale and world conversion are owned by `designFrameScale` and `designReferenceWorldPoint`, and validation by `validateDesignReference`, so this function only owns the gate order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No candidate, frame or semantic is special-cased; ambiguity, open issues and unknown scales are withheld rather than resolved arbitrarily, and the default floor of `1` refuses anything uncertain unless the caller lowers it.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what promotion requires, that the result is a proposal and not a design, the gate order and reason names, which families carry geometry, the outline order, the output order, the default floor, and both failure conditions.
 * @evidence contracts/performance.md#efficient-algorithms Linear in frames, primitives, issues, analysis citations, candidates and promoted points: every lookup goes through a map or set built once, and each frame's settled scale is resolved once rather than once per primitive.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one reference and floor that coordinates no work across calls; the reference is the caller's value, so no promotion is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The frame, primitive, issue and producer indexes are local and released on return, each bounded by its record count; the caller owns the returned promotion, whose outlines are bounded by the promoted candidates' points.
 */
export const promoteDesignObservations: (props: { /** Observed reference whose candidates are judged; validated before use. */ reference : IAutoMovieDesignReference ; /** Inclusive confidence floor in `[0, 1]`. Defaults to `1`, so nothing but a certain reading promotes unless the caller consciously lowers the bar. */ minimumConfidence ? : number ; }) => IAutoMovieDesignPromotion = (props: {
  /** Observed reference whose candidates are judged; validated before use. */
  reference: IAutoMovieDesignReference;

  /**
   * Inclusive confidence floor in `[0, 1]`. Defaults to `1`, so nothing but a
   * certain reading promotes unless the caller consciously lowers the bar.
   */
  minimumConfidence?: number;
}): IAutoMovieDesignPromotion => {
  const validated: IAutoMovieValidation = validateDesignReference({
    reference: props.reference,
  });
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation =
      validated.violations[0]!;
    throw new Error(
      `design reference "${props.reference.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  const floor: number = props.minimumConfidence ?? 1;
  if (!Number.isFinite(floor) || floor < 0 || floor > 1)
    throw new Error(
      `design reference "${props.reference.id}" cannot be promoted at confidence floor ${floor}: a floor is a finite number within [0, 1].`,
    );

  const reference: IAutoMovieDesignReference = props.reference;
  const frames: Map<string, IAutoMovieDesignSourceFrame> = new Map(
    reference.frames.map(
      (
        frame: IAutoMovieDesignSourceFrame,
      ): [string, IAutoMovieDesignSourceFrame] => [frame.id, frame],
    ),
  );
  const scaled: Set<string> = new Set(
    reference.frames
      .filter(
        (frame: IAutoMovieDesignSourceFrame): boolean =>
          designFrameScale(frame) !== null,
      )
      .map((frame: IAutoMovieDesignSourceFrame): string => frame.id),
  );
  const primitives: Map<string, IAutoMovieObservedPrimitive> = new Map(
    reference.primitives.map(
      (
        primitive: IAutoMovieObservedPrimitive,
      ): [string, IAutoMovieObservedPrimitive] => [primitive.id, primitive],
    ),
  );
  const openIssues: Set<string> = new Set(
    reference.issues
      .filter((issue: IAutoMovieDesignIssue): boolean => issue.open)
      .map((issue: IAutoMovieDesignIssue): string => issue.id),
  );
  const produced: Set<string> = new Set();
  const promotion: IAutoMovieDesignPromotion = {
    promoted: [],
    withheld: [],
    skipped: [],
  };
  for (const analysis of reference.analyses) {
    if (analysis.outcome.status === "observed")
      for (const candidate of analysis.outcome.candidates) produced.add(candidate);
    else
      promotion.skipped.push({
        analysis: analysis.id,
        status: analysis.outcome.status,
        reason: analysis.outcome.reason,
      });
  }

  for (const candidate of reference.candidates) {
    const withhold: (reason: IAutoMovieDesignWithholding [ "reason" ], detail: string) => void = (
      reason: IAutoMovieDesignWithholding["reason"],
      detail: string,
    ): void => {
      promotion.withheld.push({ candidate: candidate.id, reason, detail });
    };
    if (!produced.has(candidate.id)) {
      withhold(
        "unobserved",
        `Candidate "${candidate.id}" is produced by no analysis whose outcome is "observed".`,
      );
      continue;
    }
    if (candidate.alternatives.length > 0) {
      withhold(
        "ambiguous-candidate",
        `Candidate "${candidate.id}" competes with ${candidate.alternatives.join(", ")}; settle the reading in the building source instead of promoting one arbitrarily.`,
      );
      continue;
    }
    const blocking: string[] = candidate.issues.filter((issue: string): boolean =>
      openIssues.has(issue),
    );
    if (blocking.length > 0) {
      withhold(
        "open-issue",
        `Candidate "${candidate.id}" is blocked by open issue ${blocking.join(", ")}.`,
      );
      continue;
    }
    if (candidate.confidence < floor) {
      withhold(
        "low-confidence",
        `Candidate "${candidate.id}" reads at confidence ${candidate.confidence}, below the required ${floor}.`,
      );
      continue;
    }
    const marks: IAutoMovieObservedPrimitive[] = candidate.primitives.map(
      (id: string): IAutoMovieObservedPrimitive => primitives.get(id)!,
    );
    const ungeometric: IAutoMovieObservedPrimitive | undefined = marks.find(
      (primitive: IAutoMovieObservedPrimitive): boolean =>
        !GEOMETRIC_PRIMITIVES.has(primitive.kind),
    );
    if (ungeometric !== undefined) {
      withhold(
        "unsupported-geometry",
        `Candidate "${candidate.id}" reads "${ungeometric.kind}" primitive "${ungeometric.id}", which carries no metric outline.`,
      );
      continue;
    }
    const unscaled: IAutoMovieObservedPrimitive | undefined = marks.find(
      (primitive: IAutoMovieObservedPrimitive): boolean =>
        !scaled.has(primitive.frame),
    );
    if (unscaled !== undefined) {
      withhold(
        "unknown-scale",
        `Frame "${unscaled.frame}" has no settled scale, so candidate "${candidate.id}" cannot become metres.`,
      );
      continue;
    }
    promotion.promoted.push({
      candidate: candidate.id,
      semantic: candidate.semantic,
      outlines: marks.map(
        (primitive: IAutoMovieObservedPrimitive): IAutoMovieVector3[] => {
          const frame: IAutoMovieDesignSourceFrame = frames.get(primitive.frame)!;
          return primitive.points.map(
            (point: IAutoMovieDesignPoint): IAutoMovieVector3 =>
              designReferenceWorldPoint(frame, point),
          );
        },
      ),
    });
  }
  return promotion;
};
