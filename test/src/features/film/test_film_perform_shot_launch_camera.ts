import {
  IAutoMoviePerformedShot,
  type IAutoMovieStagedSet,
  compareCodeUnits,
  performShot,
  stageScene,
} from "@automovie/engine";
import type {
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieConstraintViolation,
  IAutoMovieOnHitReaction,
  IAutoMovieScript,
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieStage,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";

const script: IAutoMovieScript = makeScriptWrite();

/**
 * The duel plus a throwable set piece, so a launch has something to fly.
 */
const staging: IAutoMovieStage = makeStagingWrite({
  set: [{ node: "pebble", model: "sphere", position: { x: 0, y: 1.2, z: 0 } }],
});

/**
 * Stages the authored launch-camera fixture, refuses an invalid fixture before use and returns the real performShot draft consumer; it owns no assertion by itself.
 */
function performing(): (
  draft: IAutoMovieActionCall[],
) => IAutoMoviePerformedShot {
  const staged: IAutoMovieStagedSet = stageScene(script, staging);
  if (staged.success !== true) throw new Error("staging fixture must succeed");
  return (draft: IAutoMovieActionCall[]): IAutoMoviePerformedShot =>
    performShot({
      script,
      staged,
      performance: makePerformanceWrite({
        draft,
        revise: { review: "unchanged.", final: null },
      }),
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    });
}

/**
 * Builds the existing pebble launch while varying aim and optional onHit; authored speed, clock and projectile remain fixed so the owning comparisons isolate target admission.
 */
function throwAt(
  at: IAutoMovieActionTarget,
  onHit?: IAutoMovieOnHitReaction,
): IAutoMovieActionCall {
  return {
    verb: "launch",
    actor: "knightA",
    start: 0,
    duration: 1,
    projectile: "pebble",
    speed: 20,
    at,
    onHit,
  };
}

/**
 * Requires a refused result and one located diagnostic containing every supplied fragment; this diagnostic observer cannot independently validate the gate's underlying geometry.
 */
function says(
  result: IAutoMoviePerformedShot,
  path: string,
  ...fragments: string[]
): boolean {
  return (
    result.success === false &&
    result.violations.some(
      (item: IAutoMovieConstraintViolation): boolean =>
        item.path === path &&
        fragments.every((fragment: string): boolean =>
          item.expected.includes(fragment),
        ),
    )
  );
}

/**
 * Runs stageScene and performShot with launch drafts; verifies a camera can be aimed at without performing, an actor receives its injected reaction, and camera/point/group onHit requests receive a located refusal instead of silently omitting or misassigning the recoil.
 *
 * Scenarios:
 * 1. Aim at the camera without injecting a camera performance.
 * 2. Refuse onHit at that camera with its authored target path.
 * 3. Accept the same reaction at the staged actor and retain both performers.
 * 4. Refuse an unbalancing camera hit before coupling or event output.
 * 5. Accept point/group flights without onHit and refuse the same aims with a requested reaction.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs stageScene and performShot with launch drafts; verifies a camera can be aimed at without performing, an actor receives its injected reaction, and camera/point/group onHit requests receive a located refusal instead of silently omitting or misassigning the recoil.
 * @evidence contracts/testing.md#independent-expectations Authored target kinds and the staged node/camera lists determine which ids may perform, and the launch contract requires an identified struck actor for onHit. Membership assertions show the injected actor reaches compilation; they do not independently measure recoil pose or contact timing, and no runtime gate set supplies the expected ids.
 * @evidence contracts/testing.md#distinguishing-cases Pairs the same launch with and without onHit for cameras, points and groups, retains the valid staged actor recoil, and covers unbalance before a camera fall could be emitted; unreachable flights and timing bounds belong to the broader perform-shot launch test.
 * @evidence contracts/testing.md#execution-ownership The unit entry owns every scenario through portable stage and performance functions with the shared deterministic fixture synthesizer; it opens no host or renderer.
 */
export function test_film_perform_shot_launch_camera(): void {
  const perform: (draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot =
    performing();
  /**
   * Reads successful performance node ids and sorts them by code units, or returns an empty list on refusal; the owning entry independently supplies expected staged actor identities.
   */
  function performers(result: IAutoMoviePerformedShot): string[] {
    return result.success === true
      ? result.shot.performances
          .map((entry: IAutoMovieShotPerformance): string => entry.node)
          .sort(compareCodeUnits)
      : [];
  }

  // 1. shooting at the lens is legal.
  const atLens: IAutoMoviePerformedShot = perform([
    throwAt({ kind: "node", node: "cam-main" }),
  ]);
  TestValidator.equals(
    "a launch at a staged camera performs",
    atLens.success,
    true,
  );
  TestValidator.equals(
    "no camera performs the shot it was aimed at",
    performers(atLens),
    ["knightA"],
  );

  // 2. knocking the lens back is not.
  TestValidator.predicate(
    "an onHit aimed at a camera is refused at the aim, naming the camera",
    says(
      perform([throwAt({ kind: "node", node: "cam-main" }, { force: 0.5 })]),
      "$input.draft[0].at",
      '"cam-main"',
      "is a camera",
    ),
  );

  // 3. the counter-case one property away: the same onHit at an actor.
  const atActor: IAutoMoviePerformedShot = perform([
    throwAt({ kind: "node", node: "knightB" }, { force: 0.5 }),
  ]);
  TestValidator.equals(
    "the same onHit aimed at a staged scene node performs",
    atActor.success,
    true,
  );
  TestValidator.equals(
    "the struck actor carries the injected recoil",
    performers(atActor),
    ["knightA", "knightB"],
  );

  // 4. the unbalance boundary is refused before a fall event exists.
  TestValidator.predicate(
    "an unbalancing onHit at a camera is refused the same way",
    says(
      perform([
        throwAt(
          { kind: "node", node: "cam-main" },
          { force: 1, unbalance: true },
        ),
      ]),
      "$input.draft[0].at",
      "is a camera",
    ),
  );

  // 5. Refuse unrealizable reactions while preserving nodeless flights.
  const atPoint: IAutoMoviePerformedShot = perform([
    throwAt({ kind: "point", point: { x: 0, y: 0, z: 0.7 } }),
  ]);
  TestValidator.equals(
    "a point aim without onHit still performs",
    atPoint.success,
    true,
  );
  TestValidator.equals("a point aim recoils no one", performers(atPoint), [
    "knightA",
  ]);
  for (const aim of [
    { kind: "point", point: { x: 0, y: 0, z: 0.7 } },
    { kind: "group", nodes: ["knightA", "knightB"] },
  ] satisfies IAutoMovieActionTarget[]) {
    TestValidator.predicate(
      `${aim.kind} cannot silently omit a requested recoil`,
      says(
        perform([throwAt(aim, { force: 0.5 })]),
        "$input.draft[0].at",
        "onHit requires",
        "identifies no struck actor",
      ),
    );
    TestValidator.equals(
      `${aim.kind} without onHit still flies`,
      perform([throwAt(aim)]).success,
      true,
    );
  }
}
