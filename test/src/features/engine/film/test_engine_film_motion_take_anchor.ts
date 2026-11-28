import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieCut,
  IAutoMovieMotionTake,
  IAutoMovieMotionTakeAnchor,
  IAutoMoviePreparePlaybackTimeline,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * A versioned take binds one editable occurrence to exact output and source
 * seconds.
 *
 * Scenarios:
 *
 * 1. A numeric trim whose sum rounds outward shares exactly 0.3 source seconds
 *    with its retimed successor.
 * 2. A dissolve needs an explicit occurrence and maps both selected shots on their
 *    own clock.
 * 3. At sequence end only the outgoing side exists. At sequence start only the
 *    incoming side exists.
 * 4. Admission rejects bad versions, incidental payloads, and native restore.
 *    Verification rejects stale bytes and anchor coordinates.
 * 5. A source span too small to advance the global end does not own the left side
 *    of that endpoint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify exact retimed seam ownership, overlap selection, start and end sides and malformed or stale versioned inputs.
 * @evidence contracts/development/testing.md#behavioral-verification The test prepares and queries a playback layout, resolves anchors and checks addresses and refusal. It varies occurrence, overlap and endpoint conditions and invokes separate admission and verification decisions.
 * @evidence contracts/development/testing.md#independent-expectations The authored retimed join shares source second 0.3, even when a numeric sum rounds outward. Each dissolve occurrence has its own source clock. The first and last sequence boundaries have only one supported side, and an unrepresentable output extension cannot own a preceding side.
 */
