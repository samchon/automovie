import {
  type IAutoMovieCaptureResolution,
  parseAutoMovieCapturePlanRequest,
  resolveAutoMovieCapturePatterns,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** Object paths of a small scene, then the paths of the marks it draws, in scene order. */
const PATHS: readonly string[] = [
  "hero",
  "hero/arm",
  "hero/arm/hand",
  "hero/torso",
  "lamp",
  "hero/torso/section/3",
  "hero/arm",
];

/**
 * A drawn cell's record lists what each of its patterns resolved to, so a reader confirms every selection, label, colour and focus matched what was meant without reading geometry.
 *
 * Scenarios:
 *
 * 1. `parts=hero/arm,lamp`, `hide=hero/torso`, `label=hand`, `color=hero=ff8800` and the view `front@focus=hero/torso` resolve in that order, each to its topmost matched paths with the count of every matched path; a mark path under a matched object is counted, not listed.
 * 2. A pattern that matches nothing is listed with no path and a count of zero, so the record shows it.
 * 3. A request with no pattern and a view without a focus resolve to nothing.
 * 4. `parts=**` over the scene lists only the two topmost paths, `hero` and `lamp`, with all six distinct paths counted, so a broad pattern costs one entry per subtree rather than one per object.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves requests parsed by the public grammar against a hand-made path list and reads roles, patterns, listed paths and counts; a resolver that listed every descendant, dropped an empty match, matched by another rule than the inspection's or reordered the roles fails.
 * @evidence contracts/development/testing.md#independent-expectations The matches follow the documented path grammar worked by hand: a pattern with `/` is anchored and takes its subtree, a bare name matches any name on the path; the repeated `hero/arm` counts once.
 * @evidence contracts/development/testing.md#distinguishing-cases Anchored and bare patterns, every role, a matched descendant mark, an empty match, no pattern, and the broadest pattern. Carrying the resolution into the record is owned by `test_capture_run_order`, and through the draw page by `test_draw_cell_call`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_pattern_resolution`; it resolves in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_pattern_resolution(): void {
  const resolve: (text: string, view: string) => IAutoMovieCaptureResolution[] = (
    text: string,
    view: string,
  ): IAutoMovieCaptureResolution[] =>
    resolveAutoMovieCapturePatterns({
      paths: PATHS,
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)).inspection,
      view,
    });

  // 1. Every role, in order.
  TestValidator.equals(
    "each pattern resolves to its topmost paths",
    resolve("parts=hero/arm,lamp&hide=hero/torso&label=hand&color=hero=ff8800", "front@focus=hero/torso"),
    [
      { role: "parts", pattern: "hero/arm", paths: ["hero/arm"], count: 2 },
      { role: "parts", pattern: "lamp", paths: ["lamp"], count: 1 },
      { role: "hide", pattern: "hero/torso", paths: ["hero/torso"], count: 2 },
      { role: "label", pattern: "hand", paths: ["hero/arm/hand"], count: 1 },
      { role: "color", pattern: "hero", paths: ["hero"], count: 5 },
      { role: "focus", pattern: "hero/torso", paths: ["hero/torso"], count: 2 },
    ],
  );

  // 2. An empty match.
  TestValidator.equals(
    "a pattern that matches nothing is listed empty",
    resolve("parts=tail", "film"),
    [{ role: "parts", pattern: "tail", paths: [], count: 0 }],
  );

  // 3. Nothing to resolve.
  TestValidator.equals("no pattern resolves to nothing", resolve("", "front@ortho"), []);

  // 4. The broadest pattern.
  TestValidator.equals(
    "every path is one entry per subtree",
    resolve("parts=**", "film"),
    [{ role: "parts", pattern: "**", paths: ["hero", "lamp"], count: 6 }],
  );
}
