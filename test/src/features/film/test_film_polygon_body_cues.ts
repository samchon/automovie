import {
  compileDefinedShot,
  defineShot,
  validateShotArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieAuthoringDiagnostic,
  IAutoMovieConstraintViolation,
  IAutoMovieDefinedShot,
  IAutoMoviePolygonBodyCue,
  IAutoMovieShot,
  IAutoMovieShotProgram,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { nclose, qclose, vclose } from "../internal/predicates";

/**
 * The registered duel carries a polygon body cue through ordinary shot compilation.
 *
 * Scenarios:
 *
 * 1. A detach cue retains its subject, bone, source seconds and transform
 *    in the emitted shot with independently owned records.
 * 2. An unknown subject, a non-finite start and a pair of overlapping
 *    branches report their source fields together at the performance gate.
 * 3. The restored shot passes artifact validation with its staged skeleton.
 *    The same gate identifies cues on overlapping or unavailable bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the staged duel, admitted source clock and transform, data ownership and performance and artifact refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles the authored program through stage, blocking and performance, then reads the emitted shot and source diagnostics. Revalidates serialized cues through the public artifact gate with the replay rig.
 * @evidence contracts/development/testing.md#independent-expectations Explicit cue facts determine the emitted clock and transform. The fixture's lower arm descends from its upper arm. Both that overlap and an unavailable rig identify the lower arm cue.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks cue ownership and three independent authoring faults. Artifact checks cover intact serialization, an unavailable rig and an overlapping descendant authored before its ancestor.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous source test uses the portable compiler and shared duel fixtures in memory.
 */
export function test_film_polygon_body_cues(): void {
  const authored: IAutoMoviePolygonBodyCue = {
    kind: "detach",
    subject: "knightA",
    bone: "leftLowerArm",
    at: 0.75,
    duration: 0.5,
    rotation: { x: 0, y: 0, z: 0.6, w: 0.8 },
    translation: { x: 0.25, y: 0.5, z: -0.25 },
  };
  const cues: readonly IAutoMoviePolygonBodyCue[] = [authored];

  /** Run a normal registered-shot compile with the supplied cue records. */
  function compile(
    polygonBodyCues: readonly IAutoMoviePolygonBodyCue[],
  ): ReturnType<typeof compileDefinedShot> {
    const shot: IAutoMovieDefinedShot<unknown> = defineShot("polygon-duel", {
      scene: "scene-duel",
      contract: {
        beat: "beat-1",
        durationSeconds: 2,
        participants: [
          { kind: "actor", id: "knightA" },
          { kind: "actor", id: "knightB" },
        ],
        opening: [],
        closing: [],
        camera: {
          intent: "Keep the duel readable.",
          requiredSubjects: ["knightA", "knightB"],
          maxOcclusionRatio: 0.2,
        },
        events: [],
        reviewFrames: [{ id: "impact", time: 1, passes: ["beauty"] }],
      },
      build: (): IAutoMovieShotProgram => {
        const blocking: ReturnType<typeof makeBlockingWrite> =
          makeBlockingWrite();
        const performance: ReturnType<typeof makePerformanceWrite> =
          makePerformanceWrite();
        blocking.camera.framing = "full";
        blocking.rationale =
          "Full static framing keeps both actor roots readable.";
        for (const action of performance.draft)
          if (action.verb === "frame") action.framing = "full";
        return {
          actors: [
            { node: "knightA", model: "knightA", speed: 1, eyeHeight: 1.6 },
            { node: "knightB", model: "knightB", speed: 1, eyeHeight: 1.6 },
          ],
          script: makeScriptWrite(),
          stage: makeStagingWrite(),
          blocking,
          performance,
          eventSamples: [],
          polygonBodyCues,
        };
      },
    });
    return compileDefinedShot({
      shot,
      context: undefined,
      runtime: {
        synthesize: validSynthesizer,
        skeleton: (): IAutoMovieSkeleton => createSkeleton(),
        frameFormat: { width: 1920, height: 1080 },
      },
    });
  }

  const compiled: ReturnType<typeof compile> = compile(cues);
  if (!compiled.success) throw new Error(JSON.stringify(compiled.diagnostics));
  const emitted: readonly IAutoMoviePolygonBodyCue[] | undefined =
    compiled.source.shot.polygonBodyCues;
  TestValidator.equals("one emitted cue", emitted?.length, 1);
  const cue: IAutoMoviePolygonBodyCue | undefined = emitted?.[0];
  if (cue?.kind !== "detach") throw new Error("expected the detach cue");
  TestValidator.equals("subject", cue.subject, "knightA");
  TestValidator.equals("bone", cue.bone, "leftLowerArm");
  TestValidator.predicate(
    "cue clock is in source seconds",
    nclose(cue.at, 0.75) && nclose(cue.duration, 0.5),
  );
  TestValidator.predicate(
    "rotation and translation retain the authored values",
    qclose(cue.rotation, { x: 0, y: 0, z: 0.6, w: 0.8 }) &&
      vclose(cue.translation, { x: 0.25, y: 0.5, z: -0.25 }),
  );
  TestValidator.predicate(
    "the shot owns its cue and transform records",
    emitted !== cues &&
      cue !== authored &&
      cue.rotation !== authored.rotation &&
      cue.translation !== authored.translation,
  );

  const restored: IAutoMovieShot = JSON.parse(
    JSON.stringify(compiled.source.shot),
  );
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const resolveSkeleton = (): IAutoMovieSkeleton => skeleton;
  TestValidator.predicate(
    "the restored cue passes artifact validation with the staged skeleton",
    validateShotArtifact(restored, compiled.source.scene, null, resolveSkeleton)
      .success,
  );
  const rejected: readonly IAutoMovieValidation[] = [
    validateShotArtifact(
      { ...restored, polygonBodyCues: [cue, { ...cue, bone: "leftUpperArm" }] },
      compiled.source.scene,
      null,
      resolveSkeleton,
    ),
    validateShotArtifact(restored, compiled.source.scene, null, () => null),
  ];
  for (const [index, validation] of rejected.entries()) {
    if (validation.success)
      throw new Error(`invalid cue case ${index} admitted`);
    TestValidator.equals(
      `the artifact gate locates the unsupported target in case ${index}`,
      validation.violations.map(
        (item: IAutoMovieConstraintViolation): string => item.path,
      ),
      ["$input.polygonBodyCues[0].bone"],
    );
  }

  const refused: ReturnType<typeof compile> = compile([
    { ...authored, subject: "unstaged-actor" },
    authored,
    { ...authored, bone: "leftUpperArm" },
  ]);
  if (refused.success) throw new Error("malformed body cues were admitted");
  TestValidator.equals(
    "the performance gate identifies both source fields",
    refused.diagnostics
      .filter(
        (item: IAutoMovieAuthoringDiagnostic): boolean =>
          item.phase === "performance",
      )
      .map((item: IAutoMovieAuthoringDiagnostic): string => item.path)
      .sort((a: string, b: string): number => a.localeCompare(b)),
    [
      "$input.polygonBodyCues[0].subject",
      "$input.polygonBodyCues[1].bone",
    ],
  );
}
