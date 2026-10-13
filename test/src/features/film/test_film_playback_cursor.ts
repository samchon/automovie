import { IAutoMoviePlaybackTimeline } from "../../../../packages/engine/src/film/IAutoMoviePlaybackTimeline";
import { IAutoMoviePlaybackEntry } from "../../../../packages/engine/src/film/IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackSample } from "../../../../packages/engine/src/film/IAutoMoviePlaybackSample";
import { cutSequence } from "../../../../packages/engine/src/film/cutSequence";
import { playbackCursor } from "../../../../packages/engine/src/film/playbackCursor";
import { resolveFromTimeline } from "../../../../packages/engine/src/film/resolveFromTimeline";
import { sequenceTimeline } from "../../../../packages/engine/src/film/sequenceTimeline";
import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

function shot (id: string, duration: number): IAutoMovieShot { return ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
}); }

/** Compare categorical sample fields exactly and clocks/weights within numerical tolerance. */
function sameSample (
  a: IAutoMoviePlaybackSample,
  b: IAutoMoviePlaybackSample,
): boolean {
  if (a.shot !== b.shot) return false;
  if (!nclose(a.time, b.time)) return false;
  if (a.blend === null || b.blend === null) return a.blend === b.blend;
  return (
    a.blend.shot === b.blend.shot &&
    nclose(a.blend.time, b.blend.time) &&
    nclose(a.blend.alpha, b.blend.alpha)
  );
}

/**
 * The forward-only {@link playbackCursor} must land on exactly the live entry
 * the stateless binary-search resolver would, so a whole-film sweep agrees on
 * categorical fields and numerical samples. The sweep reuses its position
 * instead of searching all entry starts independently for each frame.
 *
 * The cursor advances only forward (feeding it a non-decreasing clock is its
 * precondition), so both a hand-laid transition sequence and a large-N tiling
 * are swept in monotone frame order and compared against the scan at every
 * instant, including exact entry-start instants and the middle of a
 * cross-dissolve, where the incoming shot must win in both resolvers.
 *
 * Scenarios:
 * 1. A dense monotone clock crosses trims and a dissolve while visiting both shots.
 * 2. Every exact entry start and a full-overlap equal start select the incoming shot.
 * 3. A 200-shot tiling preserves selection and runtime across a monotone sweep.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the forward cursor across real layouts and compares shot, local clock and blend fields with the stateless resolver, catching skipped starts, incorrect equal-start precedence and stale cursor position across long edits.
 * @evidence contracts/testing.md#independent-expectations The stateless binary search independently selects the last entry start at or before each query, so it checks cursor advancement; both readers share playbackSampleAt and cannot independently detect a common clock/blend formula bug, which the hand-calculated resolver test owns. Authored one-second spans require runtime 200 and 200 visited shots.
 * @evidence contracts/testing.md#distinguishing-cases Covers dense transitions, exact boundaries, equal starts allowed by full overlap and a long hard-cut edit under the documented monotone-clock precondition; random-access refusal and event seams belong to test_film_playback_resolver.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit entry owns all clock sweeps and numerical comparisons with source functions; it starts no playback host, browser, renderer or native build.
 */
