import type {
  IAutoMovieDesignPromotedReading,
  IAutoMovieDesignPromotion,
  IAutoMovieDesignReference,
  IAutoMovieDesignSkippedAnalysis,
  IAutoMovieDesignSourceFrame,
  IAutoMovieDesignWithholding,
} from "@automovie/interface";

import { promoteDesignObservations } from "@automovie/engine";
import { assertArchitectureDesignObservationPromotionPart1 } from "../internal/assertArchitectureDesignObservationPromotionPart1";

const PLAN_DIGEST: string =
  "sha256:1111111111111111111111111111111111111111111111111111111111111111" as string;

/** The authored raster frame maps one source coordinate unit to 0.01 world metres. */
const planFrame: () => IAutoMovieDesignSourceFrame =
  (): IAutoMovieDesignSourceFrame => ({
    id: "plan-1",
    page: 1,
    view: "plan",
    level: "ground",
    bounds: { width: 1000, height: 800 },
    anchor: { x: 0, y: 0 },
    scaleCandidates: [
      {
        id: "plan-bar",
        metersPerUnit: 0.01,
        confidence: 0.95,
        basis: "scale-bar",
      },
    ],
    scale: "plan-bar",
    axisX: { x: 1, y: 0, z: 0 },
    axisY: { x: 0, y: 0, z: 1 },
    origin: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    north: { x: 0, y: 0, z: -1 },
    transform: null,
  });

/** The unsettled section: two plausible scales and no chosen one. */
const sectionFrame: () => IAutoMovieDesignSourceFrame =
  (): IAutoMovieDesignSourceFrame => ({
    ...planFrame(),
    id: "section-1",
    view: "section",
    level: null,
    scaleCandidates: [
      {
        id: "fifty",
        metersPerUnit: 0.02,
        confidence: 0.4,
        basis: "assumed 1:50",
      },
      {
        id: "hundred",
        metersPerUnit: 0.04,
        confidence: 0.4,
        basis: "assumed 1:100",
      },
    ],
    scale: null,
    axisY: { x: 0, y: -1, z: 0 },
    north: null,
  });

/**
 * The same pavilion sheet, arranged so every promotion verdict is reachable: one clean west run, two competing north centrelines, one occluded door, a label that is text rather than geometry, a section line whose scale nobody settled, a reading no analysis ever claimed, and two analyses that produced nothing at all.
 */
const observation: () => IAutoMovieDesignReference =
  (): IAutoMovieDesignReference => ({
    version: 1,
    id: "pavilion-plan",
    asset: "public/design-references/pavilion-plan.png",
    digest: PLAN_DIGEST,
    media: "image/png",
    frames: [planFrame(), sectionFrame()],
    primitives: [
      {
        id: "west-run",
        frame: "plan-1",
        kind: "polyline",
        points: [
          { x: 100, y: 100 },
          { x: 100, y: 500 },
          { x: 300, y: 500 },
        ],
        text: null,
      },
      {
        id: "north-outer",
        frame: "plan-1",
        kind: "line",
        points: [
          { x: 100, y: 100 },
          { x: 700, y: 100 },
        ],
        text: null,
      },
      {
        id: "north-inner",
        frame: "plan-1",
        kind: "line",
        points: [
          { x: 100, y: 120 },
          { x: 700, y: 120 },
        ],
        text: null,
      },
      {
        id: "room-label",
        frame: "plan-1",
        kind: "text",
        points: [{ x: 400, y: 300 }],
        text: "PAVILION",
      },
      {
        id: "section-wall",
        frame: "section-1",
        kind: "line",
        points: [
          { x: 200, y: 600 },
          { x: 200, y: 200 },
        ],
        text: null,
      },
      {
        id: "stray-run",
        frame: "plan-1",
        kind: "line",
        points: [
          { x: 20, y: 20 },
          { x: 40, y: 20 },
        ],
        text: null,
      },
    ],
    analyses: [
      {
        id: "wall-centerline",
        frame: "plan-1",
        subject: "wall-centerline",
        outcome: {
          status: "observed",
          candidates: ["wall-west", "wall-north-outer", "wall-north-inner"],
        },
      },
      {
        id: "label-read",
        frame: "plan-1",
        subject: "room-label",
        outcome: { status: "observed", candidates: ["room-name"] },
      },
      {
        id: "section-wall-read",
        frame: "section-1",
        subject: "wall-centerline",
        outcome: { status: "observed", candidates: ["section-wall-line"] },
      },
      {
        id: "opening-detection",
        frame: "plan-1",
        subject: "opening",
        outcome: {
          status: "unsupported",
          reason:
            "This host reads no door symbol library, so the swing arc is not resolved into an opening.",
        },
      },
      {
        id: "storey-datum",
        frame: "section-1",
        subject: "storey-datum",
        outcome: {
          status: "not-run",
          reason:
            "The section scale is unsettled, so no datum extraction was attempted.",
        },
      },
    ],
    candidates: [
      {
        id: "wall-west",
        semantic: "wall-centerline",
        primitives: ["west-run"],
        confidence: 1,
        alternatives: [],
        issues: [],
      },
      {
        id: "wall-north-outer",
        semantic: "wall-centerline",
        primitives: ["north-outer"],
        confidence: 0.6,
        alternatives: ["wall-north-inner"],
        issues: [],
      },
      {
        id: "wall-north-inner",
        semantic: "wall-centerline",
        primitives: ["north-inner"],
        confidence: 0.6,
        alternatives: ["wall-north-outer"],
        issues: ["door-occluded"],
      },
      {
        id: "room-name",
        semantic: "room-label",
        primitives: ["room-label"],
        confidence: 1,
        alternatives: [],
        issues: [],
      },
      {
        id: "section-wall-line",
        semantic: "wall-centerline",
        primitives: ["section-wall"],
        confidence: 1,
        alternatives: [],
        issues: [],
      },
      {
        id: "stray-reading",
        semantic: "wall-centerline",
        primitives: ["stray-run"],
        confidence: 1,
        alternatives: [],
        issues: [],
      },
    ],
    issues: [
      {
        id: "door-occluded",
        kind: "occluded",
        subjects: ["wall-north-inner"],
        detail:
          "The planter hatch covers the door jamb, so the opening width cannot be read from this sheet.",
        open: true,
      },
    ],
  });

