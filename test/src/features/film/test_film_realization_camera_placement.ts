import type { IAutoMovieBlocking, IAutoMoviePerformance, IAutoMovieActionCall, IAutoMovieSkeleton, IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieCameraDepthPrecisionReport, IAutoMovieCamera, IAutoMovieShotProgram } from "@automovie/interface";
import type { IAutoMovieCompiledDefinedShot } from "../../../../packages/engine/src/film/IAutoMovieCompiledDefinedShot";
import type { IAutoMovieResolvedCamera } from "../../../../packages/engine/src/film/IAutoMovieResolvedCamera";
import { compileDefinedShot } from "../../../../packages/engine/src/film/compileDefinedShot";
import { defineShot } from "../../../../packages/engine/src/film/defineShot";
import { resolveCameraAt } from "../../../../packages/engine/src/film/resolveCameraAt";
import { TestValidator } from "@nestia/e2e";
import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts, qclose, vclose } from "../internal/predicates";

/**
 * The duel program with the camera framed exactly as `framed` asks. Dropping the `frame` action leaves the beat locked off on the staged camera, which is the shape every artifact carried before a placement existed to record.
 */
const program: (framed: boolean) => IAutoMovieShotProgram = (framed: boolean): IAutoMovieShotProgram => {
  const blocking: IAutoMovieBlocking = makeBlockingWrite();
  const performance: IAutoMoviePerformance = makePerformanceWrite();
  blocking.camera.framing = "full";
  blocking.rationale =
    "full static keeps both required actor roots readable throughout the duel.";
  for (const action of performance.draft)
    if (action.verb === "frame") action.framing = "full";
  if (framed === false)
    performance.draft = performance.draft.filter(
      (action: IAutoMovieActionCall): boolean => action.verb !== "frame",
    );
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
  };
};

/** Compile the original framed or locked duel through real shot definition and the existing deterministic synthesizer. */
const compile: (framed: boolean) => IAutoMovieCompiledDefinedShot = (framed: boolean): IAutoMovieCompiledDefinedShot =>
  compileDefinedShot({
    shot: defineShot(framed ? "SB-FRAMED" : "SB-LOCKED", {
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
          requiredSubjects: ["knightA"],
          maxOcclusionRatio: 0.2,
        },
        events: [],
        reviewFrames: [{ id: "impact", time: 1, passes: ["beauty"] }],
      },
      build: (): IAutoMovieShotProgram => program(framed),
    }),
    context: undefined,
    runtime: {
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
      advice: [],
    },
  });