export function test_film_playback_cursor (): void {
  // Hand-laid sequence with a trim and a dissolve: entry starts 0 / 3 / 4.5,
  // runtime 7.5 (the transition overlap [4.5, 5) has entry 1 AND entry 2 live).
  const shots: IAutoMovieShot[] = [shot("shot:beat-1", 3), shot("shot:beat-2", 4)];
  const sequence: IAutoMovieSequence = {
    id: "seq",
    name: null,
    fps: 24,
    shots: [
      { shot: "shot:beat-1", trim: null, transition: null },
      {
        shot: "shot:beat-2",
        trim: { start: 0.5, duration: 2 },
        transition: null,
      },
      {
        shot: "shot:beat-1",
        trim: null,
        transition: { kind: "crossDissolve", duration: 0.5 },
      },
    ],
  };
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(sequence, shots);
  const cursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(sequence, timeline);

  // Dense monotone sweep at 240 Hz across [0, runtime): the cursor sample must
  // equal the scan sample at every instant, and the sweep must actually cross
  // the transition (a blend is produced) and every entry (all shots seen).
  const rate: number = 240;
  const count: number = Math.floor(timeline.runtime * rate);
  let sawBlend: boolean = false;
  const seen: Set<string> = new Set<string>();
  for (let i: number = 0; i < count; ++i) {
    const t: number = i / rate;
    const scan: IAutoMoviePlaybackSample = resolveFromTimeline(sequence, timeline, t);
    const cur: IAutoMoviePlaybackSample = cursor(t);
    TestValidator.predicate(
      `cursor==scan at t=${t.toFixed(4)}`,
      sameSample(cur, scan),
    );
    if (cur.blend !== null) sawBlend = true;
    seen.add(cur.shot);
  }
  TestValidator.predicate("sweep crossed a transition (blend seen)", sawBlend);
  TestValidator.equals(
    "sweep visited every distinct shot",
    [...seen].sort((a: string, b: string) : number => a.localeCompare(b)),
    ["shot:beat-1", "shot:beat-2"],
  );

  // Exact entry-start instants: at a start the cursor must have advanced onto
  // the new entry (incoming wins), matching the scan.
  for (const start of timeline.entries.map((e: IAutoMoviePlaybackEntry) : number => e.start)) {
    const freshCursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(sequence, timeline);
    TestValidator.predicate(
      `cursor==scan exactly at entry start ${start}`,
      sameSample(
        freshCursor(start),
        resolveFromTimeline(sequence, timeline, start),
      ),
    );
  }

  // A FULL-overlap dissolve (`transition.duration === previousPlayed`) makes two
  // adjacent entry starts EQUAL: entry starts are non-decreasing, not strictly
  // increasing, and cutSequence allows it (only `> previousPlayed` is rejected).
  // The cursor's `start <= seconds` advance must still land on the highest such
  // index (the incoming shot), matching the scan (#1250-adjacent, the corrected
  // playbackCursor invariant).
  const overlapShots: IAutoMovieShot[] = [shot("shot:a", 1), shot("shot:b", 1)];
  const overlapSequence: IAutoMovieSequence = {
    id: "overlap",
    name: null,
    fps: 24,
    shots: [
      { shot: "shot:a", trim: null, transition: null },
      {
        shot: "shot:b",
        trim: null,
        transition: { kind: "crossDissolve", duration: 1 }, // === a's played span
      },
    ],
  };
  TestValidator.equals(
    "cutSequence accepts a full-overlap dissolve (equal adjacent starts)",
    cutSequence(
      {
        sequence: { id: "overlap", name: "overlap" },
        fps: 24,
        entries: overlapSequence.shots,
        pacing: "a full cross-dissolve from a into b.",
        continuity: "b opens exactly as a ends.",
      },
      overlapShots,
    ).success,
    true,
  );
  const overlapTimeline: IAutoMoviePlaybackTimeline = sequenceTimeline(overlapSequence, overlapShots);
  TestValidator.predicate(
    "the full overlap makes the two entry starts equal",
    nclose(overlapTimeline.entries[0]!.start, overlapTimeline.entries[1]!.start),
  );
  const overlapCursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(overlapSequence, overlapTimeline);
  TestValidator.predicate(
    "at the shared start the cursor lands on the incoming entry, like the scan",
    sameSample(
      overlapCursor(overlapTimeline.entries[1]!.start),
      resolveFromTimeline(
        overlapSequence,
        overlapTimeline,
        overlapTimeline.entries[1]!.start,
      ),
    ),
  );

  // Large-N tiling: 200 back-to-back 1 s shots (no trims/transitions), swept
  // per second: the cursor advances across at most 200 entries while the
  // stateless resolver searches again each call; both samples must agree.
  const bigShots: IAutoMovieShot[] = Array.from({ length: 200 }, (_: unknown, i: number) : IAutoMovieShot =>
    shot(`shot:beat-${i}`, 1),
  );
  const bigSequence: IAutoMovieSequence = {
    id: "big",
    name: null,
    fps: 24,
    shots: bigShots.map((s: IAutoMovieShot) : { shot: string; trim: null; transition: null; } => ({ shot: s.id, trim: null, transition: null })),
  };
  const bigTimeline: IAutoMoviePlaybackTimeline = sequenceTimeline(bigSequence, bigShots);
  TestValidator.predicate("large-N runtime", nclose(bigTimeline.runtime, 200));
  const bigCursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(bigSequence, bigTimeline);
  const bigSeen: Set<string> = new Set<string>();
  for (let i: number = 0; i < 200 * 4; ++i) {
    const t: number = i / 4; // 4 Hz sweep, monotone
    const scan: IAutoMoviePlaybackSample = resolveFromTimeline(bigSequence, bigTimeline, t);
    const cur: IAutoMoviePlaybackSample = bigCursor(t);
    TestValidator.predicate(
      `large cursor==scan at t=${t}`,
      sameSample(cur, scan),
    );
    bigSeen.add(cur.shot);
  }
  TestValidator.equals("large-N visited all 200 shots", bigSeen.size, 200);
}
