import type {
  IAutoMovieProductionSoundAnalysis,
  IAutoMovieProductionSoundEvidence,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import {
  parseProductionSoundEvidence,
  verifyProductionNonVideoDeliverables,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

const digest: (value: string) => string = (value: string): string =>
  `sha256:${value.repeat(64).slice(0, 64)}` as string;

const plan: () => IAutoMovieProductionSoundPlan = (): IAutoMovieProductionSoundPlan => ({
  version: 1,
  inputFingerprint: digest("1"),
  fps: 24,
  frameRate: { numerator: 24, denominator: 1 },
  totalFrames: 24,
  sampleRate: 48_000,
  channels: 2,
  events: [],
  cues: [],
  dialogue: [],
});

const analysis: () => IAutoMovieProductionSoundAnalysis = (): IAutoMovieProductionSoundAnalysis => ({
  version: 1,
  sampleRate: 48_000,
  sampleFrames: 48_000,
  runtimeSeconds: 1,
  integratedLoudness: null,
  samplePeak: 0,
  clippingSamples: 0,
  longestSilenceSeconds: 1,
  eventAlignment: [],
});

const evidence: () => IAutoMovieProductionSoundEvidence = (): IAutoMovieProductionSoundEvidence => ({
  version: 2,
  plan: plan(),
  analysis: analysis(),
  tts: [],
  audio: {
    path: "audio.mp4",
    mediaType: "audio/mp4",
    bytes: 128,
    digest: digest("2"),
  },
  measurement: {
    source: "pre-encode-pcm",
    algorithm: "automovie-production-sound-analysis-v1",
  },
});

const refused: (closure: () => unknown, message: string) => boolean = (closure: () => unknown, message: string): boolean => {
  try {
    closure();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(message);
  }
};

const verifySound: (actual: IAutoMovieProductionSoundEvidence | Uint8Array) => ReturnType<typeof verifyProductionNonVideoDeliverables> = (actual: IAutoMovieProductionSoundEvidence | Uint8Array): ReturnType<typeof verifyProductionNonVideoDeliverables> =>
  verifyProductionNonVideoDeliverables({
    caption: null,
    sound: {
      expectedPlan: plan(),
      expectedAnalysis: analysis(),
      expectedTts: [],
      expectedAudio: evidence().audio,
      evidence: actual,
    },
  });

/**
 * Validate semantic closure for final caption and sound evidence bytes.
 *
 * Scenarios:
 * 1. Canonical decoded caption text and complete version-2 sound evidence bind
 *    to their current plans and sibling audio identity.
 * 2. Caption payload substitution, required absence, foreign plan identity,
 *    analysis substitution, and sibling-audio substitution each refuse.
 * 3. Optional absence, empty plans, malformed UTF-8/JSON, legacy schemas,
 *    object input, and non-finite evidence exercise the listed boundaries.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual strict sound evidence parsing and current-owner verification on typed records and UTF-8 bytes, observing verified/absent states and named refusal categories for caption, plan, analysis and sibling audio substitutions.
 * @evidence contracts/testing.md#independent-expectations The current caption, empty sound plan, analysis and audio identity are authored independently; expected outcomes and refusal fragments are literals. Caption equality concerns decoded text, and synthetic audio digests establish record binding without reopening audio, decoding sound or remeasuring PCM.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts exact byte/typed records and optional absence with changed caption, missing required caption, malformed UTF-8/JSON, foreign plan/analysis/audio, non-finite data, legacy/array/incomplete schemas and extra fields; this population does not claim every parser branch or duplicate-key case.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry owns only fixture records, buffers and portable parsing/comparison; no filesystem, TTS service, codec process, renderer, browser or GPU is opened and no production consumer or foreign method is replaced.
 */
export function test_production_media_semantic_closure(): void {
  const caption: string =
    "WEBVTT film\n\nline\n00:00:00.000 --> 00:00:01.000\n<lang en>Hello.</lang>\n";
  const exactEvidence: IAutoMovieProductionSoundEvidence = evidence();
  TestValidator.equals(
    "exact caption and sound identities close against their current owners",
    verifyProductionNonVideoDeliverables({
      caption: {
        required: true,
        expected: caption,
        actual: Buffer.from(caption, "utf8"),
      },
      sound: {
        expectedPlan: plan(),
        expectedAnalysis: analysis(),
        expectedTts: [],
        expectedAudio: exactEvidence.audio,
        evidence: Buffer.from(`${JSON.stringify(exactEvidence)}\n`, "utf8"),
      },
    }),
    { caption: "verified", sound: "verified" },
  );
  TestValidator.equals(
    "absent optional populations and direct typed evidence retain exact states",
    {
      absent: verifyProductionNonVideoDeliverables({
        caption: { required: false, expected: "", actual: null },
        sound: null,
      }),
      typed: verifySound(exactEvidence),
      parsed: parseProductionSoundEvidence(
        Buffer.from(JSON.stringify(exactEvidence), "utf8"),
      ).version,
    },
    {
      absent: { caption: "absent", sound: "absent" },
      typed: { caption: "absent", sound: "verified" },
      parsed: 2,
    },
  );
  const foreignPlan: IAutoMovieProductionSoundEvidence = evidence();
  foreignPlan.plan.inputFingerprint = digest("3");
  const changedAnalysis: IAutoMovieProductionSoundEvidence = evidence();
  changedAnalysis.analysis.sampleFrames = 47_999;
  const changedAudio: IAutoMovieProductionSoundEvidence = evidence();
  changedAudio.audio.digest = digest("4");
  const nonFinite: IAutoMovieProductionSoundEvidence = evidence();
  nonFinite.analysis.samplePeak = Number.POSITIVE_INFINITY;
  TestValidator.equals(
    "semantic substitutions and malformed evidence fail closed",
    {
      captionText: refused(
        (): ReturnType<typeof verifyProductionNonVideoDeliverables> =>
          verifyProductionNonVideoDeliverables({
            caption: {
              required: true,
              expected: caption,
              actual: Buffer.from(caption.replace("Hello", "Foreign"), "utf8"),
            },
            sound: null,
          }),
        "complete current canonical",
      ),
      captionMissing: refused(
        (): ReturnType<typeof verifyProductionNonVideoDeliverables> =>
          verifyProductionNonVideoDeliverables({
            caption: { required: true, expected: caption, actual: null },
            sound: null,
          }),
        "Required current caption",
      ),
      captionUtf8: refused(
        (): ReturnType<typeof verifyProductionNonVideoDeliverables> =>
          verifyProductionNonVideoDeliverables({
            caption: {
              required: true,
              expected: caption,
              actual: Uint8Array.from([0xc3, 0x28]),
            },
            sound: null,
          }),
        "not valid UTF-8",
      ),
      foreignPlan: refused(
        (): ReturnType<typeof verifySound> => verifySound(foreignPlan),
        "complete current plan",
      ),
      changedAnalysis: refused(
        (): ReturnType<typeof verifySound> => verifySound(changedAnalysis),
        "complete current plan",
      ),
      changedAudio: refused(
        (): ReturnType<typeof verifySound> => verifySound(changedAudio),
        "sibling audio identity",
      ),
      nonFinite: refused((): ReturnType<typeof verifySound> => verifySound(nonFinite), "non-finite"),
      legacy: refused(
        (): IAutoMovieProductionSoundEvidence =>
          parseProductionSoundEvidence(
            Buffer.from(JSON.stringify({ ...evidence(), version: 1 }), "utf8"),
          ),
        "version-2",
      ),
      arrayRoot: refused(
        (): IAutoMovieProductionSoundEvidence =>
          parseProductionSoundEvidence(
            Buffer.from(JSON.stringify([{ version: 2 }]), "utf8"),
          ),
        "version-2",
      ),
      incomplete: refused(
        (): IAutoMovieProductionSoundEvidence =>
          parseProductionSoundEvidence(
            Buffer.from(JSON.stringify({ version: 2 }), "utf8"),
          ),
        "complete version-2",
      ),
      foreignField: refused(
        (): IAutoMovieProductionSoundEvidence =>
          parseProductionSoundEvidence(
            Buffer.from(
              JSON.stringify({ ...evidence(), aggregateOnly: true }),
              "utf8",
            ),
          ),
        "complete version-2",
      ),
      invalidJson: refused(
        (): IAutoMovieProductionSoundEvidence => parseProductionSoundEvidence(Buffer.from("{", "utf8")),
        "not valid UTF-8 JSON",
      ),
      invalidUtf8: refused(
        (): IAutoMovieProductionSoundEvidence => parseProductionSoundEvidence(Uint8Array.from([0xc3, 0x28])),
        "not valid UTF-8 JSON",
      ),
    },
    {
      captionText: true,
      captionMissing: true,
      captionUtf8: true,
      foreignPlan: true,
      changedAnalysis: true,
      changedAudio: true,
      nonFinite: true,
      legacy: true,
      arrayRoot: true,
      incomplete: true,
      foreignField: true,
      invalidJson: true,
      invalidUtf8: true,
    },
  );
}
