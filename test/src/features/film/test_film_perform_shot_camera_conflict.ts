import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { IAutoMovieStage, IAutoMovieSkeleton, IAutoMovieConstraintViolation } from "@automovie/interface";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { TestValidator } from "@nestia/e2e";
import { makePerformanceWrite, makeScriptWrite, makeStagingWrite, validSynthesizer } from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";
/**
 * A performed take elects one staged camera with a scalar frame actor.
 *
 * Scenarios:
 * 1. Refuse an actor node used as a frame camera.
 * 2. Refuse a second distinct camera and name its id.
 * 3. Refuse a frame action carrying a camera list.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs performShot over staged cameras and checks located frame-actor faults and the rival camera value, catching ambiguous election or noncamera motion reaching the shot camera.
 * @evidence contracts/testing.md#independent-expectations The stage names cam-main and cam-b as cameras and knightA only as an actor; the one-live-camera/scalar-frame contract independently rejects the three authored violations at their action indices.
 * @evidence contracts/testing.md#distinguishing-cases Owns noncamera, competing camera and actor-list refusal; accepted single-camera and first-camera fallback cases are in the other camera tests, while coverage angles are separate from live election.
 * @evidence contracts/testing.md#execution-ownership This synchronous discoverable unit owns portable camera election inputs and directly calls source over existing factories; it does not create a browser camera or GPU renderer.
 */
export function test_film_perform_shot_camera_conflict(): void {
  const base: IAutoMovieStage = makeStagingWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      cameras: [
        ...base.cameras,
        {
          node: "cam-b",
          position: { x: -2, y: 1.5, z: 0.35 },
          lookAt: { kind: "node", node: "knightB" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const frame: (actor: string, start: number) => { readonly verb: "frame"; readonly actor: string; readonly start: number; readonly duration: "auto"; readonly framing: "medium"; readonly move: "static"; readonly on: { readonly kind: "node"; readonly node: "knightA"; }; } = (actor: string, start: number): { readonly verb: "frame"; readonly actor: string; readonly start: number; readonly duration: "auto"; readonly framing: "medium"; readonly move: "static"; readonly on: { readonly kind: "node"; readonly node: "knightA"; }; } =>
    ({
      verb: "frame",
      actor,
      start,
      duration: "auto",
      framing: "medium",
      move: "static",
      on: { kind: "node", node: "knightA" },
    }) as const;

  const performed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame("knightA", 0), frame("cam-main", 0), frame("cam-b", 1)],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("fails", performed.success, false);
  TestValidator.equals(
    "non-camera frame actor rejected",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "second live camera rejected",
    namedFacts([
      ["performedSuccess", (): boolean => performed.success === false],
      [
        "hasViolationPerformedType",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[2].actor"),
      ],
      [
        "performedViolationsV",
        (): boolean =>
          performed.success === false &&
          performed.violations.some((v: IAutoMovieConstraintViolation): boolean => v.value === "cam-b"),
      ],
    ]),
    {
      performedSuccess: true,
      hasViolationPerformedType: true,
      performedViolationsV: true,
    },
  );

  const listed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          ...frame("cam-main", 0),
          actor: ["cam-main", "cam-b"],
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "frame actor list rejected",
    namedFacts([
      ["refused", (): boolean => listed.success === false],
      [
        "violated",
        (): boolean =>
          listed.success === false &&
          hasViolation(listed, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