/** Every withholding as `candidate:reason`, so a verdict is pinned per reading. */
const verdicts: (
  mutate: (value: IAutoMovieDesignReference) => void,
  minimumConfidence?: number,
) => { promoted: string[]; withheld: string[]; skipped: string[] } = (
  mutate: (value: IAutoMovieDesignReference) => void,
  minimumConfidence?: number,
): { promoted: string[]; withheld: string[]; skipped: string[] } => {
  const value: IAutoMovieDesignReference = observation();
  mutate(value);
  const promotion: IAutoMovieDesignPromotion = promoteDesignObservations(
    minimumConfidence === undefined
      ? { reference: value }
      : { reference: value, minimumConfidence },
  );
  return {
    promoted: promotion.promoted.map(
      (entry: IAutoMovieDesignPromotedReading): string => entry.candidate,
    ),
    withheld: promotion.withheld.map(
      (entry: IAutoMovieDesignWithholding): string =>
        `${entry.candidate}:${entry.reason}`,
    ),
    skipped: promotion.skipped.map(
      (entry: IAutoMovieDesignSkippedAnalysis): string =>
        `${entry.analysis}:${entry.status}`,
    ),
  };
};

/**
 * Promote eligible recorded observations into proposed metric outlines while preserving withheld/skipped reasons and source data.
 *
 * Scenarios:
 * 1. Out of six readings of one sheet, exactly one promotes: the rest are withheld as ambiguous, blocked, non-geometric, unscaled, or unclaimed, and the two barren analyses are reported as skipped rather than as silence.
 * 2. Two competing centrelines are both withheld, and neither is chosen by confidence, count, or order: ambiguity is not broken by the engine.
 * 3. Deleting the competition is not enough — a 0.6 reading still fails the default certainty floor, and clears it only when the caller lowers the bar on purpose.
 * 4. At the lowered 0.5 floor an open issue still blocks the 0.6-confidence inner reading; closing it releases that candidate beside the already eligible readings.
 * 5. A text label never becomes geometry, and an unsettled section scale is refused rather than resolved to either of its two candidates.
 * 6. A reading no analysis produced is withheld as unobserved, so a candidate cannot enter the design by simply existing.
 * 7. The same authored reference produces equal promotion data twice, and it still equals a fresh source fixture after the calls.
 * 8. The mapping from sheet to world is hand-checked, including the frame's optional placement transform, and refuses outright on an unsettled scale.
 * 9. A direct coordinate-query call with a degenerate axis maps without dividing by zero; this bypasses reference admission, which rejects that frame.
 * 10. An invalid reference and an out-of-range confidence floor both throw instead of returning a partial promotion.
 *
 * @evidence contracts/testing.md#behavioral-verification The ordered assertion part calls promoteDesignObservations, designReferenceWorldPoint and designFrameScale, inspecting promoted ids/outlines/semantic label, withholding reason codes, skipped analysis/status pairs, scale answers and refusal fragments. Releasing ambiguous/unclaimed/text readings or inventing a section scale changes these observations; independent detail-message wording and image recognition accuracy are not asserted.
 * @evidence contracts/testing.md#independent-expectations Authored 0.01 m/unit coordinates map to (1,0,1),(1,0,5),(3,0,5), and scale 2 plus a Y quarter-turn and translation (10,1,-2) maps (500,400) to (18,1,-12) under original vclose limits. Literal gate outcomes distinguish default floor 1, lowered 0.5 and zero; plain-data replay/nonmutation use sameProductData at numeric tolerance zero and share the same product function, beside those independent coordinates and verdicts.
 * @evidence contracts/testing.md#distinguishing-cases Ambiguity, confidence floors, open/closed issues, text, unsettled scale, unclaimed readings, nonmutation/replay, axis normalization/degeneracy, frame placement and invalid input retain the cases; the declared PNG path is never decoded and the promoted outline is not an adopted design.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_observation_promotion is the discoverable entry and owns the ordered cases delegated to assertArchitectureDesignObservationPromotionPart1; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 */
export function test_architecture_design_observation_promotion(): void {
  assertArchitectureDesignObservationPromotionPart1(
    planFrame,
    sectionFrame,
    observation,
    verdicts,
  );
}