export function test_engine_film_motion_take_anchor(): void {
  const shot: IAutoMovieShot = {
    id: "source",
    name: null,
    scene: "stage",
    camera: "wide",
    cameraMotion: null,
    duration: 2,
    performances: [],
    objectMotions: [],
  };
  const incoming: IAutoMovieShot = { ...shot, id: "incoming" };
  const cut: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      sequence: { id: "sequence", name: "Sequence" },
      fps: 24,
      entries: [
        {
          shot: shot.id,
          trim: { start: 0.1, duration: 0.2 },
          transition: null,
        },
        {
          shot: shot.id,
          trim: { start: 0.3, duration: 1 },
          playbackRate: 2,
          transition: null,
        },
        {
          shot: incoming.id,
          trim: null,
          transition: { kind: "crossDissolve", duration: 0.15 },
        },
      ],
      pacing: "Reach the next view.",
      continuity: "Keep the source seam.",
    },
    [shot, incoming],
  );
  if (!cut.success) throw new Error("the three-entry cut must pass");
  const layout: IAutoMoviePreparePlaybackTimeline.IResult =
    AutoMovieEngineFilm.preparePlaybackTimeline(cut.sequence, [shot, incoming]);
  const before: IAutoMovieMotionTakeAnchor = AutoMovieEngineFilm.resolveMotionTakeAnchor(
    cut.sequence,
    layout,
    {
      outputSeconds: 0.2,
      side: "before",
    },
  );
  const after: IAutoMovieMotionTakeAnchor = AutoMovieEngineFilm.resolveMotionTakeAnchor(
    cut.sequence,
    layout,
    {
      outputSeconds: 0.2,
    },
  );
  TestValidator.predicate(
    "both sides share the exact source instant",
    before.entry === 0 &&
      after.entry === 1 &&
      before.sourceSeconds === 0.3 &&
      after.sourceSeconds === 0.3,
  );

  const overlapSeconds: number = 0.575;
  refuses("take-overlap", (): unknown =>
    AutoMovieEngineFilm.resolveMotionTakeAnchor(cut.sequence, layout, {
      outputSeconds: overlapSeconds,
    }),
  );
  const outgoingOverlap: IAutoMovieMotionTakeAnchor = AutoMovieEngineFilm.resolveMotionTakeAnchor(
    cut.sequence,
    layout,
    { outputSeconds: overlapSeconds, entry: 1 },
  );
  const incomingOverlap: IAutoMovieMotionTakeAnchor = AutoMovieEngineFilm.resolveMotionTakeAnchor(
    cut.sequence,
    layout,
    { outputSeconds: overlapSeconds, entry: 2 },
  );
  TestValidator.predicate(
    "overlap keeps both source clocks",
    outgoingOverlap.shot === shot.id &&
      incomingOverlap.shot === incoming.id &&
      nclose(outgoingOverlap.sourceSeconds, 1.05) &&
      nclose(incomingOverlap.sourceSeconds, 0.025),
  );
  refuses("take-entry", (): unknown =>
    AutoMovieEngineFilm.resolveMotionTakeAnchor(cut.sequence, layout, {
      outputSeconds: overlapSeconds,
      entry: 0,
    }),
  );

  const end: IAutoMovieMotionTakeAnchor = AutoMovieEngineFilm.resolveMotionTakeAnchor(
    cut.sequence,
    layout,
    { outputSeconds: cut.runtime, side: "before" },
  );
  TestValidator.predicate(
    "sequence end is the exact source end",
    end.sourceSeconds === 2,
  );
  refuses("take-side", (): unknown =>
    AutoMovieEngineFilm.resolveMotionTakeAnchor(cut.sequence, layout, {
      outputSeconds: 0,
      side: "before",
    }),
  );
  refuses("take-side", (): unknown =>
    AutoMovieEngineFilm.resolveMotionTakeAnchor(cut.sequence, layout, {
      outputSeconds: cut.runtime,
    }),
  );

  const steady: IAutoMovieShot = { ...shot, duration: 1 };
  const tiny: IAutoMovieShot = { ...incoming, duration: Number.EPSILON / 4 };
  const collapsed: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      sequence: { id: "coincident", name: "Coincident" },
      fps: 24,
      entries: [steady, tiny].map((item: IAutoMovieShot) => ({
        shot: item.id,
        trim: null,
        transition: null,
      })),
      pacing: "Retain both authored source spans.",
      continuity: "Read the left side of the final output instant.",
    },
    [steady, tiny],
  );
  if (!collapsed.success) throw new Error("default-rate edit must pass");
  const collapsedLayout: IAutoMoviePreparePlaybackTimeline.IResult =
    AutoMovieEngineFilm.preparePlaybackTimeline(collapsed.sequence, [steady, tiny]);
  const collapsedEnd: IAutoMovieMotionTakeAnchor = AutoMovieEngineFilm.resolveMotionTakeAnchor(
    collapsed.sequence,
    collapsedLayout,
    { outputSeconds: 1, side: "before" },
  );
  TestValidator.predicate(
    "left side skips a final occurrence with no representable output span",
    collapsedLayout.timeline.entries[1]?.start === 1 &&
      collapsedLayout.timeline.runtime === 1 &&
      collapsedEnd.entry === 0 &&
      collapsedEnd.shot === steady.id &&
      collapsedEnd.sourceSeconds === 1,
  );

  const take: IAutoMovieMotionTake = {
    version: 1,
    production: "stage",
    take: "first",
    replay: "authored",
    source: { module: "src/take.ts", export: "createMotionTakeSource" },
    anchor: before,
    provenance: {
      files: [{ path: "src/take.ts", sha256: "a".repeat(64) }],
      providers: [{ id: "motions", version: "1" }],
      seeds: [{ id: "performance", value: "seed" }],
    },
  };
  const admitted: IAutoMovieMotionTake = AutoMovieEngineFilm.admitMotionTake(
    JSON.parse(JSON.stringify(take)),
  );
  AutoMovieEngineFilm.verifyMotionTake(admitted, take);
  refuses("take-version", (): unknown =>
    AutoMovieEngineFilm.admitMotionTake({ ...take, version: 2 }),
  );
  refuses("take-replay", (): unknown =>
    AutoMovieEngineFilm.admitMotionTake({ ...take, replay: "native" }),
  );
  refuses("take-schema", (): unknown =>
    AutoMovieEngineFilm.admitMotionTake({ ...take, frames: [] }),
  );
  refuses("take-schema", (): unknown =>
    AutoMovieEngineFilm.admitMotionTake({
      ...take,
      source: { ...take.source, module: "src/COM1.ts" },
    }),
  );
  refuses("take-anchor", (): unknown =>
    AutoMovieEngineFilm.verifyMotionTake(admitted, { ...take, anchor: after }),
  );
  refuses("take-provenance", (): unknown =>
    AutoMovieEngineFilm.verifyMotionTake(admitted, {
      ...take,
      provenance: {
        ...take.provenance,
        files: [{ path: take.source.module, sha256: "b".repeat(64) }],
      },
    }),
  );
}

/** Assert a failure escaped through the expected diagnostic boundary. */
function refuses(code: string, run: () => unknown): void {
  try {
    run();
  } catch (error) {
    TestValidator.predicate(
      code,
      error instanceof Error && error.message.startsWith(`${code}:`),
    );
    return;
  }
  throw new Error(`Expected ${code}`);
}
