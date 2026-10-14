import { blockBeat, stageScene } from "@automovie/engine";
import { IAutoMovieBlockingCoverage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { hasViolation, violationCount } from "../internal/predicates";

type ICoverage = IAutoMovieBlockingCoverage;

/** One valid coverage intent: the side camera holds a medium static on knightB. */
const coverage: (over?: Partial<ICoverage>) => ICoverage = (
  over: Partial<ICoverage> = {},
): ICoverage => ({
  camera: "cam-alt",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightB" },
  ...over,
});

/** The duel staged with two extra cameras ready to cover the beat (#1187). */
const staged: Extract<
  ReturnType<typeof stageScene>,
  { success: true }
> = ((): Extract<ReturnType<typeof stageScene>, { success: true }> => {
  const result: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      cameras: [
        {
          node: "cam-main",
          position: { x: 2, y: 1.5, z: 0.35 },
          lookAt: { kind: "node", node: "knightA" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
        {
          node: "cam-alt",
          position: { x: -2, y: 1.5, z: 0.35 },
          lookAt: { kind: "node", node: "knightB" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
        {
          node: "cam-wide",
          position: { x: 0, y: 3, z: 4 },
          lookAt: { kind: "node", node: "knightA" },
          fovDeg: 60,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  if (result.success !== true) throw new Error("staging fixture must succeed");
  return result;
})();

const block: (list: ICoverage[]) => ReturnType<typeof blockBeat> = (
  list: ICoverage[],
): ReturnType<typeof blockBeat> =>
  blockBeat(makeScriptWrite(), staged, makeBlockingWrite({ coverage: list }));

/**
 * The multi-camera half of #1187 at the BLOCKING consumer: a beat may plan
 * additional staged cameras as `coverage` intents beside the singular hero
 * `camera`. Each coverage camera must exist in the staging exactly once, favour
 * something placed, and state a supported framing and move at blocking time.
 *
 * Scenarios:
 *
 * 1. One coverage entry (cam-alt, medium static on knightB) → success, the plan
 *    carried verbatim, coverage included.
 * 2. Two coverage entries on distinct cameras (cam-alt + cam-wide) → success, the
 *    multi-camera case; the empty list `coverage: []` → success too, the
 *    omitted-equivalent boundary.
 * 3. An unstaged coverage camera and an empty camera id → `type` at
 *    `$input.coverage[0].camera`; a repeated coverage camera → `type` at
 *    `$input.coverage[1].camera`.
 * 4. A coverage favouring the unstaged `ghost` → `type` at `.on.node`; a forged
 *    framing or move name → `type` at `.framing` / `.move`.
 * 5. Negative twins: a point-target coverage fires no `.on.node` violation (a
 *    point needs no placement), and two DISTINCT cameras fire no duplicate
 *    violation (the over-match counter-example for scenario 3).
 *
 * @evidence contracts/testing.md#behavioral-verification Calls blockBeat against a stageScene-produced three-camera fixture and checks admitted coverage, copied node-target intent, located membership and vocabulary refusals, and violation-free point and distinct-camera twins. These observations catch lost coverage and gates that reject every list or admit forged camera references.
 * @evidence contracts/testing.md#independent-expectations Literal staged camera and actor ids determine membership, while medium/static and wide/orbit are supported interface values; forged strings are outside those unions. Coverage equality contains only string discriminators and node ids, and the expected zero violation counts come from valid authored plans rather than engine constants.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the five numbered groups: singleton, multiple and empty lists; absent, empty and repeated camera ids; absent node targets and forged vocabulary; and point-target and distinct-id negative twins. Hero camera paths are covered by test_film_block_beat_camera_target.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_block_beat_camera_coverage entry owns all coverage cases; a module-local stageScene call prepares only portable numeric fixture data before entry discovery. No consumer installation, native artifact, process, browser or GPU is used.
 */
export function test_film_block_beat_camera_coverage(): void {
  // 1. a single covering camera passes, plan verbatim.
  const single: ReturnType<typeof block> = block([coverage()]);
  TestValidator.equals("one covering camera passes", single.success, true);
  if (single.success === true)
    TestValidator.equals(
      "coverage carried verbatim",
      single.blocking.coverage,
      [coverage()],
    );

  // 2. several covering cameras pass; the empty list is the omitted case.
  const several: ReturnType<typeof block> = block([
    coverage(),
    coverage({ camera: "cam-wide", framing: "wide", move: "orbit" }),
  ]);
  TestValidator.equals("two covering cameras pass", several.success, true);
  const empty: ReturnType<typeof block> = block([]);
  TestValidator.equals("empty coverage passes", empty.success, true);

  // 3. camera id gates.
  const ghost: ReturnType<typeof block> = block([
    coverage({ camera: "cam-ghost" }),
  ]);
  TestValidator.predicate(
    "an unstaged coverage camera is a type violation",
    hasViolation(ghost, "type", "$input.coverage[0].camera"),
  );
  const blank: ReturnType<typeof block> = block([coverage({ camera: "" })]);
  TestValidator.predicate(
    "an empty coverage camera id is a type violation",
    hasViolation(blank, "type", "$input.coverage[0].camera"),
  );
  const repeated: ReturnType<typeof block> = block([coverage(), coverage()]);
  TestValidator.predicate(
    "a repeated coverage camera is a type violation at the later entry",
    hasViolation(repeated, "type", "$input.coverage[1].camera"),
  );

  // 4. target and closed-union gates.
  const stranger: ReturnType<typeof block> = block([
    coverage({ on: { kind: "node", node: "ghost" } }),
  ]);
  TestValidator.predicate(
    "a coverage favouring a stranger is a type violation",
    hasViolation(stranger, "type", "$input.coverage[0].on.node"),
  );
  const badFraming: ReturnType<typeof block> = block([
    coverage({ framing: "dutch" as never }),
  ]);
  TestValidator.predicate(
    "a forged framing is a type violation",
    hasViolation(badFraming, "type", "$input.coverage[0].framing"),
  );
  const badMove: ReturnType<typeof block> = block([
    coverage({ move: "dolly" as never }),
  ]);
  TestValidator.predicate(
    "a forged move is a type violation",
    hasViolation(badMove, "type", "$input.coverage[0].move"),
  );

  // 5. negative twins: nothing fires one property away from each gate.
  const point: ReturnType<typeof block> = block([
    coverage({ on: { kind: "point", point: { x: 0, y: 1, z: 0 } } }),
  ]);
  TestValidator.equals(
    "a point-target coverage fires no target violation",
    violationCount(point),
    0,
  );
  TestValidator.equals(
    "distinct cameras fire no violation at all",
    violationCount(several),
    0,
  );
}
