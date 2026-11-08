import {
  type IAutoMovieCut,
  type IAutoMoviePlaybackSample,
  type IAutoMoviePlaybackTimeline,
  cutSequence,
  resolveFromTimeline,
  sequenceTimeline,
} from "@automovie/engine";
import { type IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Resolve a continuous performance through the public Engine entry point.
 * The engine-node compiler profile runs this same entry without DOM libraries.
 *
 * Scenarios:
 * 1. Admit a two-second continuous performance at four frames per second.
 * 2. Resolve its first, interior and final encoded instants in reverse order.
 * 3. Repeated samples own their records and preserve the authored local clock.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public cutSequence, sequenceTimeline and resolveFromTimeline, checking admitted runtime, shot identity, local time, absent blend and independently owned samples. The engine-node profile also compiles this real public consumer without browser declarations.
 * @evidence contracts/testing.md#independent-expectations The authored two-second shot at four fps has encoded instants i/4 for i from zero through seven, and an untrimmed continuous shot keeps output time as its local time. Hand-authored instants 0, 0.75 and 1.75 supply the oracle without deriving it from the resolver.
 * @evidence contracts/testing.md#distinguishing-cases Covers the opening, an interior instant, the final encoded instant, reverse-order access and repeated-sample ownership. Existing playback tests own trims, transitions and invalid clocks; quadratic workspace/program tests run beside this entry in the Node-only profile.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_engine_node_clock entry invokes portable Engine source without installing a consumer, building a native artifact or starting a process, browser or GPU. The tracked engineNode executable also calls it under the Node-only compiler profile.
 */
export function test_engine_node_clock(): void {
  const shot: IAutoMovieShot = {
    id: "continuous-performance",
    name: null,
    scene: "stage",
    camera: "audience",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration: 2,
  };
  const cut: IAutoMovieCut = cutSequence(
    {
      sequence: { id: "continuous-cut", name: "Continuous performance" },
      fps: 4,
      entries: [{ shot: shot.id, trim: null, transition: null }],
      pacing: "One continuous performance.",
      continuity: "No restart across sampled instants.",
    },
    [shot],
  );
  TestValidator.equals("continuous cut admitted", cut.success, true);
  if (!cut.success) throw new Error("Continuous cut was refused.");

  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(cut.sequence, [
    shot,
  ]);
  TestValidator.predicate("two-second runtime", nclose(timeline.runtime, 2));
  for (const seconds of [1.75, 0.75, 0]) {
    const sample: IAutoMoviePlaybackSample = resolveFromTimeline(
      cut.sequence,
      timeline,
      seconds,
    );
    TestValidator.equals("continuous shot", sample.shot, shot.id);
    TestValidator.predicate("untrimmed local clock", nclose(sample.time, seconds));
    TestValidator.equals("no transition", sample.blend, null);
  }

  const first: IAutoMoviePlaybackSample = resolveFromTimeline(
    cut.sequence,
    timeline,
    0.75,
  );
  first.time = 99;
  const repeated: IAutoMoviePlaybackSample = resolveFromTimeline(
    cut.sequence,
    timeline,
    0.75,
  );
  TestValidator.predicate("independent sample record", first !== repeated);
  TestValidator.predicate("repeated local clock", nclose(repeated.time, 0.75));
}
