import { canonicalizeAutoMovieJson, productionFilmEffectEditFingerprint } from "@automovie/engine";
import { IAutoMovieFilmTimeline } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";


import { filmEffectCue, filmEffectTimeline } from "./filmEffectRuntimeFixtures";

/**
 * The effect edit digest follows normalized edit fields and excludes builder provenance.
 *
 * Scenarios:
 * 1. Compare a literal canonical edit record with the engine digest using Node SHA-256.
 * 2. Changing builder provenance preserves the digest.
 * 3. Changing edit length, segment source, effect intensity or rational rate changes it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls productionFilmEffectEditFingerprint and compares protocol hashing plus equal/different digest outcomes, catching included provenance or omitted executable edit fields.
 * @evidence contracts/testing.md#independent-expectations A hand-authored canonical JSON record and Node crypto determine the baseline hash; chosen edits change fields declared by the edit protocol. Observed different digests are witnesses, not a proof that SHA-256 is collision-free.
 * @evidence contracts/testing.md#distinguishing-cases Pairs unchanged executable state with changed provenance and four executable edits; runtime population staleness and malformed effect admission are checked by the neighbouring effect tests.
 * @evidence contracts/testing.md#execution-ownership This synchronous discoverable entry owns portable engine/Node digest parity in one process; it neither runs a browser nor proves a cross-host byte replay or rendered effect.
 */
export function test_film_effect_edit_fingerprint(): void {
  const nodeProtocolDigest: (timeline: IAutoMovieFilmTimeline) => string = (
    timeline: IAutoMovieFilmTimeline,
  ): string =>
    `sha256:${createHash("sha256")
      .update(
        canonicalizeAutoMovieJson({
          protocol: "automovie.production-render-edit.v2",
          id: timeline.id,
          fps: timeline.fps,
          frameRate: timeline.frameRate,
          totalFrames: timeline.totalFrames,
          segments: timeline.segments,
          omissions: timeline.omissions,
          tracks: timeline.tracks,
        }),
        "utf8",
      )
      .digest("hex")}`;
  const minimal: IAutoMovieFilmTimeline = {
    ...filmEffectTimeline([]),
    id: "f",
    totalFrames: 1,
    segments: [],
  };
  const text: string =
    '{"fps":24,"id":"f","omissions":[],"protocol":"automovie.production-render-edit.v2","segments":[],"totalFrames":1,"tracks":{"audio":[],"captions":[],"effects":[]}}';
  TestValidator.equals(
    "a minimal edit hashes its hand-written canonical protocol text",
    [productionFilmEffectEditFingerprint(minimal), nodeProtocolDigest(minimal)],
    [
      `sha256:${createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex")}`,
      `sha256:${createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex")}`,
    ],
  );

  const base: IAutoMovieFilmTimeline = filmEffectTimeline();
  const fingerprint: string = productionFilmEffectEditFingerprint(base);
  TestValidator.equals(
    "a full edit has one fingerprint through the engine and through Node",
    fingerprint,
    nodeProtocolDigest(base),
  );
  TestValidator.equals(
    "only edit fields move the fingerprint",
    {
      compileInput:
        productionFilmEffectEditFingerprint({
          ...base,
          inputFingerprint: `sha256:${"e".repeat(64)}`,
        }) === fingerprint,
      sourceDigest:
        productionFilmEffectEditFingerprint({
          ...base,
          sourceDigest: `sha256:${"e".repeat(64)}`,
        }) === fingerprint,
      builder:
        productionFilmEffectEditFingerprint({ ...base, builder: "other" }) ===
        fingerprint,
      totalFrames:
        productionFilmEffectEditFingerprint({ ...base, totalFrames: 49 }) ===
        fingerprint,
      sourceFrame:
        productionFilmEffectEditFingerprint({
          ...base,
          segments: [{ ...base.segments[0]!, sourceInFrame: 1 }],
        }) === fingerprint,
      intensity:
        productionFilmEffectEditFingerprint({
          ...base,
          tracks: {
            ...base.tracks,
            effects: [
              filmEffectCue({ intensity: 0.25 }),
              base.tracks.effects[1]!,
            ],
          },
        }) === fingerprint,
      frameRate:
        productionFilmEffectEditFingerprint({
          ...base,
          frameRate: { numerator: 24, denominator: 1 },
        }) === fingerprint,
    },
    {
      compileInput: true,
      sourceDigest: true,
      builder: true,
      totalFrames: false,
      sourceFrame: false,
      intensity: false,
      frameRate: false,
    },
  );
}
