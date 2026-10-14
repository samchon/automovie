import { assertArchitectureDesignReferencePart1 } from "../internal/assertArchitectureDesignReferencePart1";
import { assertArchitectureDesignReferencePart2 } from "../internal/assertArchitectureDesignReferencePart2";
import { assertArchitectureDesignReferencePart3 } from "../internal/assertArchitectureDesignReferencePart3";
import { validateDesignReference } from "../../../../packages/engine/src/architecture/validateDesignReference";
import type { IAutoMovieValidation, IAutoMovieConstraintViolation, IAutoMovieDesignEvidence, IAutoMovieDesignReference, IAutoMovieGeneratedAcquisition } from "@automovie/interface";

const PLAN_DIGEST: string =
  "sha256:1111111111111111111111111111111111111111111111111111111111111111" as string;
const PROMPT_DIGEST: string =
  "sha256:2222222222222222222222222222222222222222222222222222222222222222" as string;
const STUDY_DIGEST: string =
  "sha256:3333333333333333333333333333333333333333333333333333333333333333" as string;

/**
 * One small garden pavilion, observed rather than designed.
 *
 * The sheet carries a settled raster plan and an unsettled section: the plan's scale bar was legible, the section's was not, and the section therefore keeps two competing scale readings and no chosen one. The north wall was drawn with two plausible centrelines, a door is behind a hatched planter, and two of the three analyses produced nothing at all. Everything about that is recorded as observation, and none of it is a wall.
 */
const observation: () => IAutoMovieDesignReference = (): IAutoMovieDesignReference => ({
  version: 1,
  id: "pavilion-plan",
  asset: "public/design-references/pavilion-plan.png",
  digest: PLAN_DIGEST,
  media: "image/png",
  frames: [
    {
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
    },
    {
      id: "section-1",
      page: 1,
      view: "section",
      level: null,
      bounds: { width: 1000, height: 800 },
      anchor: { x: 500, y: 400 },
      scaleCandidates: [
        {
          id: "section-fifty",
          metersPerUnit: 0.02,
          confidence: 0.4,
          basis: "assumed 1:50",
        },
        {
          id: "section-hundred",
          metersPerUnit: 0.04,
          confidence: 0.4,
          basis: "assumed 1:100",
        },
      ],
      scale: null,
      axisX: { x: 1, y: 0, z: 0 },
      axisY: { x: 0, y: -1, z: 0 },
      origin: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      north: null,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    },
  ],
  primitives: [
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
      id: "planter",
      frame: "plan-1",
      kind: "region",
      points: [
        { x: 300, y: 90 },
        { x: 420, y: 90 },
        { x: 420, y: 150 },
      ],
      text: null,
    },
    {
      id: "door-swing",
      frame: "plan-1",
      kind: "arc",
      points: [
        { x: 320, y: 110 },
        { x: 360, y: 70 },
        { x: 400, y: 110 },
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
      id: "ffl",
      frame: "section-1",
      kind: "level-marker",
      points: [{ x: 200, y: 600 }],
      text: "+0.000",
    },
  ],
  analyses: [
    {
      id: "wall-centerline",
      frame: "plan-1",
      subject: "wall-centerline",
      outcome: {
        status: "observed",
        candidates: ["wall-north-outer", "wall-north-inner", "wall-west"],
      },
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
      id: "section-datum",
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
      id: "wall-west",
      semantic: "wall-centerline",
      primitives: ["west-run"],
      confidence: 1,
      alternatives: [],
      issues: [],
    },
  ],
  issues: [
    {
      id: "door-occluded",
      kind: "occluded",
      subjects: ["door-swing", "wall-north-inner"],
      detail:
        "The planter hatch covers the door jamb, so the opening width cannot be read from this sheet.",
      open: true,
    },
    {
      id: "section-scale-unknown",
      kind: "unknown-scale",
      subjects: ["ffl"],
      detail:
        "The section carries no legible scale bar; 1:50 and 1:100 both fit the sheet.",
      open: true,
    },
  ],
});

/** Authored acquisition metadata; no provider or generated byte fixture is loaded. */
const generated: () => IAutoMovieGeneratedAcquisition = (): IAutoMovieGeneratedAcquisition => ({
  provider: "image-generation-service",
  model: "diffusion-xl-2026-03",
  request: "req_8f21",
  prompt: "Quarter view of a timber garden pavilion under a flat roof.",
  promptDigest: PROMPT_DIGEST,
  inputs: ["public/design-references/pavilion-plan.png"],
  outputDigest: STUDY_DIGEST,
  reproducible: false,
  seed: null,
});

