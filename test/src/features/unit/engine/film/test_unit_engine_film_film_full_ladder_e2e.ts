import {
  blockBeat,
  cutSequence,
  forgeCast,
  performShot,
  playbackFrameSamples,
  stageScene,
} from "@automovie/engine";
import {
  type IAutoMovieBlockedBeat,
  type IAutoMovieCut,
  type IAutoMovieForgedCast,
  type IAutoMoviePerformedShot,
  type IAutoMoviePlaybackSample,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  forgeEntry,
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../../../internal/filmFixtures";
import { createSkeleton } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";

/**
 * A source-authored take flows through forging, staging, blocking, performance,
 * cutting and playback without losing its cast, camera or timing.
 *
 * Scenarios:
 *
 * 1. Forge to stage: knightB's stand-in validates and its id is what the staged
 *    scene node carries.
 * 2. Block to perform: the duel blocking validates and the performance realizes it
 *    (anchor covered, camera intent honoured) into a shot with a compiled
 *    camera clip.
 * 3. Cut to playback: a 24 fps one-shot cut runs 2 seconds and has 48 frame samples,
 *    all on `shot:beat-1` starting at its first instant.
 */
export function test_unit_engine_film_film_full_ladder_e2e(): void {
  const script: IAutoMovieScript = makeScriptWrite();

  const forged: IAutoMovieForgedCast = forgeCast(script, {
    entries: [forgeEntry("knightB")],
  });
  TestValidator.equals("forge", forged.success, true);
  if (forged.success !== true) return;

  const staged: IAutoMovieStagedSet = stageScene(script, makeStagingWrite());
  TestValidator.equals("stage", staged.success, true);
  if (staged.success !== true) return;
  TestValidator.equals(
    "the stage wears the forged stand-in",
    staged.scene.nodes.find(
      (n: IAutoMovieSceneNode): boolean => n.id === "knightB",
    )!.model,
    forged.models["knightB"]!.id,
  );

  const blocked: IAutoMovieBlockedBeat = blockBeat(
    script,
    staged,
    makeBlockingWrite(),
  );
  TestValidator.equals("block", blocked.success, true);
  if (blocked.success !== true) return;

  const performed: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    blocking: blocked.blocking,
  });
  TestValidator.equals("perform", performed.success, true);
  if (performed.success !== true) return;
  TestValidator.predicate(
    "the camera move was compiled",
    performed.shot.cameraMotion !== null,
  );

  const cut: IAutoMovieCut = cutSequence(
    {
      sequence: { id: "seq-duel", name: "duel at dawn" },
      fps: 24,
      entries: [{ shot: performed.shot.id, trim: null, transition: null }],
      pacing: "one held take, the beat is the film.",
      continuity: "n/a (single shot).",
    },
    [performed.shot],
  );
  TestValidator.equals("cut", cut.success, true);
  if (cut.success !== true) return;
  TestValidator.predicate("runtime", nclose(cut.runtime, 2));

  const samples: IAutoMoviePlaybackSample[] = playbackFrameSamples(
    cut.sequence,
    [performed.shot],
  );
  TestValidator.equals("frame count", samples.length, 48);
  TestValidator.predicate(
    "first frame opens the shot",
    (): boolean =>
      samples[0]!.shot === "shot:beat-1" && nclose(samples[0]!.time, 0),
  );
  TestValidator.predicate(
    "every frame plays the one shot, hard-cut free",
    samples.every(
      (s: IAutoMoviePlaybackSample): boolean =>
        s.shot === "shot:beat-1" && s.blend === null,
    ),
  );
}
