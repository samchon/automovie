import { type IAutoMovieDesignReference, AutoMovieDesignReferenceMedia, type IAutoMovieDesignAnalysisOutcome } from "@automovie/interface";

/** Execute the next ordered assertions of test_architecture_design_reference.
 *
 * Scenarios:
 * 1. Prepare the authored inputs used by the following assertions.
 *
 * This part returns the authored single-field malformed-reference mutations and their located error paths. It invokes no product operation and makes no assertion itself; Part3 applies each mutation to a fresh valid reference and checks the validator.
 * The declared reference schema determines the literal paths paired with malformed ids, versions, media, frames, dimensions, transforms and observations. A changed validator path or accepted malformed field fails the following part; these fixtures do not verify external asset bytes or drawing interpretation.
 * Each mutation changes one previously valid field, including empty, duplicate, unknown, zero, fractional and nonfinite values. Part1 owns positive reference/registration behavior and Part3 executes the negative cases; this input table alone proves neither.
 */
export function assertArchitectureDesignReferencePart2(): { malformed: ReadonlyArray<
    readonly [string, (value: IAutoMovieDesignReference) => void, string]
  >; } {


  // 10. Malformed observations.
  const malformed: ReadonlyArray<
    readonly [string, (value: IAutoMovieDesignReference) => void, string]
  > = [
    ["blank document id", (value: IAutoMovieDesignReference): string => (value.id = " "), "$input.id"],
    [
      "wrong schema version",
      (value: IAutoMovieDesignReference): number => ((value as { version: number }).version = 2),
      "$input.version",
    ],
    ["blank asset path", (value: IAutoMovieDesignReference): string => (value.asset = ""), "$input.asset"],
    [
      "malformed digest",
      (value: IAutoMovieDesignReference): string => (value.digest = "sha1:abcd" as string),
      "$input.digest",
    ],
    [
      "unregistrable media",
      (value: IAutoMovieDesignReference): AutoMovieDesignReferenceMedia =>
        (value.media = "image/gif" as IAutoMovieDesignReference["media"]),
      "$input.media",
    ],
    ["no frame at all", (value: IAutoMovieDesignReference): never[] => (value.frames = []), "$input.frames"],
    [
      "blank frame id",
      (value: IAutoMovieDesignReference): string => (value.frames[0]!.id = ""),
      "$input.frames[0].id",
    ],
    [
      "duplicate frame id",
      (value: IAutoMovieDesignReference): string => (value.frames[1]!.id = "plan-1"),
      "$input.frames[1].id",
    ],
    [
      "unknown drawing view",
      (value: IAutoMovieDesignReference): "elevation" | "plan" | "section" | "detail" | "perspective" =>
        (value.frames[0]!.view =
          "isometric" as IAutoMovieDesignReference["frames"][number]["view"]),
      "$input.frames[0].view",
    ],
    [
      "zeroth page",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.page = 0),
      "$input.frames[0].page",
    ],
    [
      "fractional page",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.page = 1.5),
      "$input.frames[0].page",
    ],
    [
      "blank level label",
      (value: IAutoMovieDesignReference): string => (value.frames[0]!.level = " "),
      "$input.frames[0].level",
    ],
    [
      "zero sheet width",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.bounds.width = 0),
      "$input.frames[0].bounds.width",
    ],
    [
      "non-finite sheet height",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.bounds.height = Number.NaN),
      "$input.frames[0].bounds.height",
    ],
    [
      "anchor left of the sheet",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.anchor.x = -1),
      "$input.frames[0].anchor.x",
    ],
    [
      "anchor below the sheet",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.anchor.y = 801),
      "$input.frames[0].anchor.y",
    ],
    [
      "non-finite anchor",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.anchor.x = Number.NaN),
      "$input.frames[0].anchor.x",
    ],
    [
      "blank scale candidate id",
      (value: IAutoMovieDesignReference): string => (value.frames[0]!.scaleCandidates[0]!.id = ""),
      "$input.frames[0].scaleCandidates[0].id",
    ],
    [
      "duplicate scale candidate id",
      (value: IAutoMovieDesignReference): string => (value.frames[1]!.scaleCandidates[1]!.id = "section-fifty"),
      "$input.frames[1].scaleCandidates[1].id",
    ],
    [
      "non-positive metres per unit",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.scaleCandidates[0]!.metersPerUnit = 0),
      "$input.frames[0].scaleCandidates[0].metersPerUnit",
    ],
    [
      "non-finite metres per unit",
      (value: IAutoMovieDesignReference): number =>
        (value.frames[0]!.scaleCandidates[0]!.metersPerUnit =
          Number.POSITIVE_INFINITY),
      "$input.frames[0].scaleCandidates[0].metersPerUnit",
    ],
    [
      "confidence above one",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.scaleCandidates[0]!.confidence = 1.5),
      "$input.frames[0].scaleCandidates[0].confidence",
    ],
    [
      "blank scale basis",
      (value: IAutoMovieDesignReference): string => (value.frames[0]!.scaleCandidates[0]!.basis = " "),
      "$input.frames[0].scaleCandidates[0].basis",
    ],
    [
      "settled scale naming no candidate",
      (value: IAutoMovieDesignReference): string => (value.frames[1]!.scale = "section-two-hundred"),
      "$input.frames[1].scale",
    ],
    [
      "zero x axis",
      (value: IAutoMovieDesignReference): { x: number; y: number; z: number; } => (value.frames[0]!.axisX = { x: 0, y: 0, z: 0 }),
      "$input.frames[0].axisX",
    ],
    [
      "non-finite x axis",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.axisX.x = Number.POSITIVE_INFINITY),
      "$input.frames[0].axisX.x",
    ],
    [
      "zero y axis",
      (value: IAutoMovieDesignReference): { x: number; y: number; z: number; } => (value.frames[0]!.axisY = { x: 0, y: 0, z: 0 }),
      "$input.frames[0].axisY",
    ],
    [
      "y axis parallel to x",
      (value: IAutoMovieDesignReference): { x: number; y: number; z: number; } => (value.frames[0]!.axisY = { x: 2, y: 0, z: 0 }),
      "$input.frames[0].axisY",
    ],
    [
      "zero up direction",
      (value: IAutoMovieDesignReference): { x: number; y: number; z: number; } => (value.frames[0]!.up = { x: 0, y: 0, z: 0 }),
      "$input.frames[0].up",
    ],
    [
      "zero north direction",
      (value: IAutoMovieDesignReference): { x: number; y: number; z: number; } => (value.frames[0]!.north = { x: 0, y: 0, z: 0 }),
      "$input.frames[0].north",
    ],
    [
      "non-finite origin",
      (value: IAutoMovieDesignReference): number => (value.frames[0]!.origin.x = Number.NaN),
      "$input.frames[0].origin.x",
    ],
    [
      "non-unit frame rotation",
      (value: IAutoMovieDesignReference): number => (value.frames[1]!.transform!.rotation.w = 0.5),
      "$input.frames[1].transform.rotation",
    ],
    [
      "blank primitive id",
      (value: IAutoMovieDesignReference): string => (value.primitives[0]!.id = " "),
      "$input.primitives[0].id",
    ],
    [
      "duplicate primitive id",
      (value: IAutoMovieDesignReference): string => (value.primitives[1]!.id = "north-outer"),
      "$input.primitives[1].id",
    ],
    [
      "primitive on an unknown frame",
      (value: IAutoMovieDesignReference): string => (value.primitives[0]!.frame = "plan-2"),
      "$input.primitives[0].frame",
    ],
    [
      "unknown primitive kind",
      (value: IAutoMovieDesignReference): "line" | "arc" | "polyline" | "region" | "text" | "level-marker" =>
        (value.primitives[0]!.kind =
          "spline" as IAutoMovieDesignReference["primitives"][number]["kind"]),
      "$input.primitives[0].kind",
    ],
    [
      "primitive kind spelled like an inherited object property",
      (value: IAutoMovieDesignReference): "line" | "arc" | "polyline" | "region" | "text" | "level-marker" =>
        (value.primitives[0]!.kind =
          "toString" as IAutoMovieDesignReference["primitives"][number]["kind"]),
      "$input.primitives[0].kind",
    ],
    [
      "three-point line",
      (value: IAutoMovieDesignReference): number => value.primitives[0]!.points.push({ x: 0, y: 0 }),
      "$input.primitives[0].points",
    ],
    [
      "single-point polyline",
      (value: IAutoMovieDesignReference): number => (value.primitives[2]!.points.length = 1),
      "$input.primitives[2].points",
    ],
    [
      "two-point region",
      (value: IAutoMovieDesignReference): number => (value.primitives[3]!.points.length = 2),
      "$input.primitives[3].points",
    ],
    [
      "two-point arc",
      (value: IAutoMovieDesignReference): number => (value.primitives[4]!.points.length = 2),
      "$input.primitives[4].points",
    ],
    [
      "non-finite observed point",
      (value: IAutoMovieDesignReference): number => (value.primitives[0]!.points[0]!.x = Number.NaN),
      "$input.primitives[0].points[0].x",
    ],
    [
      "a mark drawn past the right edge of its own sheet",
      (value: IAutoMovieDesignReference): number => (value.primitives[0]!.points[0]!.x = 5000),
      "$input.primitives[0].points[0].x",
    ],
    [
      "a mark drawn above the top edge of its own sheet",
      (value: IAutoMovieDesignReference): number => (value.primitives[0]!.points[0]!.y = -5),
      "$input.primitives[0].points[0].y",
    ],
    [
      "text primitive with no text",
      (value: IAutoMovieDesignReference): null => (value.primitives[5]!.text = null),
      "$input.primitives[5].text",
    ],
    [
      "level marker with blank text",
      (value: IAutoMovieDesignReference): string => (value.primitives[6]!.text = "  "),
      "$input.primitives[6].text",
    ],
    [
      "geometric primitive carrying text",
      (value: IAutoMovieDesignReference): string => (value.primitives[0]!.text = "WALL"),
      "$input.primitives[0].text",
    ],
    [
      "blank issue id",
      (value: IAutoMovieDesignReference): string => (value.issues[0]!.id = ""),
      "$input.issues[0].id",
    ],
    [
      "duplicate issue id",
      (value: IAutoMovieDesignReference): string => (value.issues[1]!.id = "door-occluded"),
      "$input.issues[1].id",
    ],
    [
      "unknown issue kind",
      (value: IAutoMovieDesignReference): "unknown-scale" | "ambiguous-geometry" | "occluded" | "illegible" | "conflicting-dimension" | "other" =>
        (value.issues[0]!.kind =
          "smudged" as IAutoMovieDesignReference["issues"][number]["kind"]),
      "$input.issues[0].kind",
    ],
    [
      "blank issue detail",
      (value: IAutoMovieDesignReference): string => (value.issues[0]!.detail = " "),
      "$input.issues[0].detail",
    ],
    [
      "issue about nothing",
      (value: IAutoMovieDesignReference): never[] => (value.issues[0]!.subjects = []),
      "$input.issues[0].subjects",
    ],
    [
      "issue about an unknown subject",
      (value: IAutoMovieDesignReference): string => (value.issues[0]!.subjects[0] = "ghost"),
      "$input.issues[0].subjects[0]",
    ],
    [
      "issue naming one subject twice",
      (value: IAutoMovieDesignReference): number => value.issues[0]!.subjects.push("door-swing"),
      "$input.issues[0].subjects[2]",
    ],
    [
      "blank candidate id",
      (value: IAutoMovieDesignReference): string => (value.candidates[0]!.id = " "),
      "$input.candidates[0].id",
    ],
    [
      "duplicate candidate id",
      (value: IAutoMovieDesignReference): string => (value.candidates[1]!.id = "wall-north-outer"),
      "$input.candidates[1].id",
    ],
    [
      "blank candidate semantic",
      (value: IAutoMovieDesignReference): string => (value.candidates[0]!.semantic = ""),
      "$input.candidates[0].semantic",
    ],
    [
      "candidate reading nothing",
      (value: IAutoMovieDesignReference): never[] => (value.candidates[0]!.primitives = []),
      "$input.candidates[0].primitives",
    ],
    [
      "candidate reading an unknown primitive",
      (value: IAutoMovieDesignReference): string => (value.candidates[0]!.primitives[0] = "ghost-line"),
      "$input.candidates[0].primitives[0]",
    ],
    [
      "candidate reading one primitive twice",
      (value: IAutoMovieDesignReference): number => value.candidates[0]!.primitives.push("north-outer"),
      "$input.candidates[0].primitives[1]",
    ],
    [
      "negative candidate confidence",
      (value: IAutoMovieDesignReference): number => (value.candidates[0]!.confidence = -0.1),
      "$input.candidates[0].confidence",
    ],
    [
      "alternative that does not resolve",
      (value: IAutoMovieDesignReference): string => (value.candidates[0]!.alternatives[0] = "wall-ghost"),
      "$input.candidates[0].alternatives[0]",
    ],
    [
      "candidate listed as its own alternative",
      (value: IAutoMovieDesignReference): string => (value.candidates[0]!.alternatives[0] = "wall-north-outer"),
      "$input.candidates[0].alternatives[0]",
    ],
    [
      "candidate naming one rival twice",
      (value: IAutoMovieDesignReference): number => value.candidates[0]!.alternatives.push("wall-north-inner"),
      "$input.candidates[0].alternatives[1]",
    ],
    [
      "candidate blocked by an unknown issue",
      (value: IAutoMovieDesignReference): string => (value.candidates[1]!.issues[0] = "ghost-issue"),
      "$input.candidates[1].issues[0]",
    ],
    [
      "candidate listing one issue twice",
      (value: IAutoMovieDesignReference): number => value.candidates[1]!.issues.push("door-occluded"),
      "$input.candidates[1].issues[1]",
    ],
    [
      "blank analysis id",
      (value: IAutoMovieDesignReference): string => (value.analyses[0]!.id = ""),
      "$input.analyses[0].id",
    ],
    [
      "duplicate analysis id",
      (value: IAutoMovieDesignReference): string => (value.analyses[1]!.id = "wall-centerline"),
      "$input.analyses[1].id",
    ],
    [
      "blank analysis subject",
      (value: IAutoMovieDesignReference): string => (value.analyses[0]!.subject = " "),
      "$input.analyses[0].subject",
    ],
    [
      "analysis of an unknown frame",
      (value: IAutoMovieDesignReference): string => (value.analyses[0]!.frame = "plan-9"),
      "$input.analyses[0].frame",
    ],
    [
      "an observed analysis that observed nothing",
      (value: IAutoMovieDesignReference): { status: "observed"; candidates: never[]; } =>
        (value.analyses[0]!.outcome = { status: "observed", candidates: [] }),
      "$input.analyses[0].outcome.candidates",
    ],
    [
      "an observed analysis naming an unknown candidate",
      (value: IAutoMovieDesignReference): { status: "observed"; candidates: string[]; } =>
        (value.analyses[0]!.outcome = {
          status: "observed",
          candidates: ["wall-ghost"],
        }),
      "$input.analyses[0].outcome.candidates[0]",
    ],
    [
      "one candidate produced by two analyses",
      (value: IAutoMovieDesignReference): { status: "observed"; candidates: string[]; } =>
        (value.analyses[1]!.outcome = {
          status: "observed",
          candidates: ["wall-west"],
        }),
      "$input.analyses[1].outcome.candidates[0]",
    ],
    [
      "one analysis naming its own candidate twice",
      (value: IAutoMovieDesignReference): { status: "observed"; candidates: string[]; } =>
        (value.analyses[0]!.outcome = {
          status: "observed",
          candidates: ["wall-west", "wall-west"],
        }),
      "$input.analyses[0].outcome.candidates[1]",
    ],
    [
      "an analysis filing readings taken off another sheet",
      (value: IAutoMovieDesignReference): string => (value.analyses[0]!.frame = "section-1"),
      "$input.analyses[0].outcome.candidates[0]",
    ],
    [
      "unsupported without a reason",
      (value: IAutoMovieDesignReference): { status: "unsupported"; reason: string; } =>
        (value.analyses[1]!.outcome = { status: "unsupported", reason: " " }),
      "$input.analyses[1].outcome.reason",
    ],
    [
      "not-run without a reason",
      (value: IAutoMovieDesignReference): { status: "not-run"; reason: string; } =>
        (value.analyses[2]!.outcome = { status: "not-run", reason: "" }),
      "$input.analyses[2].outcome.reason",
    ],
    [
      "an outcome status nobody defined",
      (value: IAutoMovieDesignReference): IAutoMovieDesignAnalysisOutcome =>
        (value.analyses[1]!.outcome = {
          status: "guessed",
        } as unknown as IAutoMovieDesignReference["analyses"][number]["outcome"]),
      "$input.analyses[1].outcome.status",
    ],
  ];
  return { malformed };
}