/** Authored citations referring to the observation's candidate ids. */
const evidence: () => IAutoMovieDesignEvidence[] = (): IAutoMovieDesignEvidence[] => [
  {
    subject: "pavilion/wall-west",
    document: "pavilion-plan",
    candidates: ["wall-west"],
    rationale:
      "The west run is the only unambiguous centreline on the sheet, so the authored wall follows it directly.",
  },
  {
    subject: "pavilion/wall-north",
    document: "pavilion-plan",
    candidates: ["wall-north-outer", "wall-north-inner"],
    rationale:
      "Both north centrelines are cited on purpose: the authored wall was placed on the outer reading, and the disagreement stays visible instead of being deleted.",
  },
];

/**
 * Collect all finding paths after applying one mutation to a fresh observation. Consumers select the path they expect; this helper does not require that it be the only finding.
 */
const refusalPaths: (mutate: (value: IAutoMovieDesignReference) => void) => string[] = (
  mutate: (value: IAutoMovieDesignReference) => void,
): string[] => {
  const value: IAutoMovieDesignReference = observation();
  mutate(value);
  const validation: IAutoMovieValidation = validateDesignReference({ reference: value });
  return validation.success === true
    ? []
    : validation.violations.map((violation: IAutoMovieConstraintViolation): string => violation.path);
};

/**
 * Validate recorded drawing observations, generated acquisition provenance and design-evidence citations at their authored paths.
 *
 * Scenarios:
 * 1. A two-frame pavilion sheet with a settled plan scale, an unsettled section scale, competing wall centrelines, an occluded door and two barren analyses validates as a coherent observation.
 * 2. The unsettled section, which keeps both scale readings and chooses neither, is part of that valid sheet, and naming a scale candidate that was never recorded is refused: an unknown scale is a fact about the drawing, not a gap to fill in.
 * 3. Observed analyses with empty or unknown candidates and non-observed analyses with blank reasons are refused, as is an unknown outcome status.
 * 4. One candidate cannot be produced by two analyses, nor named twice by one, so a reading has exactly one origin story; and an analysis cannot file a candidate built from marks on a sheet it never says it read.
 * 5. Generated-acquisition metadata records provider, model, request, prompt digest, inputs and output digest; the authored record is accepted with no source URL and no seed.
 * 6. Metadata claiming reproducibility without a seed is refused, while a non-reproducible record carrying seed 4211 receives one warning and still succeeds; neither case executes generation.
 * 7. Fractional, infinite, NaN and 2^53 seeds are refused for either reproducibility flag; seed -1 is admitted by this metadata gate without proving a provider accepts it.
 * 8. Recorded output digest is compared with the supplied current-digest string; supplying null skips that comparison without executing processing or reading bytes.
 * 9. Citations resolve to real documents and real candidates, may deliberately cite two competing readings at once, and are refused when they dangle, repeat, or carry no reason.
 * 10. Each existing malformed-table row, including a repeated rival/issue subject and a primitive kind spelled like an inherited object property, requires its authored violation path.
 * 11. The untouched fixture produces no violation path at all.
 *
 * @evidence contracts/testing.md#behavioral-verification The three ordered parts call validateDesignReference, validateGeneratedAcquisition and validateDesignEvidence, observing clean controls, authored paths, selected warning/violation counts, seed admission, supplied-digest comparison and candidate citation pooling. Lost analysis/frame ownership, inherited-property primitive lookup or blanket rejection changes these observations; the parent provides fresh authored records and the exact mutation table.
 * @evidence contracts/testing.md#independent-expectations The local two-frame pavilion fixes settled/unsettled scales, competing candidates, issue references and analysis ownership; repeated-digit SHA-256-shaped strings are metadata fixtures, with same/different/null supplied digest arguments determining the comparison. Literal paths and warning count one distinguish selected defects, and blank document id alone yields one violation. Citation mutations compare exact path equality, while the malformed-reference table requires path membership; neither reads image bytes or executes a provider.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the coherent observation, full existing malformed table, inherited primitive kind, scale ambiguity, analysis/frame ownership, optional prompt/request, both reproducibility flags, malformed/negative seeds, missing resident input path, warning count, supplied-digest mismatch/null and citation resolution/pooling. Extra properties on non-observed outcomes, arbitrary missing nested containers, provider-specific seed domains, actual PNG contents and replay are outside these assertions.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_reference is the discoverable entry and owns the ordered cases delegated to assertArchitectureDesignReferencePart1, assertArchitectureDesignReferencePart2, assertArchitectureDesignReferencePart3; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 */
export function test_architecture_design_reference(): void {
  assertArchitectureDesignReferencePart1(PLAN_DIGEST, STUDY_DIGEST, observation, generated, evidence);
  const { malformed }: { malformed: ReadonlyArray<
    readonly [string, (value: IAutoMovieDesignReference) => void, string]
  >; } = assertArchitectureDesignReferencePart2();
  assertArchitectureDesignReferencePart3(observation, refusalPaths, malformed);
}
