import type { IAutoMovieMark } from "@automovie/engine";
import {
  type IAutoMovieCaptureSubject,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  resolveAutoMovieInspectionColors,
} from "@automovie/render";
import { markMotionCaptureCase } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A motion case's trail, targets and drift samples become inspection marks of three kinds the `marks` key selects, in the case's own colours, with drift beyond its limit flagged.
 *
 * Scenarios:
 *
 * 1. A case with one red trail, one green target and drift samples of 2 mm and 9 mm against a 5 mm limit gives a polyline, a point and two drift marks: the 9 mm sample flagged, the 2 mm one not.
 * 2. The kinds are `case/d04040`, `case/40a040` and `case/drift`, labelled `trail d04040`, `target 40a040` and `drift`, and the inspection's colour law accepts them in one picture.
 * 3. A capture planned with `marks=case` against a subject supplying these kinds is accepted, and so is `marks=case/drift`; `marks=trail` is refused, since the case's marks are not the inspection's own trails.
 * 4. A trail and a target sharing red make one kind labelled `trail and target d04040`, so the colour law still holds.
 * 5. An empty trail and an empty drift set give no mark, and a one-point trail is drawn as a point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the harness's mapping and feeds its marks to the inspection's colour resolver and the capture planner, the two consumers that decide whether they draw; a mapping that lost a mark, flagged within the limit, merged two colours into one kind or split one colour into two kinds fails.
 * @evidence contracts/development/testing.md#independent-expectations Geometry and colours are the case data written here; the flag follows the case's own limit, a sample beyond it being the defect `.agents/skills/motion/laws/verification.md` asks to see; the colour law is the inspection core's documented rule that one colour stands for one kind.
 * @evidence contracts/development/testing.md#distinguishing-cases Within against beyond the limit, distinct colours against a shared one, empty and one-point overlays, an accepted against a refused `marks` pattern. Drawing them in a browser is the capture host's real run.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_motion_capture_marks`; it maps plain data and starts no browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_motion_capture_marks(): void {
  const at: (x: number, y: number, z: number) => { x: number; y: number; z: number } = (
    x: number,
    y: number,
    z: number,
  ): { x: number; y: number; z: number } => ({ x, y, z });

  // 1. One of each.
  const marks: IAutoMovieMark[] = markMotionCaptureCase({
    trails: [{ color: 0xd04040, points: [at(0, 0, 0), at(0.5, 0, 0), at(1, 0, 0)] }],
    targets: [{ at: at(1, 1, 0), radius: 0.03, color: 0x40a040 }],
    drift: [
      {
        samples: [
          { at: at(0.1, 0, 0.2), drift: 0.002 },
          { at: at(0.3, 0, 0.2), drift: 0.009 },
        ],
        limit: 0.005,
      },
    ],
  });
  TestValidator.equals(
    "shapes, paths and flags",
    marks.map((mark: IAutoMovieMark): unknown[] => [mark.path, mark.shape.type, mark.flagged, mark.anchor]),
    [
      ["case/trail/0", "polyline", false, null],
      ["case/target/0", "points", false, null],
      ["case/drift/0/within", "points", false, null],
      ["case/drift/0/beyond", "points", true, null],
    ],
  );
  TestValidator.equals(
    "the flagged sample is the 9 mm one",
    marks[3]!.shape.type === "points" ? marks[3]!.shape.points : [],
    [0.3, 0, 0.2],
  );

  // 2. Three kinds, accepted by the colour law.
  const kinds: Map<string, { label: string; color: number }> = resolveAutoMovieInspectionColors({
    marks,
    reserved: [{ use: "the flag", color: 0xff00ff }],
    recolor: [],
  });
  TestValidator.equals(
    "three kinds in the legend",
    [...kinds].map(([kind, entry]: [string, { label: string; color: number }]): unknown[] => [kind, entry.label]),
    [
      ["case/d04040", "trail d04040"],
      ["case/40a040", "target 40a040"],
      ["case/drift", "drift"],
    ],
  );

  // 3. Selectable by the marks key.
  const subject: IAutoMovieCaptureSubject = {
    name: "walk",
    durationSeconds: 2,
    fps: 30,
    width: 64,
    height: 64,
    views: ["front"],
    drawables: [],
    marks: [...kinds.keys()],
  };
  const plans: (marks: string) => number = (pattern: string): number =>
    planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(`at=1&marks=${pattern}`)),
      subject,
      cuts: [],
    }).cells.length;
  TestValidator.equals("marks=case plans", plans("case"), 1);
  TestValidator.equals("marks=case/drift plans", plans("case/drift"), 1);
  let refused: boolean = false;
  try {
    plans("trail");
  } catch {
    refused = true;
  }
  TestValidator.predicate("marks=trail is refused", refused);

  // 4. A shared colour is one kind.
  const shared: IAutoMovieMark[] = markMotionCaptureCase({
    trails: [{ color: 0xd04040, points: [at(0, 0, 0), at(1, 0, 0)] }],
    targets: [{ at: at(1, 0, 0), radius: 0.02, color: 0xd04040 }],
    drift: [],
  });
  TestValidator.equals(
    "one kind for one colour",
    [...new Set(shared.map((mark: IAutoMovieMark): string => `${mark.kind} ${mark.label}`))],
    ["case/d04040 trail and target d04040"],
  );

  // 5. Degenerate overlays.
  const sparse: IAutoMovieMark[] = markMotionCaptureCase({
    trails: [
      { color: 0x3070c0, points: [] },
      { color: 0xc07030, points: [at(2, 0, 0)] },
    ],
    targets: [],
    drift: [{ samples: [], limit: 0.005 }],
  });
  TestValidator.equals(
    "only the one-point trail, as a point",
    sparse.map((mark: IAutoMovieMark): unknown[] => [mark.path, mark.shape.type]),
    [["case/trail/1", "points"]],
  );
}