/**
 * A compiled realization states the camera it measured whenever a `frame` action moved the shot off its staged camera.
 *
 * The staged transform and the action are not rivals: `compileCameraMove` keeps the staged bearing and replaces the distance with the one the framing demands, so a camera staged for a wide can be solved to a fraction of that stand-off while `scene.cameras[i].transform` in the same artifact still reads exactly as authored. Every static camera fact the artifact carried therefore described the solve's input rather than the frame, and an author reading it concluded the camera was fine. The placement is that missing fact, recorded at each sample the realization already measured.
 *
 * Scenarios:
 *
 * 1. A framed beat carries a placement at every camera sample, and it is exactly
 * the camera `resolveCameraAt` gives the renderer at that instant.
 * 2. That placement is a different point from the staged transform, which is
 * what makes the record worth writing.
 * 3. A beat with no `frame` action compiles no move and records no placement. Independent depth precision belongs to the dedicated depth tests; the former copied report decimals are removed from this entry.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles framed and locked programs and observes actual camera-motion membership, recorded placement and preservation of staged camera inputs; recorded framed placement is compared through the renderer's camera resolver seam.
 * @evidence contracts/testing.md#independent-expectations The authored staged position and framed-versus-locked contract provide independent changed/unchanged expectations; the shared resolver comparison proves agreement between consumers rather than an independent camera-solve algorithm, and copied depth-report decimals are not used as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Keeps framed and locked successful compilation, moved placement at every sample, unchanged staged translation and absence of locked placements; independent depth precision is owned by its dedicated tests.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_realization_camera_placement and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_realization_camera_placement(): void {
  const framed: IAutoMovieCompiledDefinedShot = compile(true);
  const locked: IAutoMovieCompiledDefinedShot = compile(false);
  const staged: { x: number; y: number; z: number; } = { x: 2, y: 1.5, z: 0.35 };
  TestValidator.equals(
    "a realization records the camera a compiled move actually renders",
    namedFacts([
      ["framedSuccess", (): boolean => framed.success],
      ["lockedSuccess", (): boolean => locked.success],
      [
        "framedHasMove",
        (): boolean => framed.success && framed.source.shot.cameraMotion !== null,
      ],
      [
        "lockedHasNoMove",
        (): boolean => locked.success && locked.source.shot.cameraMotion === null,
      ],
      [
        "framedSamplesCarryPlacement",
        (): boolean =>
          framed.success &&
          framed.realization.camera.length > 0 &&
          framed.realization.camera.every(
            (outcome: { time: number; placement?: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; }; depthPrecision: IAutoMovieCameraDepthPrecisionReport; requiredSubjects: number; resolvedSubjects: number; readableSubjects: number; passed: boolean; }): boolean => outcome.placement !== undefined,
          ),
      ],
      [
        "framedPlacementIsTheRenderedCamera",
        (): boolean =>
          framed.success &&
          framed.realization.camera.every((outcome: { time: number; placement?: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; }; depthPrecision: IAutoMovieCameraDepthPrecisionReport; requiredSubjects: number; resolvedSubjects: number; readableSubjects: number; passed: boolean; }): boolean => {
            const camera: IAutoMovieCamera = framed.source.scene.cameras.find(
              (candidate: IAutoMovieCamera): boolean => candidate.id === framed.source.shot.camera,
            )!;
            const rendered: IAutoMovieResolvedCamera = resolveCameraAt(
              camera.transform,
              framed.source.shot.cameraMotion,
              camera.id,
              outcome.time,
            );
            return (
              outcome.placement !== undefined &&
              vclose(outcome.placement.position, rendered.position, 0) &&
              qclose(outcome.placement.rotation, rendered.rotation, 0)
            );
          }),
      ],
      [
        "framedStagedCameraIsUnchanged",
        (): boolean =>
          framed.success &&
          vclose(
            framed.source.scene.cameras.find(
              (candidate: IAutoMovieCamera): boolean => candidate.id === framed.source.shot.camera,
            )!.transform.translation,
            staged,
          ),
      ],
      [
        "framedPlacementLeavesTheStagedPoint",
        (): boolean =>
          framed.success &&
          framed.realization.camera.every(
            (outcome: { time: number; placement?: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; }; depthPrecision: IAutoMovieCameraDepthPrecisionReport; requiredSubjects: number; resolvedSubjects: number; readableSubjects: number; passed: boolean; }): boolean =>
              outcome.placement !== undefined &&
              vclose(outcome.placement.position, staged) === false,
          ),
      ],
      [
        "lockedSamplesCarryNoPlacement",
        (): boolean =>
          locked.success &&
          locked.realization.camera.length > 0 &&
          locked.realization.camera.every(
            (outcome: { time: number; placement?: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; }; depthPrecision: IAutoMovieCameraDepthPrecisionReport; requiredSubjects: number; resolvedSubjects: number; readableSubjects: number; passed: boolean; }): boolean => "placement" in outcome === false,
          ),
      ],
    ]),
    {
      framedSuccess: true,
      lockedSuccess: true,
      framedHasMove: true,
      lockedHasNoMove: true,
      framedSamplesCarryPlacement: true,
      framedPlacementIsTheRenderedCamera: true,
      framedStagedCameraIsUnchanged: true,
      framedPlacementLeavesTheStagedPoint: true,
      lockedSamplesCarryNoPlacement: true,
    },
  );
}
